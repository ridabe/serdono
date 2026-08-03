-- Ser Dono — Módulo "Meu Negócio em Dia" (SDD-61, PRD §12.8).
--
-- Quarto módulo do catálogo. Pergunta central: "o que eu tenho que pagar,
-- declarar ou renovar pra não perder o meu CNPJ?" — a lacuna era exatamente
-- essa: a Jornada leva o empreendedor até "aberto e funcionando"
-- (Formalização, SDD-38) e larga ele bem onde a obrigação recorrente começa.
--
-- DECISÃO CENTRAL DE SCHEMA — catálogo curado seedado por MIGRATION, não por
-- CRUD de admin (diferente de `dicas_materiais`/SDD-59):
--   Conteúdo aqui é fiscal/legal e muda por LEI (Receita Federal, Simples
--   Nacional), não por curadoria editorial do dono do produto. Um admin sem
--   contexto tributário editando "dia do vencimento do DAS" pelo painel é
--   risco maior que benefício; mesmo raciocínio já usado no conteúdo
--   estático de `jornada_etapa_templates` na fase Formalização (SDD-38),
--   que também não tem CRUD de admin. Atualizar valor/data exige nova
--   migration, com a mesma disciplina de citar fonte e data (RN-20) que
--   valeu pra semear o catálogo inicial (fontes na SDD-61).
--
-- `jornada_instances.regime_formalizacao` (SDD-38) é binário demais pra este
-- módulo (só `mei`/`formal`) — não cobre a distinção pedida pelo dono do
-- produto entre MEI, ME/EPP no Simples Nacional e Lucro Presumido/Real. Por
-- isso a config do módulo tem o próprio campo `regime`, mais granular,
-- independente do que a Jornada guarda.
--
-- Dono do dado é o USUÁRIO (`user_id`), não a jornada — mesmo raciocínio de
-- RN-29 já aplicado em `retencao_config`/SDD-54: o módulo funciona pra quem
-- nunca fez a Jornada (fluxo "já tenho negócio", SDD-52).

-- ============================================================================
-- Catálogo: o módulo em si (SDD-30). Liberação continua manual pelo admin
-- via `user_modules` — planos pagos seguem não existindo (PRD §17).
-- ============================================================================
insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'meu-negocio-em-dia',
  'Meu Negócio em Dia',
  'O que você precisa pagar, declarar ou renovar este mês pra não perder o seu CNPJ — com data real e passo a passo, no seu regime.',
  4,
  true
)
on conflict (slug) do nothing;

