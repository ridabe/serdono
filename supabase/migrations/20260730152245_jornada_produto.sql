-- Ser Dono — Jornada Empreendedora, Fase 9: Produto (SDD-42).
--
-- Diferente de Fornecedores (SDD-41), esta fase não tem base de dados
-- própria — é uma aula prática + ferramenta: como cadastrar produto/serviço
-- (sistema próprio vs planilha), uma planilha-modelo pronta pra baixar, e
-- uma calculadora de precificação (custo, despesas, impostos, margem →
-- preço de venda). Mesmo espírito "nada trava" das fases anteriores
-- (RN-23/24) — só existe 1 etapa, concluída manualmente.
--
-- Reaproveita `fornecedores_parceiros` (SDD-41) pra sugerir um parceiro
-- desenvolvedor de sistema pra quem quiser algo além de planilha — daí a
-- coluna nova `indicado_desenvolvimento`, um flag explícito marcado pelo
-- admin, não inferido por palavra-chave em `categoria`/`descricao` (texto
-- livre demais pra confiar nisso).

alter table public.jornada_etapa_templates drop constraint jornada_etapa_templates_fase_check;
alter table public.jornada_etapa_templates add constraint jornada_etapa_templates_fase_check
  check (fase in (
    'validacao_ideia', 'planejamento', 'formalizacao', 'financeiro', 'estrutura',
    'fornecedores', 'produto', 'marketing', 'clientes', 'retencao', 'escala'
  ));

alter table public.jornada_instances drop constraint jornada_instances_fase_atual_check;
alter table public.jornada_instances add constraint jornada_instances_fase_atual_check
  check (fase_atual in (
    'validacao_ideia', 'planejamento', 'formalizacao', 'financeiro', 'estrutura',
    'fornecedores', 'produto', 'marketing', 'clientes', 'retencao', 'escala'
  ));

insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('produto_cadastro', 'produto', 1,
   'Cadastro e precificação do primeiro produto',
   'Como organizar o que você vende (por sistema ou por planilha) e como chegar num preço que cobre custo, imposto e ainda deixa lucro.',
   'usuario',
   'Comece pela planilha-modelo, mesmo que a intenção seja migrar pra um sistema depois — ela já te obriga a pensar nos campos certos (custo, preço, estoque), e você não perde esse trabalho quando migrar.',
   '{}');

-- ============================================================================
-- Flag explícito de "este parceiro é indicado pra quem quer sistema
-- próprio" — dado de configuração marcado pelo admin, não inferido de texto
-- livre.
-- ============================================================================
alter table public.fornecedores_parceiros add column indicado_desenvolvimento boolean not null default false;

-- Backfill do único parceiro já cadastrado até aqui (Algoritmum
-- Desenvolvimento) — a descrição já deixa claro que é desenvolvimento de
-- sistema; daqui pra frente, todo cadastro novo marca o flag explicitamente
-- pela tela de admin.
update public.fornecedores_parceiros
set indicado_desenvolvimento = true
where descricao ilike '%sistema%' or descricao ilike '%desenvolv%' or categoria ilike '%desenvolv%' or categoria ilike '%software%';
