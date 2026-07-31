-- Ser Dono — Jornada Empreendedora, Fase Organização do Negócio (SDD-48,
-- PRD §9.12). Entra logo depois de Primeira Venda, antes de Retenção.
--
-- MVP conforme decisão do dono do produto (seção 21 do documento de
-- concepção): guia completo (financeiro, documentos, estoque, pedidos,
-- rotina, ferramentas, indicadores) + plano de organização + kit de
-- modelos pra baixar — mas SEM nenhuma tabela de operação real (sem
-- contas a pagar/receber, sem estoque, sem pedidos individuais). O
-- sistema é orientador, não ERP (PRD §9.12 §3) — controles de verdade
-- continuam em ferramenta externa recomendada pelo próprio sistema.
--
-- Só 2 etapas no motor (não 10) — a maioria dos "10 passos" do documento
-- original são seções de conteúdo/guia dentro da mesma tela, não ações
-- distintas no mundo real que justifiquem uma etapa própria cada.

alter table public.jornada_etapa_templates drop constraint jornada_etapa_templates_fase_check;
alter table public.jornada_etapa_templates add constraint jornada_etapa_templates_fase_check
  check (fase in (
    'validacao_ideia', 'planejamento', 'formalizacao', 'financeiro', 'estrutura',
    'fornecedores', 'produto', 'marketing', 'clientes', 'primeira_venda', 'organizacao',
    'retencao', 'escala'
  ));

alter table public.jornada_instances drop constraint jornada_instances_fase_atual_check;
alter table public.jornada_instances add constraint jornada_instances_fase_atual_check
  check (fase_atual in (
    'validacao_ideia', 'planejamento', 'formalizacao', 'financeiro', 'estrutura',
    'fornecedores', 'produto', 'marketing', 'clientes', 'primeira_venda', 'organizacao',
    'retencao', 'escala'
  ));

alter table public.jornada_deliverables drop constraint jornada_deliverables_tipo_check;
alter table public.jornada_deliverables add constraint jornada_deliverables_tipo_check
  check (tipo in (
    'persona', 'swot', 'canvas', 'proposta_valor', 'nomes_empresa',
    'identidade_visual', 'fornecedores_roteiro', 'marketing_conteudo', 'clientes_oferta',
    'organizacao_ferramentas'
  ));

insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('organizacao_diagnostico', 'organizacao', 1,
   'Diagnóstico de organização',
   'Responda algumas perguntas sobre como você administra o negócio hoje — a partir disso eu monto um plano de organização sob medida, começando pelos pontos de maior risco.',
   'usuario',
   'Não existe resposta "errada" aqui — o objetivo é entender onde você está agora, não julgar.',
   '{}'),

  ('organizacao_checklist_final', 'organizacao', 2,
   'Confirme seu plano de organização',
   'Depois de revisar os guias e escolher seus indicadores, confirme aqui que está pronto pra seguir com o plano de 30 dias.',
   'usuario',
   'Você não precisa ter tudo funcionando perfeitamente — o objetivo é começar a organizar e ter um plano de continuidade.',
   '{}');
