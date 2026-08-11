-- Ser Dono — Base para o novo Dashboard Admin ("Torre de Controle", tema
-- claro): observação de uso de IA (tokens por chamada, pedido explícito do
-- dono do produto — mesma funcionalidade já existente no admin do
-- StrivePersonal) e de acesso a materiais de "Dicas da Mary" (pra existir um
-- ranking real de "mais acessadas", não um proxy).
--
-- Também libera leitura admin em `jornada_etapas` — hoje só tem
-- `select_own` (RLS de dono da jornada); o funil real da Jornada por fase no
-- dashboard precisa agregar entre usuários, o que só o admin pode ver.

-- ============================================================================
-- RLS admin em jornada_etapas — mesmo padrão de `users_read_admin`
-- (admin_panel_foundation): admin lê tudo, dono continua lendo só o próprio
-- (select_own já existente não muda).
-- ============================================================================
create policy "select_admin" on public.jornada_etapas
  for select using (auth.jwt() ->> 'user_role' = 'admin');

-- ============================================================================
-- Uso de IA por chamada — uma linha por chamada a um provedor de LLM feita
-- por uma Edge Function do produto. Gravada pela própria function, autenticada
-- como o usuário que disparou a chamada (nenhuma dessas functions usa
-- service_role hoje — ver nota em cada Edge Function) — por isso a policy de
-- insert é "insert_own", não "admin".
--
-- `input_tokens`/`output_tokens` ficam nulos quando o provedor não devolve
-- contagem de token pra aquela chamada (nunca inventamos número) —
-- `total_tokens` é coluna gerada, soma os dois quando ambos existem.
-- `unidades` cobre chamada que não é medida em token (ex.: 1 imagem gerada).
-- ============================================================================
create table public.ia_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  funcao text not null, -- slug da Edge Function, ex. "jornada-gerar-nomes"
  provider text not null check (provider in ('anthropic', 'openai')),
  modelo text not null,
  input_tokens int,
  output_tokens int,
  total_tokens int generated always as (
    case when input_tokens is null and output_tokens is null then null
    else coalesce(input_tokens, 0) + coalesce(output_tokens, 0) end
  ) stored,
  unidades int not null default 1,
  created_at timestamptz not null default now()
);

create index ia_usage_logs_created_at_idx on public.ia_usage_logs (created_at desc);
create index ia_usage_logs_funcao_idx on public.ia_usage_logs (funcao);

alter table public.ia_usage_logs enable row level security;

create policy "insert_own" on public.ia_usage_logs
  for insert with check (auth.uid() = user_id);

create policy "select_admin" on public.ia_usage_logs
  for select using (auth.jwt() ->> 'user_role' = 'admin');

-- ============================================================================
-- Acesso a material de "Dicas da Mary" — uma linha por abertura de vídeo,
-- download de PDF ou clique em link externo, gravada pelo client no momento
-- em que o usuário interage (DicasCategoriaScreen).
-- ============================================================================
create table public.dicas_acessos (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.dicas_materiais (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('video', 'pdf', 'link')),
  created_at timestamptz not null default now()
);

create index dicas_acessos_material_idx on public.dicas_acessos (material_id);

alter table public.dicas_acessos enable row level security;

create policy "insert_own" on public.dicas_acessos
  for insert with check (auth.uid() = user_id);

create policy "select_admin" on public.dicas_acessos
  for select using (auth.jwt() ->> 'user_role' = 'admin');
