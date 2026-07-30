-- Ser Dono — Jornada Empreendedora, Fase 8: Fornecedores (SDD-41).
--
-- Diferente das fases anteriores, aqui existem DUAS entidades novas, não
-- uma:
--
-- 1. `fornecedores_parceiros` — base curada pelo ADMIN (mesmo padrão de
--    `niches`/`knowledge_articles`: leitura livre pra autenticado, escrita
--    só admin). Nasce vazia — o admin popula pelo Painel Admin
--    (/admin/fornecedores). Já sai com coluna `embedding vector(1536)` e a
--    função `match_fornecedores_parceiros`, no mesmo formato do RAG de
--    conhecimento geral (`knowledge_base_rag`, ver aquela migration) — mas
--    SEM nenhuma Edge Function populando embedding ainda. É preparo de
--    schema, não RAG funcionando: enquanto a base estiver vazia (ou os
--    parceiros cadastrados não tiverem embedding), o app usa filtro simples
--    por nicho (`niches_aplicaveis`), não busca semântica. Ligar o RAG de
--    verdade (gerar embedding ao cadastrar parceiro, usar
--    `match_fornecedores_parceiros` na busca) é trabalho futuro, só faz
--    sentido quando houver conteúdo real pra buscar.
--
-- 2. `jornada_fornecedores` — a lista PESSOAL que cada empreendedor monta
--    (Categoria → Fornecedor → Avaliação → Preço → Prazo → Contato, exemplo
--    dado pelo dono do produto). Diferente do padrão de checklist fixo
--    (`jornada_etapas`), aqui o usuário cria/edita/remove linhas livremente
--    — por isso é a primeira tabela de sub-dado de jornada com policy de
--    DELETE própria.
--
-- Nada aqui trava o avanço de fase (mesmo espírito de RN-23/RN-24) — só
-- existe 1 etapa nesta fase, concluída manualmente pelo usuário quando ele
-- achar que já tem o que precisa.

-- ============================================================================
-- Nova fase no motor de etapas.
-- ============================================================================
alter table public.jornada_etapa_templates drop constraint jornada_etapa_templates_fase_check;
alter table public.jornada_etapa_templates add constraint jornada_etapa_templates_fase_check
  check (fase in (
    'validacao_ideia', 'planejamento', 'formalizacao',
    'financeiro', 'estrutura', 'fornecedores', 'marketing', 'clientes', 'retencao', 'escala'
  ));

alter table public.jornada_instances drop constraint jornada_instances_fase_atual_check;
alter table public.jornada_instances add constraint jornada_instances_fase_atual_check
  check (fase_atual in (
    'validacao_ideia', 'planejamento', 'formalizacao',
    'financeiro', 'estrutura', 'fornecedores', 'marketing', 'clientes', 'retencao', 'escala'
  ));

insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('fornecedores_lista', 'fornecedores', 1,
   'Monte sua lista de fornecedores',
   'Os parceiros que vão te ajudar a operar: quem fornece o que você vende ou usa, os materiais, equipamentos e serviços do dia a dia.',
   'usuario',
   'Peça pelo menos 3 orçamentos por categoria antes de fechar com o primeiro — preço e prazo variam bastante entre fornecedores do mesmo tipo, mesmo dentro da mesma cidade.',
   '{}');

-- ============================================================================
-- Base de parceiros — curada pelo admin, pronta pra RAG futuro.
-- ============================================================================
create table public.fornecedores_parceiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null, -- tipo de produto/serviço fornecido (ex.: "embalagens", "matéria-prima", "equipamentos")
  descricao text,
  niches_aplicaveis uuid[] not null default '{}', -- vazio = todos os nichos
  regiao text, -- ex.: "São Paulo, SP", "Nacional", "Online"
  contato text,
  site text,
  ativo boolean not null default true,
  embedding vector(1536), -- OpenAI text-embedding-3-small — não populado ainda, ver nota no topo do arquivo
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fornecedores_parceiros enable row level security;

create policy "fornecedores_parceiros_read_all" on public.fornecedores_parceiros
  for select using (auth.role() = 'authenticated');

create policy "fornecedores_parceiros_write_admin" on public.fornecedores_parceiros
  for all using (auth.jwt() ->> 'user_role' = 'admin');

create trigger set_fornecedores_parceiros_updated_at
  before update on public.fornecedores_parceiros
  for each row execute function public.set_updated_at();

-- Índice aproximado de vizinhos mais próximos (cosine) — mesmo padrão de
-- knowledge_chunks. Criado já agora (tabela vazia) pra não exigir migration
-- nova quando o RAG for ligado de verdade.
create index fornecedores_parceiros_embedding_idx on public.fornecedores_parceiros
  using ivfflat (embedding vector_cosine_ops) with (lists = 5);

create or replace function public.match_fornecedores_parceiros(
  query_embedding vector(1536),
  match_count int default 5,
  filter_niche_id uuid default null
)
returns table (
  id uuid,
  nome text,
  categoria text,
  descricao text,
  regiao text,
  contato text,
  site text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.nome,
    p.categoria,
    p.descricao,
    p.regiao,
    p.contato,
    p.site,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.fornecedores_parceiros p
  where p.ativo = true
    and p.embedding is not null
    and (filter_niche_id is null or p.niches_aplicaveis = '{}' or p.niches_aplicaveis @> array[filter_niche_id])
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

grant select, insert, update, delete on public.fornecedores_parceiros to authenticated, anon;
grant all privileges on public.fornecedores_parceiros to service_role;
grant execute on function public.match_fornecedores_parceiros(vector, int, uuid) to authenticated, anon, service_role;

-- ============================================================================
-- Lista pessoal do empreendedor — CRUD livre, dono é o próprio usuário.
-- ============================================================================
create table public.jornada_fornecedores (
  id uuid primary key default gen_random_uuid(),
  jornada_instance_id uuid not null references public.jornada_instances (id) on delete cascade,
  categoria text not null,
  nome_fornecedor text not null,
  avaliacao text,
  preco text,
  prazo text,
  contato text,
  parceiro_id uuid references public.fornecedores_parceiros (id),
  origem text not null default 'pesquisa_propria' check (origem in ('pesquisa_propria', 'parceiro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jornada_fornecedores enable row level security;

create policy "select_own" on public.jornada_fornecedores
  for select using (
    exists (select 1 from public.jornada_instances ji where ji.id = jornada_instance_id and ji.user_id = auth.uid())
  );

create policy "insert_own" on public.jornada_fornecedores
  for insert with check (
    exists (select 1 from public.jornada_instances ji where ji.id = jornada_instance_id and ji.user_id = auth.uid())
  );

create policy "update_own" on public.jornada_fornecedores
  for update using (
    exists (select 1 from public.jornada_instances ji where ji.id = jornada_instance_id and ji.user_id = auth.uid())
  );

create policy "delete_own" on public.jornada_fornecedores
  for delete using (
    exists (select 1 from public.jornada_instances ji where ji.id = jornada_instance_id and ji.user_id = auth.uid())
  );

create trigger set_jornada_fornecedores_updated_at
  before update on public.jornada_fornecedores
  for each row execute function public.set_updated_at();
