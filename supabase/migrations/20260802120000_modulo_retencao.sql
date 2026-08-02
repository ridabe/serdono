-- Ser Dono — Módulo "Retenção de Clientes" (SDD-54, PRD §12.5).
--
-- Segundo módulo de conteúdo do catálogo (SDD-30), depois da Jornada
-- Empreendedora. Previsto desde a SDD-49, quando Retenção deixou de ser fase
-- do motor de etapas e virou módulo independente: a Jornada termina em
-- Organização (100%) e o que vem depois é assinatura, não workflow.
--
-- DECISÃO CENTRAL DE SCHEMA — carteira própria, não reuso de
-- `jornada_clientes_contatos`:
--   Aquela tabela é o FUNIL DE CAPTAÇÃO da Fase Clientes (SDD-45): 5 status
--   de 'novo' até 'cliente', respondendo "essa pessoa fechou?". Ela não tem
--   (nem deveria ter) data de compra, histórico de interação ou recompra —
--   perguntas de pós-venda, que é outro assunto. Enfiar os dois no mesmo
--   schema obrigaria a Fase Clientes a carregar coluna que não usa e faria
--   "contato" e "cliente da carteira" significarem a mesma coisa, que não é
--   verdade. Mesmo raciocínio já aplicado duas vezes: a Biblioteca não virou
--   `knowledge_articles` (SDD-50) e as ferramentas de gestão não viraram
--   `fornecedores_parceiros` (SDD-48).
--   O vínculo entre os dois mundos é `origem_contato_id`, com índice único
--   por usuário: a importação inicial é idempotente, nunca duplica cliente
--   se o empreendedor abrir o módulo dez vezes.
--
-- Dono do dado é o USUÁRIO (`user_id`), não a jornada — de propósito. Um
-- módulo do catálogo não pode depender de existir uma `jornada_instance`
-- (RN-29: módulo é independente do workflow), e o empreendedor que chegou
-- pelo fluxo "já tenho negócio" (SDD-52) precisa conseguir usar a carteira
-- mesmo tendo pulado a Fase Clientes.

-- ============================================================================
-- Catálogo: o módulo em si (SDD-30). Liberação continua manual pelo admin
-- via `user_modules` — planos pagos seguem não existindo (PRD §17).
-- ============================================================================
insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'retencao-clientes',
  'Retenção de Clientes',
  'Sua carteira de clientes num lugar só: quem está em dia, quem está esfriando, quem sumiu — e o que dizer pra trazer de volta.',
  2,
  true
)
on conflict (slug) do nothing;

