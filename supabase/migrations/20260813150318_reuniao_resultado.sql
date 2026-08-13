-- Ser Dono — Assistente de Reunião, resultado da reunião (pedido do dono do
-- produto, 13/08/2026) — último item que o PRD §12.15 listava como "fora de
-- escopo desta versão".
--
-- Tabela SEPARADA de `reunioes` (mesmo motivo do agendamento, SDD-104): o
-- guia gerado pela IA continua imutável (RN-51). O resultado é o oposto —
-- registrado depois que a reunião acontece, editável se o empreendedor
-- errou ao anotar — por isso vive em tabela própria, com seu próprio ciclo
-- de vida mutável. Independente de `reunioes_agenda`: o usuário pode
-- registrar resultado mesmo de uma reunião que nunca usou o agendamento
-- (marcou por fora, só voltou aqui pra anotar como foi).

create table public.reunioes_resultado (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid not null references public.reunioes (id) on delete cascade,
  sucesso text not null check (sucesso in ('sim', 'nao', 'parcial')),
  combinado text,
  registrado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (reuniao_id)
);

alter table public.reunioes_resultado enable row level security;

-- Sem user_id direto — a posse vem de reunioes.user_id, mesmo princípio já
-- usado em reunioes_agenda/planos_acao_itens (tabelas filhas).
create policy "select_own" on public.reunioes_resultado
  for select using (
    exists (select 1 from public.reunioes r where r.id = reuniao_id and r.user_id = auth.uid())
  );

create policy "insert_own" on public.reunioes_resultado
  for insert with check (
    exists (select 1 from public.reunioes r where r.id = reuniao_id and r.user_id = auth.uid())
  );

create policy "update_own" on public.reunioes_resultado
  for update using (
    exists (select 1 from public.reunioes r where r.id = reuniao_id and r.user_id = auth.uid())
  );
