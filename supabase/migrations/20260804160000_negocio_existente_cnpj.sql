-- Ser Dono — Fluxo "já tenho negócio" (PRD §8.3/SDD-52), pedido do dono do
-- produto em 04/08/2026: capturar o CNPJ real, não só o regime (MEI/formal),
-- de quem confirma já ter formalizado. Mesmo padrão de nome_empresa_escolhido
-- (SDD-34) — campo 1:1 na instância, sem tabela nova.

alter table public.jornada_instances add column cnpj text;