-- ============================================================================
-- Configuração do módulo por usuário.
--
-- `ciclo_recompra_dias` é a única constante do módulo, e é do EMPREENDEDOR,
-- não nossa: salão de beleza (~30 dias) e consultoria (~180) não podem
-- compartilhar o mesmo corte de "sumiu". Sem esse número informado, o módulo
-- não classifica ninguém — prefere perguntar a inventar uma faixa fixa que
-- geraria alerta falso (princípio de honestidade do PRD §4).
-- ============================================================================
create table public.retencao_config (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ciclo_recompra_dias integer not null check (ciclo_recompra_dias between 1 and 1095),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.retencao_config enable row level security;

create policy "select_own" on public.retencao_config
  for select using (user_id = auth.uid());

create policy "insert_own" on public.retencao_config
  for insert with check (user_id = auth.uid());

create policy "update_own" on public.retencao_config
  for update using (user_id = auth.uid());

create trigger set_retencao_config_updated_at
  before update on public.retencao_config
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Carteira de clientes.
-- ============================================================================
create table public.retencao_clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  empresa text,
  notas text,
  -- 'jornada' = importado dos contatos que fecharam na Fase Clientes;
  -- 'manual' = cadastrado direto aqui (inclusive por quem nunca fez a Jornada).
  origem text not null default 'manual' check (origem in ('jornada', 'manual')),
  origem_contato_id uuid references public.jornada_clientes_contatos (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Importação idempotente: o mesmo contato da Jornada nunca vira dois clientes.
-- Parcial porque `origem_contato_id` é null pra todo cliente manual, e null
-- não colide com null em índice único no Postgres — mas ser explícito aqui
-- deixa a intenção legível.
create unique index retencao_clientes_origem_contato_unico
  on public.retencao_clientes (user_id, origem_contato_id)
  where origem_contato_id is not null;

create index retencao_clientes_user_idx on public.retencao_clientes (user_id);

alter table public.retencao_clientes enable row level security;

create policy "select_own" on public.retencao_clientes
  for select using (user_id = auth.uid());

create policy "insert_own" on public.retencao_clientes
  for insert with check (user_id = auth.uid());

create policy "update_own" on public.retencao_clientes
  for update using (user_id = auth.uid());

create policy "delete_own" on public.retencao_clientes
  for delete using (user_id = auth.uid());

create trigger set_retencao_clientes_updated_at
  before update on public.retencao_clientes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Interações — a fonte de verdade de "quando foi a última vez".
--
-- Tudo que o módulo afirma sobre um cliente (está em dia, esfriou, sumiu,
-- voltou a comprar) sai daqui, de uma data que o empreendedor registrou de
-- fato. Nada é estimado (PRD §4): sem interação registrada, o cliente aparece
-- como "sem histórico", não como "sumido".
--
-- `valor` só faz sentido em compra e é sempre opcional — mesma decisão da
-- Primeira Venda (SDD-47): nunca obrigar a informar dinheiro pra registrar
-- um fato que aconteceu (RN-1, baixa fricção).
-- ============================================================================
create table public.retencao_interacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.retencao_clientes (id) on delete cascade,
  tipo text not null check (tipo in ('compra', 'contato')),
  valor numeric(12, 2) check (valor is null or valor >= 0),
  ocorrida_em date not null default current_date,
  notas text,
  created_at timestamptz not null default now()
);

create index retencao_interacoes_cliente_idx
  on public.retencao_interacoes (cliente_id, ocorrida_em desc);

alter table public.retencao_interacoes enable row level security;

-- Mesmo padrão de policy por dono indireto já usado em
-- `jornada_clientes_contatos`/`jornada_fornecedores` (SDD-41/45), aqui via
-- `retencao_clientes.user_id`.
create policy "select_own" on public.retencao_interacoes
  for select using (
    exists (select 1 from public.retencao_clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

create policy "insert_own" on public.retencao_interacoes
  for insert with check (
    exists (select 1 from public.retencao_clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

create policy "update_own" on public.retencao_interacoes
  for update using (
    exists (select 1 from public.retencao_clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

create policy "delete_own" on public.retencao_interacoes
  for delete using (
    exists (select 1 from public.retencao_clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

-- ============================================================================
-- Roteiro de reaproximação gerado pela Mary — um por cliente, regenerável.
--
-- Mesmo padrão de entregável de IA de `jornada_deliverables` (upsert com
-- `versao` incrementando, RN-26), mas em tabela própria: `jornada_deliverables`
-- é chaveada por `jornada_instance_id`, e este módulo não depende de jornada.
-- ============================================================================
create table public.retencao_roteiros (
  cliente_id uuid primary key references public.retencao_clientes (id) on delete cascade,
  conteudo jsonb not null,
  versao integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.retencao_roteiros enable row level security;

create policy "select_own" on public.retencao_roteiros
  for select using (
    exists (select 1 from public.retencao_clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

create policy "insert_own" on public.retencao_roteiros
  for insert with check (
    exists (select 1 from public.retencao_clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

create policy "update_own" on public.retencao_roteiros
  for update using (
    exists (select 1 from public.retencao_clientes c where c.id = cliente_id and c.user_id = auth.uid())
  );

create trigger set_retencao_roteiros_updated_at
  before update on public.retencao_roteiros
  for each row execute function public.set_updated_at();
