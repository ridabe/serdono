-- Ser Dono — Lembrete automático de reunião agendada (V2, fatia 2 do
-- Assistente de Reunião; pedido do dono do produto, 12/08/2026).
--
-- Adiciona 'reuniao_lembrete' ao catálogo de tipos de `lembretes_enviados`
-- (SDD-91), reaproveitando o cron diário `lembretes-diarios` já existente
-- em vez de criar um agendador de precisão novo — decisão já fechada com o
-- dono do produto na fatia 1 (agenda).

alter table public.lembretes_enviados drop constraint lembretes_enviados_tipo_check;

alter table public.lembretes_enviados
  add constraint lembretes_enviados_tipo_check
  check (tipo in ('jornada_etapa_parada', 'checkup_mensal', 'obrigacao_vencendo', 'reuniao_lembrete'));
