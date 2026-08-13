-- Ser Dono — Assistente de Reunião, fatia 1 da V2 (pedido do dono do
-- produto, 12/08/2026): agendar a reunião (data/hora, local, contato) a
-- partir de um guia já gerado (`public.reunioes`). Convite por e-mail,
-- lembrete automático e resultado da reunião continuam fora de escopo.
--
-- Tabela SEPARADA de `reunioes` (não colunas na mesma linha) de propósito:
-- o guia gerado pela IA precisa continuar imutável (RN-51 — `reunioes` não
-- tem policy de update). O agendamento é o oposto — muda de figura o tempo
-- todo (reagendar = update, cancelar = delete) — por isso vive em tabela
-- própria, com seu próprio ciclo de vida mutável.
--
-- Primeira vez que o produto guarda um instante futuro exato
-- (`data_hora timestamptz`, não "mês de referência") — sem precedente no
-- schema, desenhado do zero aqui.

create table public.reunioes_agenda (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid not null references public.reunioes (id) on delete cascade,
  data_hora timestamptz not null,
  local_tipo text not null check (local_tipo in ('presencial', 'online')),
  local_valor text not null,
  contato_nome text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (reuniao_id)
);

alter table public.reunioes_agenda enable row level security;

-- Sem user_id direto — a posse vem de reunioes.user_id, mesmo princípio já
-- usado em planos_acao_itens (tabela filha).
create policy "select_own" on public.reunioes_agenda
  for select using (
    exists (select 1 from public.reunioes r where r.id = reuniao_id and r.user_id = auth.uid())
  );

create policy "insert_own" on public.reunioes_agenda
  for insert with check (
    exists (select 1 from public.reunioes r where r.id = reuniao_id and r.user_id = auth.uid())
  );

create policy "update_own" on public.reunioes_agenda
  for update using (
    exists (select 1 from public.reunioes r where r.id = reuniao_id and r.user_id = auth.uid())
  );

create policy "delete_own" on public.reunioes_agenda
  for delete using (
    exists (select 1 from public.reunioes r where r.id = reuniao_id and r.user_id = auth.uid())
  );

-- Sem trigger de `updated_at`: `public.set_updated_at()` (já existente no
-- projeto) escreve na coluna literal `updated_at`, que esta tabela não tem
-- (convenção em português do módulo, `atualizado_em`) — o client grava
-- `atualizado_em` explicitamente a cada upsert (mesmo padrão já usado em
-- `planos_acao_itens.concluido_em`, setado na hora em vez de via trigger).
