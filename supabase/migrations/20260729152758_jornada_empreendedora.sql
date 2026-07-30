-- Ser Dono — Jornada Empreendedora, módulo 1 (SDD-31)
-- Primeiro módulo de conteúdo do framework (SDD-30). Substitui a nomenclatura
-- de trilhas A-F do PRD original (nunca implementada) por fases nomeadas.

-- ============================================================================
-- Registro no catálogo de módulos — liberação continua manual pelo admin
-- (SPEC.md SDD-31) até existir gate por plano de assinatura.
-- ============================================================================
insert into public.modules (slug, nome, descricao)
values (
  'jornada-empreendedora',
  'Jornada Empreendedora',
  'Workflow guiado da escolha do nicho até o negócio aberto e funcionando.'
);

-- ============================================================================
-- Instância da jornada — uma por usuário. Nasce quando o usuário confirma um
-- nicho pós-login (Fase 1/Descoberta já é coberta pelo diagnóstico pré-login
-- existente, diagnostic_responses/niche_matches — não precisa de tabela própria).
-- ============================================================================
create table public.jornada_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  niche_id uuid references public.niches (id),
  nome_negocio text,
  fase_atual text not null default 'validacao_ideia'
    check (fase_atual in (
      'validacao_ideia', 'planejamento', 'formalizacao',
      'marketing', 'financeiro', 'clientes', 'retencao', 'escala'
    )),
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluida', 'pausada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jornada_instances enable row level security;

create policy "select_own" on public.jornada_instances
  for select using (auth.uid() = user_id);

create policy "insert_own" on public.jornada_instances
  for insert with check (auth.uid() = user_id);

create policy "update_own" on public.jornada_instances
  for update using (auth.uid() = user_id);

create trigger set_jornada_instances_updated_at
  before update on public.jornada_instances
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Policies de DELETE que faltavam em diagnostic_responses/niche_matches —
-- necessárias pro fluxo "refazer diagnóstico" (apaga a tentativa anterior
-- antes de responder de novo, evitando lixo de dado não usado na base).
-- ============================================================================
create policy "delete_own" on public.diagnostic_responses
  for delete using (auth.uid() = user_id);

create policy "delete_own" on public.niche_matches
  for delete using (auth.uid() = user_id);
