-- Ser Dono — Módulo "Assistente de Reunião" (pedido do dono do produto,
-- 12/08/2026). V1: formulário curto (tipo de reunião, com quem, objetivo,
-- observações) → guia gerado pela Mary (pauta, perguntas, dicas de
-- comportamento, erros a evitar, checklist) → export em PDF. Agenda,
-- convite por e-mail e lembrete automático ficam para uma V2 futura.
--
-- Slug técnico `preparar-reuniao` / rota `/reuniao` (não `assistente`) pra
-- não colidir com a rota `/assistente` já existente (chat "Pergunte pra
-- Mary" sobre a base de conhecimento) — o nome exibido ao usuário continua
-- "Assistente de Reunião".
--
-- Diferente de todo módulo mensal anterior: SEM unique(user_id,
-- mes_referencia) — o usuário pode se preparar pra quantas reuniões
-- precisar, a qualquer momento; cada geração é um registro novo no
-- histórico, nunca um snapshot que se sobrescreve.

insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'preparar-reuniao',
  'Assistente de Reunião',
  'Um guia de preparação pra sua próxima reunião — pauta, perguntas, dicas de comportamento e o que evitar, a partir do seu negócio real.',
  9,
  true
)
on conflict (slug) do nothing;

-- Backfill (premissa da SDD-87): sem isso, ninguém que já tinha conta antes
-- de hoje veria o módulo liberado nem o pop-up de novidade na Início.
insert into public.user_modules (user_id, module_id, habilitado, novidade_vista)
select u.id, m.id, true, false
from public.users u cross join public.modules m
where m.slug = 'preparar-reuniao'
on conflict (user_id, module_id) do update set novidade_vista = false;

-- ============================================================================
-- Uma linha por reunião preparada — sem limite mensal, sem `mes_referencia`.
-- Imutável depois de gerada (sem policy de update/delete): reunião mudou de
-- figura, o usuário gera outra, não edita a antiga. `tipo` é validado em
-- packages/core/Edge Function, SEM check constraint no banco (mesmo padrão
-- de catálogo fixo de `SECOES_CHECKUP`) — mais barato de estender o
-- catálogo de tipos depois, sem migration nova.
-- ============================================================================
create table public.reunioes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  tipo_outro_detalhe text,
  com_quem text not null,
  objetivo text not null,
  observacoes text,
  guia jsonb not null,
  gerado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index reunioes_user_idx on public.reunioes (user_id, created_at desc);

alter table public.reunioes enable row level security;

create policy "select_own" on public.reunioes
  for select using (user_id = auth.uid());

create policy "insert_own" on public.reunioes
  for insert with check (user_id = auth.uid());
