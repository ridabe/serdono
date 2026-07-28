-- Ser Dono — Base de conhecimento para RAG (Retrieval Augmented Generation)
--
-- Serve o copiloto de IA em qualquer módulo do produto (diagnóstico, workflow,
-- futuro chat livre) com respostas ancoradas em fonte oficial — nunca a IA
-- "inventando" resposta sobre MEI, finanças ou investimentos (RN-20, RF-3).
--
-- Arquitetura: knowledge_articles guarda o conteúdo curado (parafraseado a
-- partir da fonte oficial, nunca copiado verbatim — direito autoral);
-- knowledge_chunks guarda pedaços menores de cada artigo com embedding
-- (OpenAI text-embedding-3-small, 1536 dimensões) para busca por similaridade.

create extension if not exists vector;

-- ============================================================================
-- Categorias
-- ============================================================================
create table public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  created_at timestamptz not null default now()
);

alter table public.knowledge_categories enable row level security;

create policy "knowledge_categories_read_all" on public.knowledge_categories
  for select using (auth.role() = 'authenticated');

create policy "knowledge_categories_write_admin" on public.knowledge_categories
  for all using (auth.jwt() ->> 'user_role' = 'admin');

-- ============================================================================
-- Artigos — conteúdo curado, parafraseado, sempre com fonte e data (RN-20)
-- ============================================================================
create table public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.knowledge_categories (id) on delete restrict,
  titulo text not null,
  resumo text not null, -- 1-2 frases, usado como citação curta pelo copiloto
  conteudo text not null, -- corpo parafraseado, texto plano
  fonte text not null,
  fonte_url text,
  fonte_data date not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_articles enable row level security;

create policy "knowledge_articles_read_all" on public.knowledge_articles
  for select using (auth.role() = 'authenticated');

create policy "knowledge_articles_write_admin" on public.knowledge_articles
  for all using (auth.jwt() ->> 'user_role' = 'admin');

create trigger set_knowledge_articles_updated_at
  before update on public.knowledge_articles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Chunks — pedaços indexáveis por embedding (o que o RAG realmente busca)
-- ============================================================================
create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  created_at timestamptz not null default now(),
  unique (article_id, chunk_index)
);

alter table public.knowledge_chunks enable row level security;

create policy "knowledge_chunks_read_all" on public.knowledge_chunks
  for select using (auth.role() = 'authenticated');

create policy "knowledge_chunks_write_admin" on public.knowledge_chunks
  for all using (auth.jwt() ->> 'user_role' = 'admin');

-- Índice aproximado de vizinhos mais próximos (cosine). lists baixo porque a
-- base ainda é pequena — revisar (aumentar lists) conforme o volume crescer.
create index knowledge_chunks_embedding_idx on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 10);

-- ============================================================================
-- Função de busca por similaridade — chamada pela Edge Function knowledge-search
-- ============================================================================
create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  filter_category_slug text default null
)
returns table (
  chunk_id uuid,
  article_id uuid,
  content text,
  similarity float,
  article_titulo text,
  article_resumo text,
  fonte text,
  fonte_url text,
  fonte_data date,
  category_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as chunk_id,
    a.id as article_id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    a.titulo as article_titulo,
    a.resumo as article_resumo,
    a.fonte,
    a.fonte_url,
    a.fonte_data,
    cat.slug as category_slug
  from public.knowledge_chunks c
  join public.knowledge_articles a on a.id = c.article_id
  join public.knowledge_categories cat on cat.id = a.category_id
  where a.ativo = true
    and (filter_category_slug is null or cat.slug = filter_category_slug)
    and c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- SDD-17: grants padrão (ver 202607281400) — já cobertos pelo ALTER DEFAULT
-- PRIVILEGES daquela migration para tabelas novas, mas explicitado aqui por clareza.
grant select, insert, update, delete on
  public.knowledge_categories,
  public.knowledge_articles,
  public.knowledge_chunks
to authenticated, anon;

grant all privileges on
  public.knowledge_categories,
  public.knowledge_articles,
  public.knowledge_chunks
to service_role;

grant execute on function public.match_knowledge_chunks(vector, int, text) to authenticated, anon, service_role;

-- ============================================================================
-- Seed das categorias
-- ============================================================================
insert into public.knowledge_categories (slug, nome, descricao) values
  ('empreendedorismo', 'Empreendedorismo', 'Formalização, MEI, obrigações e passo a passo para abrir e manter um pequeno negócio.'),
  ('financas', 'Finanças Pessoais e do Negócio', 'Orçamento, controle de gastos, uso do crédito e endividamento.'),
  ('investimentos', 'Investimentos', 'Poupança, perfil de investidor, renda fixa e variável, riscos e golpes comuns.');
