-- Ser Dono — Inadimplência automática de assinatura (pedido do dono do
-- produto, 28/08/2026). A AbacatePay não dispara nenhum webhook de "cobrança
-- recorrente falhou" (só existem subscription.completed/renewed/cancelled —
-- achado já registrado em SDD-114, quando a mesma lacuna motivou o botão
-- manual "Sincronizar com a AbacatePay" no Painel Admin). Sem uma marca de
-- verdade aqui, o sistema nunca saberia sozinho que uma mensalidade venceu
-- sem pagamento confirmado.
--
-- `inadimplente_desde` guarda o instante em que a Edge Function
-- `assinatura-verificar-vencidas` (rodando via pg_cron, migration seguinte)
-- detectou que uma assinatura `ativa` passou do ciclo (`renovado_em` + 1 mês)
-- sem um novo `subscription.renewed` — vira a base do prazo de carência de 2
-- dias antes do rebaixamento automático pro plano Gratuito.
alter table public.subscriptions add column inadimplente_desde timestamptz;

comment on column public.subscriptions.inadimplente_desde is
  'Quando a assinatura ativa passou do ciclo de cobrança sem renovação confirmada — base do prazo de carência de 2 dias antes de rebaixar o usuário pro plano Gratuito (assinatura-verificar-vencidas).';
