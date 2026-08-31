-- Ser Dono — Precisão do diagnóstico: motor pensa como micro e pequeno
-- empreendedor (SDD-135).
--
-- Caso real reportado pelo dono do produto: perfil "até R$ 5 mil", meio
-- período, marcou Beleza e escreveu "gosto de cortar cabelo e fazer barba" —
-- recebeu vendedor / aulas particulares / serviço digital, e Barbearia em 19º
-- de 31. A afinidade quase não pesava, o capital derrubava qualquer nicho com
-- piso de vitrine, e o texto livre virava só uma área genérica ("beleza").
--
-- Este é o passo de dados; a fórmula está em packages/core/fitScore.ts e a
-- inferência de nicho pelo texto na Edge Function diagnostic-match.

-- ============================================================================
-- 1. "Começar de casa" — piso de entrada enxuto no Fit Score.
--    As faixas do catálogo assumem ponto alugado, reforma e fachada. Um
--    barbeiro monta a primeira cadeira em casa; a barbearia de rua é o passo
--    seguinte. `permite_inicio_em_casa` libera o piso reduzido SEM mexer em
--    `dependencia_ponto_fisico`, que segue valendo pra relevância da fase
--    Estrutura da Jornada (getNicheEstruturaInfo) e pra página /quanto-custa.
-- ============================================================================
alter table public.niches add column permite_inicio_em_casa boolean not null default false;

comment on column public.niches.permite_inicio_em_casa is
  'true quando dá pra COMEÇAR de casa / atendendo na casa do cliente, mesmo que a operação madura queira ponto. Libera o piso de investimento enxuto no Fit Score (packages/core/fitScore.ts, SDD-135). Não confundir com dependencia_ponto_fisico.';

update public.niches set permite_inicio_em_casa = true
where slug in (
  'barbearia',
  'beleza-e-estetica',
  'pet-shop-banho-tosa',
  'estetica-automotiva',
  'brecho-moda-usada',
  'manutencao-informatica-celular'
);

-- ============================================================================
-- 2. Catálogo inteiro no diagnóstico. Os 18 nichos de baixa estrutura da
--    SDD-134 entraram só no catálogo público e na tela "já tenho negócio"
--    (`ativo_no_mvp = false`). O dono do produto pediu (31/08/2026) que
--    também entrem no Fit Score: o sistema é feito pra micro e pequeno
--    empreendedor, então o barbeiro com R$ 5 mil precisa ver "Cabeleireiro e
--    barbeiro a domicílio" (R$ 500–5 mil), não só a "Barbearia" formal.
-- ============================================================================
update public.niches set ativo_no_mvp = true where ativo_no_mvp = false;

-- ============================================================================
-- 3. Texto livre → nichos (estende a inferência de áreas da SDD-66).
--    Filtrado contra o catálogo real antes de tocar em qualquer nota (RN-38);
--    persistido pra ser auditável e exibível na tela de resultado (RN-37).
-- ============================================================================
alter table public.diagnostic_responses add column nichos_inferidos text[] not null default '{}';

comment on column public.diagnostic_responses.nichos_inferidos is
  'Slugs de nicho que a IA extraiu de interesses_texto, filtrados contra o catálogo (RN-38). Sinal mais forte que areas_inferidas: "corto cabelo e faço barba" aponta barbearia, não só beleza. Ver supabase/functions/diagnostic-match/index.ts::inferirNichosDoTexto (SDD-135).';

-- ============================================================================
-- 4. Sinais do novo motor guardados no resultado, pra tela e histórico.
-- ============================================================================
alter table public.niche_matches add column precisa_de_mais_capital boolean not null default false;
alter table public.niche_matches add column afinidade_direta boolean not null default false;

comment on column public.niche_matches.precisa_de_mais_capital is
  'O capital declarado não cobre nem o começo enxuto deste nicho — a tela mostra "dá pra mirar, planeje um pouco mais de caixa" em vez de esconder a sugestão (SDD-135).';
comment on column public.niche_matches.afinidade_direta is
  'A pessoa citou este ramo no texto livre do diagnóstico (nichos_inferidos). Ordena antes do fit_score na tela de resultado (SDD-135).';
