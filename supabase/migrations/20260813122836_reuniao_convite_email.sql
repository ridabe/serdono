-- Ser Dono — Assistente de Reunião, convite por e-mail (pedido do dono do
-- produto, 13/08/2026) — item que o PRD §12.15 listava como "fora de escopo
-- desta versão" e passa a ser construído agora, a pedido explícito.
--
-- `contato_email` fica em `reunioes_agenda` (não em tabela nova): é o mesmo
-- ciclo de vida mutável do agendamento (RN-54) — reagendar ou trocar o
-- contato não deveria exigir uma tabela separada. `convite_enviado_em`
-- registra a última vez que um convite saiu, mas não é idempotência como o
-- e-mail de boas-vindas (SDD-70/71/72): o usuário pode reenviar quando
-- quiser (ex.: depois de reagendar), então o client zera essa coluna a cada
-- upsert de agendamento — um convite "enviado" só é válido pro agendamento
-- que existia no momento do envio.

alter table public.reunioes_agenda add column contato_email text;
alter table public.reunioes_agenda add column convite_enviado_em timestamptz;
