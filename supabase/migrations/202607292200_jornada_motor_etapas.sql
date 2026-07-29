-- Ser Dono — Jornada Empreendedora: motor genérico de etapas (SDD-33)
-- Substitui o checklist derivado ad-hoc da Fase 2 por progresso real e
-- persistente por etapa — inclusive etapas que dependem de uma ação do
-- empreendedor no mundo real ("aguardando_usuario"), não só de preencher
-- um campo.

-- ============================================================================
-- Catálogo de etapas (dado de configuração, não por usuário — mesmo padrão
-- de niches/modules).
-- ============================================================================
create table public.jornada_etapa_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  fase text not null check (fase in (
    'validacao_ideia', 'planejamento', 'formalizacao',
    'marketing', 'financeiro', 'clientes', 'retencao', 'escala'
  )),
  ordem int not null,
  titulo text not null,
  descricao text,
  tipo_conclusao text not null check (tipo_conclusao in ('auto', 'usuario')),
  dica text,
  depende_de uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jornada_etapa_templates enable row level security;

create policy "jornada_etapa_templates_read_all" on public.jornada_etapa_templates
  for select using (auth.role() = 'authenticated');

create policy "jornada_etapa_templates_write_admin" on public.jornada_etapa_templates
  for all using (auth.jwt() ->> 'user_role' = 'admin');

create trigger set_jornada_etapa_templates_updated_at
  before update on public.jornada_etapa_templates
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Progresso por etapa, por instância de jornada. Status:
--   bloqueada -> disponivel (auto) ou aguardando_usuario (manual) -> concluida
-- Não existe "em_andamento": nenhum conteúdo hoje precisa de estado
-- intermediário — "qual etapa é a atual" é derivado na UI (primeira não
-- concluída em ordem), não é coluna.
-- ============================================================================
create table public.jornada_etapas (
  id uuid primary key default gen_random_uuid(),
  jornada_instance_id uuid not null references public.jornada_instances (id) on delete cascade,
  etapa_template_id uuid not null references public.jornada_etapa_templates (id),
  status text not null check (status in ('bloqueada', 'disponivel', 'aguardando_usuario', 'concluida')),
  dados_usuario jsonb not null default '{}',
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jornada_instance_id, etapa_template_id)
);

alter table public.jornada_etapas enable row level security;

create policy "select_own" on public.jornada_etapas
  for select using (
    exists (
      select 1 from public.jornada_instances ji
      where ji.id = jornada_instance_id and ji.user_id = auth.uid()
    )
  );

create policy "insert_own" on public.jornada_etapas
  for insert with check (
    exists (
      select 1 from public.jornada_instances ji
      where ji.id = jornada_instance_id and ji.user_id = auth.uid()
    )
  );

create policy "update_own" on public.jornada_etapas
  for update using (
    exists (
      select 1 from public.jornada_instances ji
      where ji.id = jornada_instance_id and ji.user_id = auth.uid()
    )
  );

create trigger set_jornada_etapas_updated_at
  before update on public.jornada_etapas
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Seed — as 5 etapas reais da fase "validacao_ideia" (substituem o checklist
-- que hoje é calculado só no client, em useValidacaoIdeia.ts).
-- ============================================================================
insert into public.jornada_etapa_templates (id, slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('9520db70-b39b-4467-964b-1f9c028c4cd1', 'validacao_publico_alvo', 'validacao_ideia', 1,
   'Público-alvo definido', 'Quem é o cliente ideal do seu negócio.', 'auto', null, '{}'),
  ('bfd841be-e47f-4a26-bc4b-f54ce65163c6', 'validacao_concorrentes', 'validacao_ideia', 2,
   'Concorrentes pesquisados', 'Quem já faz algo parecido com o que você quer fazer.', 'auto', null, '{}'),
  ('01b89192-675c-405f-8973-9d54dfbd3e15', 'validacao_diferenciais', 'validacao_ideia', 3,
   'Diferenciais definidos', 'O que te diferencia dos concorrentes.', 'auto', null, '{}'),
  ('6b12107c-20ce-4104-a172-fafd3c06e3fc', 'validacao_persona', 'validacao_ideia', 4,
   'Persona e documentos estratégicos gerados', 'A IA gera Persona, SWOT, Canvas e Proposta de Valor a partir dos dados acima.', 'auto', null,
   array['9520db70-b39b-4467-964b-1f9c028c4cd1', 'bfd841be-e47f-4a26-bc4b-f54ce65163c6', '01b89192-675c-405f-8973-9d54dfbd3e15']::uuid[]),
  ('aaaff573-fb32-4195-8548-656236ed3815', 'validacao_clientes_reais', 'validacao_ideia', 5,
   'Conversar com pelo menos 3 clientes em potencial', 'Validar a ideia com pessoas reais, não só com documentos.', 'usuario',
   'Fale com pelo menos 3 pessoas que têm o perfil do seu público-alvo e pergunte se pagariam pelo que você quer oferecer. Não precisa ser formal — uma conversa de 10 minutos já ajuda a validar (ou derrubar) a ideia.',
   '{}');
