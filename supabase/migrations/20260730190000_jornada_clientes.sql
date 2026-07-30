-- Ser Dono — Jornada Empreendedora, Fase Clientes: Captação de Clientes
-- (SDD-45, MVP — PRD §9.10).
--
-- Escopo cortado com o dono do produto: só 4 dos 9 blocos do conceito
-- original entram agora — meta de captação (1 etapa, `tipo_conclusao =
-- 'usuario'`, dado em `jornada_etapas.dados_usuario`, mesmo padrão de
-- `financeiro_planejamento`/`produto_cadastro`), oferta comercial (entregável
-- de IA regenerável, mesmo padrão de `marketing_conteudo`) e lista de
-- contatos (CRUD livre do empreendedor, mesmo padrão de
-- `jornada_fornecedores` — primeira tabela nova desde aquela com policy de
-- DELETE própria). Canais recomendados, materiais de prospecção por canal,
-- plano diário, follow-up automático e biblioteca de campanhas ficam fora
-- desta migration.
--
-- Diferente de toda fase desde Financeiro (RN-24, "nada trava"), o avanço
-- desta fase é BLOQUEADO por critérios reais calculados sobre
-- `jornada_clientes_contatos.status` (ver `packages/supabase/clientes.ts`) —
-- mesmo espírito de Formalização (RN-23/SDD-38), não há coluna nova pra
-- isso, o cálculo é feito no client a partir dos dados já existentes.

insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('clientes_meta', 'clientes', 1,
   'Defina sua meta de captação',
   'Quantos clientes você quer conquistar, em quanto tempo, e quanto espera faturar por cliente — isso vira um número concreto de contatos que você precisa abordar.',
   'usuario',
   'Não existe meta "certa" — comece por algo alcançável no seu ritmo atual (ex.: seus primeiros 5 a 10 clientes) e ajuste depois de ver como a conversão real do seu negócio se comporta.',
   '{}');

alter table public.jornada_deliverables drop constraint jornada_deliverables_tipo_check;
alter table public.jornada_deliverables add constraint jornada_deliverables_tipo_check
  check (tipo in (
    'persona', 'swot', 'canvas', 'proposta_valor', 'nomes_empresa',
    'identidade_visual', 'fornecedores_roteiro', 'marketing_conteudo', 'clientes_oferta'
  ));

-- ============================================================================
-- Lista pessoal de contatos — CRUD livre, dono é o próprio usuário.
-- ============================================================================
create table public.jornada_clientes_contatos (
  id uuid primary key default gen_random_uuid(),
  jornada_instance_id uuid not null references public.jornada_instances (id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  empresa text,
  notas text,
  status text not null default 'novo' check (status in ('novo', 'contatado', 'respondeu', 'orcamento_enviado', 'cliente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jornada_clientes_contatos enable row level security;

create policy "select_own" on public.jornada_clientes_contatos
  for select using (
    exists (select 1 from public.jornada_instances ji where ji.id = jornada_instance_id and ji.user_id = auth.uid())
  );

create policy "insert_own" on public.jornada_clientes_contatos
  for insert with check (
    exists (select 1 from public.jornada_instances ji where ji.id = jornada_instance_id and ji.user_id = auth.uid())
  );

create policy "update_own" on public.jornada_clientes_contatos
  for update using (
    exists (select 1 from public.jornada_instances ji where ji.id = jornada_instance_id and ji.user_id = auth.uid())
  );

create policy "delete_own" on public.jornada_clientes_contatos
  for delete using (
    exists (select 1 from public.jornada_instances ji where ji.id = jornada_instance_id and ji.user_id = auth.uid())
  );

create trigger set_jornada_clientes_contatos_updated_at
  before update on public.jornada_clientes_contatos
  for each row execute function public.set_updated_at();
