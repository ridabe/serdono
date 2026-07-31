-- Ser Dono — Jornada Empreendedora, Fase Primeira Venda (SDD-47, PRD §9.11).
--
-- Entra logo depois de Clientes, antes de Retenção. O sistema nunca pode
-- saber por conta própria que uma venda aconteceu (mesmo princípio de
-- honestidade do PRD §4) — em vez de um botão genérico "já vendi", esta
-- fase reaproveita os contatos que a própria Fase Clientes já marcou como
-- `cliente` (pré-requisito pra sair daquela fase, SDD-45) e deixa o
-- empreendedor registrar qual deles foi a venda de verdade, com valor
-- opcional. Sem IA, sem tabela nova — só 1 etapa manual.
--
-- Diferente do padrão "nada trava" das fases mais recentes (RN-24), o
-- avanço pra Retenção fica bloqueado até essa etapa ser concluída (RN-27) —
-- é o único marco desta fase.

alter table public.jornada_etapa_templates drop constraint jornada_etapa_templates_fase_check;
alter table public.jornada_etapa_templates add constraint jornada_etapa_templates_fase_check
  check (fase in (
    'validacao_ideia', 'planejamento', 'formalizacao', 'financeiro', 'estrutura',
    'fornecedores', 'produto', 'marketing', 'clientes', 'primeira_venda', 'retencao', 'escala'
  ));

alter table public.jornada_instances drop constraint jornada_instances_fase_atual_check;
alter table public.jornada_instances add constraint jornada_instances_fase_atual_check
  check (fase_atual in (
    'validacao_ideia', 'planejamento', 'formalizacao', 'financeiro', 'estrutura',
    'fornecedores', 'produto', 'marketing', 'clientes', 'primeira_venda', 'retencao', 'escala'
  ));

insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('primeira_venda_registro', 'primeira_venda', 1,
   'Registre sua primeira venda',
   'O grande marco: a partir de agora seu negócio deixa de estar "pronto pra vender" e passa a ter vendido de verdade.',
   'usuario',
   'Não precisa ser um valor grande — o primeiro passo é o que importa. Se ainda não vendeu, siga trabalhando os contatos da Fase Clientes e volte aqui assim que fechar.',
   '{}');
