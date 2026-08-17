-- Ser Dono — Módulo "Assistente de Contrato" (pedido do dono do produto,
-- 17/08/2026). Usuário escolhe um tipo de contrato (Prestação de Serviços,
-- Compra e Venda, Sociedade, Fornecimento Recorrente), preenche seus dados
-- e os da contraparte, e o sistema gera o documento a partir de cláusulas
-- FIXAS (packages/core/contrato.ts) + substituição de campos — nunca texto
-- gerado por IA (RN-60). Exportável em PDF e enviável por e-mail (corpo em
-- HTML, não anexo binário — ver SDD-109 pro motivo de paridade web/nativo).
-- Assinatura eletrônica de terceiros fica pra uma versão futura.

insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'assistente-contrato',
  'Assistente de Contrato',
  'Escolha um modelo de contrato, preencha seus dados e os da outra parte, e baixe o documento pronto em PDF.',
  10,
  true
)
on conflict (slug) do nothing;

-- Backfill (mesmo padrão de SDD-87/SDD-103): sem isso, quem já tinha conta
-- antes desta migration não veria o módulo liberado.
insert into public.user_modules (user_id, module_id, habilitado, novidade_vista)
select u.id, m.id, true, false
from public.users u cross join public.modules m
where m.slug = 'assistente-contrato'
on conflict (user_id, module_id) do update set novidade_vista = false;

-- ============================================================================
-- Uma linha por contrato gerado. `campos` guarda tudo que o usuário
-- preencheu (jsonb); o TEXTO das cláusulas nunca é persistido — é
-- recalculado sempre a partir de `campos` via gerarClausulas() (packages/
-- core/contrato.ts), o que permite corrigir/melhorar uma cláusula no código
-- sem precisar migrar dado histórico.
--
-- `tipo` SEM check constraint (mesmo padrão de `reunioes.tipo`) — validado
-- em packages/core, mais barato de estender o catálogo depois.
--
-- Conteúdo imutável (RN-62): sem policy de update/delete sobre o contrato
-- em si. `update_own_envio` existe só pra gravar enviado_em/enviado_para
-- depois do envio por e-mail — mesma disciplina "código, não banco" já
-- usada pro check de `tipo`, não uma trava de coluna no Postgres.
-- ============================================================================
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  campos jsonb not null,
  enviado_em timestamptz,
  enviado_para text,
  gerado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index contratos_user_idx on public.contratos (user_id, created_at desc);

alter table public.contratos enable row level security;

create policy "select_own" on public.contratos
  for select using (user_id = auth.uid());

create policy "insert_own" on public.contratos
  for insert with check (user_id = auth.uid());

create policy "update_own_envio" on public.contratos
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
