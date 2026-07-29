-- Ser Dono — Jornada Empreendedora, Fase 2: Validação da Ideia (SDD-32)

-- ============================================================================
-- Inputs curtos da Fase 2 — 1:1 por instância, não precisam de tabela própria.
-- ============================================================================
alter table public.jornada_instances add column publico_alvo text;
alter table public.jornada_instances add column concorrentes text;
alter table public.jornada_instances add column diferenciais text;

-- ============================================================================
-- Documentos gerados por IA (persona, SWOT, canvas, proposta de valor) —
-- nome de tabela já reservado no PRD original (deliverables).
-- ============================================================================
create table public.jornada_deliverables (
  id uuid primary key default gen_random_uuid(),
  jornada_instance_id uuid not null references public.jornada_instances (id) on delete cascade,
  tipo text not null check (tipo in ('persona', 'swot', 'canvas', 'proposta_valor')),
  conteudo jsonb not null,
  gerado_por text not null default 'ia',
  versao int not null default 1,
  gerado_em timestamptz not null default now(),
  unique (jornada_instance_id, tipo)
);

alter table public.jornada_deliverables enable row level security;

-- Não tem user_id direto — a posse vem de jornada_instances.user_id, mesmo
-- princípio de select_own, adaptado pra tabela filha.
create policy "select_own" on public.jornada_deliverables
  for select using (
    exists (
      select 1 from public.jornada_instances ji
      where ji.id = jornada_instance_id and ji.user_id = auth.uid()
    )
  );

create policy "insert_own" on public.jornada_deliverables
  for insert with check (
    exists (
      select 1 from public.jornada_instances ji
      where ji.id = jornada_instance_id and ji.user_id = auth.uid()
    )
  );

create policy "update_own" on public.jornada_deliverables
  for update using (
    exists (
      select 1 from public.jornada_instances ji
      where ji.id = jornada_instance_id and ji.user_id = auth.uid()
    )
  );
