-- Ser Dono — Conclusão da Jornada Empreendedora (SDD-49, PRD §9/§12).
--
-- Decisão do dono do produto (31/07/2026): a Jornada passa a TERMINAR na
-- fase Organização (100%) em vez de continuar internamente para
-- "Retenção"/"Escala". Esses dois viram módulos independentes no catálogo
-- já existente (`modules`/`user_modules`, SDD-30) quando forem priorizados
-- — não fases do motor de etapas. Motivo: manter o empreendedor dentro do
-- produto depois de abrir o negócio é uma estratégia de retenção de
-- assinatura, não uma continuação natural do checklist de abertura: os dois
-- merecem o tratamento de módulo (liberação própria, entrada/saída
-- independente), igual Marketing/Financeiro/Hub B2B já prometidos no PRD §12.
--
-- `retencao`/`escala` saem das duas constraints (nenhuma linha usa esses
-- valores hoje — confirmado antes de aplicar) e `concluida` entra como
-- estado terminal de `fase_atual`.

alter table public.jornada_etapa_templates drop constraint jornada_etapa_templates_fase_check;
alter table public.jornada_etapa_templates add constraint jornada_etapa_templates_fase_check
  check (fase in (
    'validacao_ideia', 'planejamento', 'formalizacao', 'financeiro', 'estrutura',
    'fornecedores', 'produto', 'marketing', 'clientes', 'primeira_venda', 'organizacao'
  ));

alter table public.jornada_instances drop constraint jornada_instances_fase_atual_check;
alter table public.jornada_instances add constraint jornada_instances_fase_atual_check
  check (fase_atual in (
    'validacao_ideia', 'planejamento', 'formalizacao', 'financeiro', 'estrutura',
    'fornecedores', 'produto', 'marketing', 'clientes', 'primeira_venda', 'organizacao',
    'concluida'
  ));

-- Slot pro vídeo real da equipe parabenizando o empreendedor (ainda não
-- existe — pedido explícito do dono do produto pra já preparar o campo
-- agora). Config única (singleton por linha mais recente), sem tela de
-- admin própria ainda — quando essa tela existir, ela só faz upsert aqui.
-- Sem dado de usuário nenhum, então RLS é liberação de leitura ampla +
-- escrita só admin, mesmo padrão de `modules` (admin_panel_foundation).
create table public.jornada_conclusao_config (
  id uuid primary key default gen_random_uuid(),
  video_url text,
  atualizado_em timestamptz not null default now()
);

alter table public.jornada_conclusao_config enable row level security;

create policy "jornada_conclusao_config_read_all" on public.jornada_conclusao_config
  for select using (true);

create policy "jornada_conclusao_config_write_admin" on public.jornada_conclusao_config
  for all using (auth.jwt() ->> 'user_role' = 'admin');

insert into public.jornada_conclusao_config (video_url) values (null);