-- ============================================================================
-- Configuração por usuário: regime da empresa + se tem funcionários (muda
-- quais obrigações trabalhistas se aplicam). Sem essa config, o módulo não
-- lista nenhuma obrigação — prefere perguntar a supor o regime errado.
-- ============================================================================
create table public.obrigacoes_config (
  user_id uuid primary key references auth.users (id) on delete cascade,
  regime text not null check (regime in ('mei', 'simples', 'presumido_real')),
  tem_funcionarios boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.obrigacoes_config enable row level security;

create policy "select_own" on public.obrigacoes_config
  for select using (user_id = auth.uid());

create policy "insert_own" on public.obrigacoes_config
  for insert with check (user_id = auth.uid());

create policy "update_own" on public.obrigacoes_config
  for update using (user_id = auth.uid());

create trigger set_obrigacoes_config_updated_at
  before update on public.obrigacoes_config
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Catálogo curado de obrigações — mesmo padrão de leitura livre / escrita
-- admin de `niches`/`modules`. `regime` é array porque algumas obrigações
-- (ex.: renovação de alvará) valem pros três regimes.
-- ============================================================================
create table public.obrigacoes_catalogo (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  regime text[] not null,
  requer_funcionarios boolean not null default false,
  nome text not null,
  descricao text not null,
  como_fazer text not null,
  regra_vencimento jsonb not null,
  fonte_url text not null,
  fonte_data date not null,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.obrigacoes_catalogo enable row level security;

create policy "obrigacoes_catalogo_read_all" on public.obrigacoes_catalogo
  for select using (auth.role() = 'authenticated');

create policy "obrigacoes_catalogo_write_admin" on public.obrigacoes_catalogo
  for all using (auth.jwt() ->> 'user_role' = 'admin')
  with check (auth.jwt() ->> 'user_role' = 'admin');

-- ============================================================================
-- Marcação por período: o único fato que o produto de fato conhece é "o
-- empreendedor marcou que resolveu isso". RN-35: nunca inferir pagamento
-- pela data ter passado — sem marcação, a tela mostra "prazo passou, marque
-- quando resolver", nunca "não pago".
-- ============================================================================
create table public.obrigacoes_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  obrigacao_id uuid not null references public.obrigacoes_catalogo (id) on delete cascade,
  periodo_referencia text not null,
  concluido_em timestamptz not null default now(),
  unique (user_id, obrigacao_id, periodo_referencia)
);

create index obrigacoes_status_user_idx on public.obrigacoes_status (user_id);

alter table public.obrigacoes_status enable row level security;

create policy "select_own" on public.obrigacoes_status
  for select using (user_id = auth.uid());

create policy "insert_own" on public.obrigacoes_status
  for insert with check (user_id = auth.uid());

create policy "delete_own" on public.obrigacoes_status
  for delete using (user_id = auth.uid());

-- ============================================================================
-- Seed do catálogo — fontes reais consultadas em 03/08/2026 (ver SPEC.md
-- SDD-61 para os links completos). Itens de regra municipal/estadual
-- (alvará, ICMS, ISS) usam `regra_vencimento = {"tipo":"variavel"}` e nunca
-- fingem uma data única — mesmo tratamento que RN-19 já dá a alvará na
-- fase Formalização.
-- ============================================================================
insert into public.obrigacoes_catalogo
  (slug, regime, requer_funcionarios, nome, descricao, como_fazer, regra_vencimento, fonte_url, fonte_data, ordem)
values
  (
    'das-mei',
    array['mei'],
    false,
    'DAS-MEI (contribuição mensal)',
    'O boleto único mensal do MEI — junta INSS, ICMS e/ou ISS num valor fixo, sem depender do quanto você faturou.',
    'Gere o boleto no Portal do Empreendedor (gov.br/empreendedor), aba "Emitir Guia de Pagamento (DAS)", e pague em qualquer banco, lotérica ou app bancário até o vencimento.',
    '{"tipo":"mensal_dia_fixo","dia":20}',
    'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/maio/microempreendedor-individual-mei-tem-ate-31-de-maio-para-entregar-declaracao-anual',
    '2026-08-03',
    1
  ),
  (
    'dasn-simei',
    array['mei'],
    false,
    'DASN-SIMEI (declaração anual)',
    'Uma vez por ano, todo MEI declara quanto faturou no ano anterior — mesmo que não tenha faturado nada.',
    'Acesse o Portal do Simples Nacional (gov.br/receitafederal, sistema DASN-SIMEI) com seu CNPJ e código de acesso ou login gov.br, informe o faturamento do ano anterior e transmita.',
    '{"tipo":"anual_dia_mes","dia":31,"mes":5}',
    'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/maio/microempreendedor-individual-mei-tem-ate-31-de-maio-para-entregar-declaracao-anual',
    '2026-08-03',
    2
  ),
  (
    'pgdas-das-simples',
    array['simples'],
    false,
    'PGDAS-D e DAS (Simples Nacional)',
    'Todo mês você declara o faturamento no PGDAS-D e ele já gera o DAS, o boleto único que substitui vários impostos.',
    'Acesse o PGDAS-D no Portal do Simples Nacional (gov.br/receitafederal), informe a receita bruta do mês por atividade, transmita e pague o DAS gerado.',
    '{"tipo":"mensal_dia_fixo","dia":20}',
    'https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual_pgdas-d_2018_v4.pdf',
    '2026-08-03',
    1
  ),
  (
    'defis',
    array['simples'],
    false,
    'DEFIS (declaração anual do Simples Nacional)',
    'Declaração anual de informações socioeconômicas e fiscais de quem é ME/EPP no Simples Nacional — resume o ano inteiro pra Receita.',
    'Acesse o PGDAS-D/DEFIS no Portal do Simples Nacional, preencha os dados socioeconômicos e de sócios do ano anterior e transmita.',
    '{"tipo":"anual_dia_mes","dia":31,"mes":3}',
    'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2025/dezembro/receita-federal-orienta-contribuintes-sobre-a-entrega-do-pgdas-d-e-da-defis-antes-da-entrada-em-vigor-das-novas-regras-de-multa-por-atraso',
    '2026-08-03',
    2
  ),
  (
    'irpj-csll-presumido',
    array['presumido_real'],
    false,
    'IRPJ e CSLL (trimestral)',
    'No Lucro Presumido/Real, esses dois impostos federais são apurados por trimestre, sobre o lucro (presumido ou real).',
    'A apuração e a guia (DARF) normalmente saem do sistema contábil da empresa — este é o tipo de cálculo que vale a pena deixar com o seu contador (RN-36).',
    '{"tipo":"trimestral_ultimo_dia_mes_seguinte"}',
    'https://www.cora.com.br/blog/calendario-obrigacoes-pj/',
    '2026-08-03',
    1
  ),
  (
    'pis-cofins-presumido',
    array['presumido_real'],
    false,
    'PIS e COFINS (mensal)',
    'Contribuições federais mensais sobre o faturamento, recolhidas junto com IRPJ/CSLL no Lucro Presumido/Real.',
    'Apuração via sistema contábil da empresa; a guia (DARF) sai desse mesmo processo — acompanhe com seu contador.',
    '{"tipo":"mensal_dia_fixo","dia":25}',
    'https://www.cora.com.br/blog/calendario-obrigacoes-pj/',
    '2026-08-03',
    2
  ),
  (
    'icms-iss-presumido',
    array['simples', 'presumido_real'],
    false,
    'ICMS/ISS (varia por estado/cidade)',
    'Esses impostos têm regra e vencimento próprios de cada estado (ICMS) ou cidade (ISS) — não existe uma data única pro Brasil inteiro.',
    'Consulte a Secretaria da Fazenda do seu estado (ICMS) ou a prefeitura da sua cidade (ISS) pro calendário e a forma de recolhimento específicos.',
    '{"tipo":"variavel"}',
    'https://www.cora.com.br/blog/calendario-obrigacoes-pj/',
    '2026-08-03',
    3
  ),
  (
    'obrigacoes-trabalhistas',
    array['mei', 'simples', 'presumido_real'],
    true,
    'Obrigações trabalhistas mensais (com funcionários)',
    'Ter funcionário traz FGTS, eSocial e guia da previdência todo mês — além de 13º e férias quando vencerem.',
    'FGTS e eSocial normalmente saem da folha de pagamento processada pelo seu contador ou sistema de RH; o vencimento do FGTS é o dia 7 do mês seguinte ao trabalhado.',
    '{"tipo":"mensal_dia_fixo","dia":7}',
    'https://www.cora.com.br/blog/calendario-obrigacoes-pj/',
    '2026-08-03',
    4
  ),
  (
    'renovacao-alvara',
    array['mei', 'simples', 'presumido_real'],
    false,
    'Renovação de alvará/licença',
    'Alvará de funcionamento e licenças (sanitária, de bombeiros etc.) costumam ter validade e precisar de renovação periódica — a regra é da sua prefeitura.',
    'Consulte a prefeitura da sua cidade sobre prazo de validade e como renovar — mesma orientação já dada na fase Formalização da Jornada.',
    '{"tipo":"variavel"}',
    'https://www.gov.br/receitafederal/pt-br',
    '2026-08-03',
    5
  );
