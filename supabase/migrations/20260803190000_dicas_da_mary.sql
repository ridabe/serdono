-- Ser Dono — "Dicas da Mary" (SDD-59, PRD §12.7, RN-34).
--
-- Substitui a Biblioteca de Conteúdos (SDD-50, PRD §12.3): aquela tabela
-- nunca teve consumo client-side (nenhuma tela abria/baixava/assistia
-- conteúdo — só um preview estático sem onPress no Painel) e, confirmado por
-- consulta direta antes desta migration, tinha 0 linhas em produção — sem
-- risco de perda de dado no DROP. O novo modelo abandona `tipo`
-- (curso/vídeo/apostila/dica) e `biblioteca_aulas` (curso com múltiplas
-- aulas) — decisão do dono do produto: aqui todo material vive no mesmo
-- nível dentro de uma categoria, e PDF/vídeo/link são combináveis livremente
-- em vez de mutuamente exclusivos por `tipo`.

drop table if exists public.biblioteca_aulas;
drop table if exists public.biblioteca_conteudos;

create table public.dicas_categorias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  ordem integer not null default 0,
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dicas_materiais (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.dicas_categorias(id) on delete cascade,
  titulo text not null,
  descricao text,
  -- Os três campos de mídia são combináveis, não exclusivos (RN-34): um
  -- material pode ter PDF + vídeo + link ao mesmo tempo. Nenhum é
  -- obrigatório por constraint — o admin pode salvar rascunho incompleto e
  -- só publicar (`ativo = true`) quando pronto, mesmo padrão da Biblioteca.
  arquivo_url text,
  arquivo_nome text,
  video_url text,
  link_externo_url text,
  link_externo_label text,
  nivel text check (nivel in ('basico', 'intermediario', 'avancado')),
  ordem integer not null default 0,
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dicas_categorias_ativo_idx on public.dicas_categorias(ativo, ordem);
create index dicas_materiais_categoria_idx on public.dicas_materiais(categoria_id, ordem);

alter table public.dicas_categorias enable row level security;
alter table public.dicas_materiais enable row level security;

-- Liberado a todo usuário autenticado, sem gate de módulo/plano (RN-34) —
-- mesmo padrão já usado em `niches`/`knowledge_*`/Biblioteca antiga.
create policy "dicas_categorias_read_publicado" on public.dicas_categorias
  for select to authenticated using (ativo = true);

create policy "dicas_categorias_write_admin" on public.dicas_categorias
  for all using (auth.jwt() ->> 'user_role' = 'admin');

create policy "dicas_materiais_read_publicado" on public.dicas_materiais
  for select to authenticated using (
    ativo = true
    and exists (select 1 from public.dicas_categorias c where c.id = categoria_id and c.ativo = true)
  );

create policy "dicas_materiais_write_admin" on public.dicas_materiais
  for all using (auth.jwt() ->> 'user_role' = 'admin');

create trigger set_dicas_categorias_updated_at
  before update on public.dicas_categorias
  for each row execute function public.set_updated_at();

create trigger set_dicas_materiais_updated_at
  before update on public.dicas_materiais
  for each row execute function public.set_updated_at();

-- Bucket de PDF (mesmo raciocínio do bucket `parceiros-logos`, SDD-51:
-- material didático não é dado sensível, precisa ser baixável por URL direta
-- sem signed URL). Só admin grava; sem policy de select (bucket público
-- serve o objeto direto).
insert into storage.buckets (id, name, public)
values ('dicas-materiais', 'dicas-materiais', true)
on conflict (id) do nothing;

create policy "dicas_materiais_storage_write_admin" on storage.objects
  for insert with check (bucket_id = 'dicas-materiais' and auth.jwt() ->> 'user_role' = 'admin');

create policy "dicas_materiais_storage_update_admin" on storage.objects
  for update using (bucket_id = 'dicas-materiais' and auth.jwt() ->> 'user_role' = 'admin');

create policy "dicas_materiais_storage_delete_admin" on storage.objects
  for delete using (bucket_id = 'dicas-materiais' and auth.jwt() ->> 'user_role' = 'admin');
