-- Ser Dono — complemento da migration de Fornecedores (SDD-41): esqueci que
-- `jornada_deliverables.tipo` tem CHECK fechado por lista — sem isto, o
-- upsert do roteiro gerado por IA (tipo 'fornecedores_roteiro') falharia.
alter table public.jornada_deliverables drop constraint jornada_deliverables_tipo_check;
alter table public.jornada_deliverables add constraint jornada_deliverables_tipo_check
  check (tipo in (
    'persona', 'swot', 'canvas', 'proposta_valor', 'nomes_empresa', 'identidade_visual', 'fornecedores_roteiro'
  ));
