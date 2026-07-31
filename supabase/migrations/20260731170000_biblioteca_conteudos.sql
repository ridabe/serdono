-- Ser Dono — Biblioteca de conteúdos (SDD-50, PRD §12.3).
--
-- Área de cursos, vídeos, apostilas e dicas exibida no painel do
-- empreendedor. Deliberadamente SEPARADA de `knowledge_articles`: aquela
-- tabela alimenta o RAG do assistente (texto curado com fonte/data, fatiado
-- em `knowledge_chunks` e embeddado) e não é material didático navegável.
-- Misturar as duas faria conteúdo de vídeo/PDF entrar no índice de
-- embeddings sem texto pra embeddar, e obrigaria `fonte`/`fonte_data`
-- (obrigatórios lá por RN-20) em material de produção própria.
--
-- Um "curso" é o único tipo com filhos (`biblioteca_aulas`); vídeo,
-- apostila e dica são itens únicos. Modelado como uma tabela + tabela de
-- aulas em vez de auto-relacionamento por simplicidade de leitura: a
-- consulta do card é sempre `biblioteca_conteudos`, e as aulas só são
-- buscadas ao abrir um curso.

create table public.biblioteca_conteudos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('curso', 'video', 'apostila', 'dica')),
  titulo text not null,
  descricao text,
  -- Qual campo de mídia vale depende do `tipo` — não é enforced por
  -- constraint de propósito: o admin pode salvar um rascunho incompleto e
  -- só publicar (`ativo = true`) quando estiver pronto.
  video_url text,
  arquivo_url text,
  conteudo_md text,
  thumbnail_url text,
  duracao_min integer,
  nivel text check (nivel in ('basico', 'intermediario', 'avancado')),
  ordem integer not null default 0,
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.biblioteca_aulas (
  id uuid primary key default gen_random_uuid(),
  conteudo_id uuid not null references public.biblioteca_conteudos(id) on delete cascade,
  titulo text not null,
  video_url text,
  duracao_min integer,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index biblioteca_aulas_conteudo_idx on public.biblioteca_aulas(conteudo_id, ordem);
create index biblioteca_conteudos_ativo_idx on public.biblioteca_conteudos(ativo, ordem);

alter table public.biblioteca_conteudos enable row level security;
alter table public.biblioteca_aulas enable row level security;

-- Conteúdo publicado é legível por qualquer usuário autenticado (mesmo
-- espírito da base de conhecimento, SDD-21: material de aquisição/confiança,
-- sem gate de assinatura). Rascunho (`ativo = false`) só o admin enxerga.
create policy "biblioteca_conteudos_read_publicado" on public.biblioteca_conteudos
  for select to authenticated using (ativo = true);

create policy "biblioteca_conteudos_write_admin" on public.biblioteca_conteudos
  for all using (auth.jwt() ->> 'user_role' = 'admin');

create policy "biblioteca_aulas_read_publicado" on public.biblioteca_aulas
  for select to authenticated using (
    exists (
      select 1 from public.biblioteca_conteudos c
      where c.id = conteudo_id and c.ativo = true
    )
  );

create policy "biblioteca_aulas_write_admin" on public.biblioteca_aulas
  for all using (auth.jwt() ->> 'user_role' = 'admin');
