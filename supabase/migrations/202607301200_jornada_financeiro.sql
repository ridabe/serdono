-- Ser Dono — Jornada Empreendedora, Fase Financeiro: Planejamento Financeiro
-- (SDD-39). Diferente de Formalização, aqui não há bifurcação nem lista de
-- documentos — é uma calculadora interativa (investimento inicial, capital
-- de giro, reserva, ponto de equilíbrio, fluxo de caixa, lucro esperado),
-- calculada 100% no client (packages/core/financeiro.ts), sem IA. Os valores
-- que o usuário ajusta ficam em `jornada_etapas.dados_usuario` (coluna
-- genérica já existente desde SDD-33), mesmo padrão do questionário de
-- Identidade Visual (SDD-35) — não precisa de coluna nova.

insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('financeiro_planejamento', 'financeiro', 1,
   'Planejamento financeiro',
   'Quanto você tem disponível hoje? A partir disso, calculamos investimento inicial, capital de giro, reserva de emergência, ponto de equilíbrio, fluxo de caixa e lucro esperado — tudo com a fórmula explicada, pra você aprender a fazer essa conta sozinho.',
   'usuario',
   'Esses números são uma estimativa de partida, baseada no seu nicho — ajuste cada valor pra sua realidade. Nenhuma fórmula aqui substitui um contador na hora de decidir de verdade.',
   '{}');
