-- Ser Dono — Fluxo "já tenho negócio" (SDD-52, PRD §8.3 reescrito).
--
-- Dois campos novos em `jornada_instances`, sem mudar o motor de etapas em
-- si (isso é lógica de aplicação, não schema):
--
-- `nicho_personalizado`: quando a pessoa não encontra o próprio negócio no
-- catálogo de nichos (mesmo com a expansão pra 30+), ela descreve em texto
-- livre. `niche_id` fica null nesse caso — já era nullable antes desta
-- migration, e o filtro de relevância de Estrutura (`isEtapaEstruturaRelevante`)
-- já trata `niche: null` mostrando tudo, então esse caminho já era seguro
-- por padrão. O texto livre aparece só no perfil da própria pessoa (nunca
-- vira nicho curado pra mais ninguém, decisão do dono do produto).
--
-- `origem_intake`: de onde a jornada começou — `diagnostico` (padrão, fluxo
-- de novo empreendedor, pré-login) ou `negocio_existente` (fluxo novo desta
-- SDD). Guardado explicitamente em vez de inferido (ex.: "tem fase marcada
-- concluída sem nunca ter visitado a tela") porque inferência quebraria no
-- dia em que o motor ganhar outro jeito de pré-marcar etapa. É o que decide
-- se o painel (`/inicio`) mostra o destaque "você já chegou adiantado".
alter table public.jornada_instances add column nicho_personalizado text;
alter table public.jornada_instances add column origem_intake text not null default 'diagnostico'
  check (origem_intake in ('diagnostico', 'negocio_existente'));
