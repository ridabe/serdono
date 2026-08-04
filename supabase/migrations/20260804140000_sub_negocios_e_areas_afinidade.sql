-- Ser Dono — Sub-negócios, áreas de afinidade e ativação do catálogo (SDD-66).
--
-- Origem: o dono do produto testou o funil marcando só "Tecnologia / digital"
-- e recebeu 3 sugestões das quais só 1 tinha a ver com o perfil dele. A
-- SDD-65 já corrigiu o peso do interesse na fórmula, mas a causa principal
-- era ESTRUTURAL, não de inteligência:
--
--   1. O Fit Score só considerava 5 nichos (`ativo_no_mvp = true`), dos quais
--      exatamente 1 era de tecnologia. Como a tela mostra os 3 melhores, 2
--      TINHAM que vir de outra área — matemática, não falta de IA.
--   2. O casamento perfil↔nicho usava `niches.categoria`, um único texto.
--      Vários nichos de perfil digital estavam sob 'serviços'/'varejo'
--      (Agência de marketing digital, Manutenção de informática, Loja
--      virtual, Fotografia e vídeo) — o mesmo defeito que a SDD-65 corrigiu
--      numa linha só, aqui resolvido de vez.
--   3. "Serviço digital" é abstrato pra quem nunca empreendeu: a pessoa não
--      sabe que ali dentro cabe desde desenvolvimento de sites até tráfego
--      pago. Daí o catálogo de sub-negócios.
--
-- ATIVAÇÃO DOS 31 NICHOS — contraria o PRD §8.3 ("os 5 originais são os
-- únicos usados no Fit Score"), levantado e APROVADO pelo dono do produto em
-- 04/08/2026. A razão original da restrição era o dossiê completo
-- (`playbook_md`), mas foi verificado que `playbook_md` NÃO É LIDO POR
-- NENHUMA TELA do produto — é dado morto no banco. Ou seja, a diferença
-- entre "nicho com dossiê" e "sem dossiê" é hoje invisível pro usuário, e
-- ativar não promete nada que não exista (§4/RN-2). Os 26 já têm todos os
-- campos que `calculateFitScore` consome (verificado por query).
--
-- HONESTIDADE DO DADO DE SUB-NEGÓCIO (RN-20): `descricao` diz o que o
-- negócio faz na prática — conhecimento geral, não estatística de mercado,
-- então não carrega fonte. Deliberadamente NÃO existe investimento/margem
-- por sub-negócio: essas faixas continuam sendo as do nicho-pai, que têm
-- fonte real (Sebrae + data). Inventar "Fonte: Sebrae" pra número não
-- consultado seria exatamente o defeito que a RN-20 previne.

-- ============================================================================
-- 1. Áreas de afinidade — um nicho pode atender mais de uma área do
--    diagnóstico. `categoria` continua existindo pra organização/exibição;
--    `areas_afinidade` é o que o Fit Score passa a consultar (com fallback
--    pra `categoria` quando vazio, então nenhum nicho fica pior que antes).
-- ============================================================================
alter table public.niches add column areas_afinidade text[] not null default '{}';

comment on column public.niches.areas_afinidade is
  'Áreas do diagnóstico (bloco Experiência) que este nicho atende. Vazio = usa `categoria` como fallback. Ver packages/core/fitScore.ts::scoreInteresse.';

update public.niches n set areas_afinidade = v.areas
from (values
  -- Os 5 originais do MVP
  ('alimentacao-delivery',           array['alimentação']),
  ('beleza-e-estetica',              array['beleza', 'saúde']),
  ('comercio-de-bairro',             array['varejo']),
  ('servico-digital',                array['tecnologia', 'serviços']),
  ('servicos-domiciliares',          array['serviços']),
  -- Os 26 do catálogo expandido (SDD-52)
  ('academia-personal-trainer',      array['saúde', 'serviços']),
  ('agencia-marketing-digital',      array['tecnologia', 'serviços']),
  ('atelie-costura',                 array['moda', 'serviços']),
  ('aulas-particulares-idiomas',     array['educação', 'serviços']),
  ('barbearia',                      array['beleza', 'serviços']),
  ('brecho-moda-usada',              array['moda', 'varejo']),
  ('buffet-organizacao-eventos',     array['alimentação', 'serviços']),
  ('cafeteria',                      array['alimentação']),
  ('clinica-de-estetica',            array['beleza', 'saúde']),
  ('confeitaria-doces-caseiros',     array['alimentação']),
  ('consultoria-assessoria',         array['serviços']),
  ('escola-infantil-bercario',       array['educação']),
  ('estetica-automotiva',            array['serviços']),
  ('floricultura',                   array['varejo']),
  ('food-truck',                     array['alimentação']),
  ('fotografia-video',               array['tecnologia', 'serviços']),
  ('frete-e-mudancas',               array['serviços']),
  ('lavanderia-self-service',        array['serviços']),
  ('loja-de-roupas',                 array['moda', 'varejo']),
  ('loja-de-suplementos',            array['saúde', 'varejo']),
  ('loja-virtual-ecommerce',         array['tecnologia', 'varejo']),
  ('manutencao-informatica-celular', array['tecnologia', 'serviços']),
  ('marcenaria-moveis-planejados',   array['serviços', 'varejo']),
  ('papelaria-presentes',            array['varejo']),
  ('pequenas-reformas-construcao',   array['serviços']),
  ('pet-shop-banho-tosa',            array['serviços'])
) as v(slug, areas)
where n.slug = v.slug;

-- ============================================================================
-- 2. Catálogo inteiro entra no Fit Score (ver justificativa no cabeçalho).
-- ============================================================================
update public.niches set ativo_no_mvp = true where ativo_no_mvp = false;

-- ============================================================================
-- 3. Sub-negócios — os caminhos concretos dentro de cada nicho.
--    Curado por migration, não por CRUD de admin: é conteúdo de produto que
--    define o que o motor sugere, mesma disciplina de `jornada_etapa_templates`
--    (SDD-38) e `obrigacoes_catalogo` (SDD-61).
-- ============================================================================
create table public.niche_sub_negocios (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references public.niches (id) on delete cascade,
  nome text not null,
  -- Uma frase em português simples (RN-1) dizendo o que o negócio faz na
  -- prática — é o que resolve "Serviço digital não me diz nada".
  descricao text not null,
  -- Ajuda quem respondeu "nas horas livres, ainda empregado" a enxergar o
  -- que dá pra tocar sozinho.
  exige_equipe boolean not null default false,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (niche_id, nome)
);

create index niche_sub_negocios_niche_idx on public.niche_sub_negocios (niche_id, ordem);

alter table public.niche_sub_negocios enable row level security;

create policy "niche_sub_negocios_read_all" on public.niche_sub_negocios
  for select using (auth.role() = 'authenticated');

create policy "niche_sub_negocios_write_admin" on public.niche_sub_negocios
  for all using (auth.jwt() ->> 'user_role' = 'admin')
  with check (auth.jwt() ->> 'user_role' = 'admin');

insert into public.niche_sub_negocios (niche_id, nome, descricao, exige_equipe, ordem)
select n.id, v.nome, v.descricao, v.exige_equipe, v.ordem
from public.niches n
join (values
  -- ---- Serviço digital ----
  ('servico-digital', 'Criação de sites e lojas virtuais', 'Você monta e mantém sites, páginas de venda e lojas online para outras empresas — normalmente cobrando pela criação e depois uma mensalidade de manutenção.', false, 1),
  ('servico-digital', 'Gestão de redes sociais', 'Você cuida do Instagram, TikTok e Facebook de outros negócios: planeja os posts do mês, cria as artes e legendas, publica e responde as mensagens.', false, 2),
  ('servico-digital', 'Tráfego pago (anúncios online)', 'Você cria e acompanha campanhas de anúncio no Google e nas redes sociais para outras empresas venderem mais, ajustando o que não está dando retorno.', false, 3),
  ('servico-digital', 'Design gráfico e identidade visual', 'Você cria logo, cartão, embalagem e material de divulgação para quem está abrindo ou renovando um negócio.', false, 4),
  ('servico-digital', 'Edição de vídeo para redes', 'Você recebe o material bruto de clientes e entrega vídeos curtos prontos para Reels, TikTok e YouTube, com corte, legenda e trilha.', false, 5),
  ('servico-digital', 'Assessoria administrativa remota', 'Você organiza agenda, e-mails, notas e planilhas de pequenas empresas à distância, sem precisar estar no escritório do cliente.', false, 6),

  -- ---- Alimentação delivery ----
  ('alimentacao-delivery', 'Marmitas congeladas e fitness', 'Você cozinha em lote, congela e vende por encomenda ou assinatura semanal — funciona bem começando da própria cozinha.', false, 1),
  ('alimentacao-delivery', 'Hamburgueria delivery', 'Você monta uma cozinha só para entrega, sem salão, e vende pelos aplicativos e pelo WhatsApp.', true, 2),
  ('alimentacao-delivery', 'Açaí e sobremesas', 'Você vende açaí, sorvete e doces por entrega, com pico de demanda à tarde e à noite.', false, 3),
  ('alimentacao-delivery', 'Almoço executivo para empresas', 'Você entrega refeições fixas para escritórios da região, com contrato mensal em vez de pedido avulso.', true, 4),
  ('alimentacao-delivery', 'Comida japonesa delivery', 'Você prepara e entrega sushi e pratos japoneses, com ticket médio mais alto e forte demanda em fim de semana.', true, 5),

  -- ---- Beleza e estética ----
  ('beleza-e-estetica', 'Salão de cabelo', 'Você atende corte, coloração e tratamento capilar — o serviço mais recorrente do setor, com clientes voltando a cada poucas semanas.', true, 1),
  ('beleza-e-estetica', 'Manicure e pedicure', 'Você atende unhas em salão próprio ou na casa da cliente; é o serviço de menor investimento inicial da área.', false, 2),
  ('beleza-e-estetica', 'Design de sobrancelha e cílios', 'Você faz design, henna e extensão de cílios — atendimento rápido, muita procura e agenda cheia por indicação.', false, 3),
  ('beleza-e-estetica', 'Depilação', 'Você atende depilação com cera ou linha, com clientela recorrente e agendamento previsível.', false, 4),
  ('beleza-e-estetica', 'Estética facial e corporal', 'Você faz limpeza de pele, massagem e procedimentos estéticos — exige curso específico, mas tem ticket médio maior.', false, 5),

  -- ---- Comércio de bairro ----
  ('comercio-de-bairro', 'Minimercado', 'Você vende itens de reposição rápida para os moradores da vizinhança, que compram no dia a dia em vez de ir ao mercado grande.', true, 1),
  ('comercio-de-bairro', 'Hortifrúti', 'Você vende frutas, verduras e legumes, com giro diário e margem melhor que a de mercearia comum.', true, 2),
  ('comercio-de-bairro', 'Loja de conveniência', 'Você abre em horário estendido vendendo bebidas, lanches e itens de emergência, apostando na conveniência e não no preço.', true, 3),
  ('comercio-de-bairro', 'Empório e produtos naturais', 'Você vende itens saudáveis, a granel e artesanais para um público disposto a pagar mais por qualidade.', false, 4),
  ('comercio-de-bairro', 'Distribuidora de bebidas', 'Você vende bebidas em maior volume para consumidores e pequenos comércios da região.', true, 5),

  -- ---- Serviços domiciliares ----
  ('servicos-domiciliares', 'Limpeza residencial', 'Você faz faxina em casas e apartamentos, normalmente com clientes fixos semanais ou quinzenais.', false, 1),
  ('servicos-domiciliares', 'Marido de aluguel (pequenos reparos)', 'Você resolve consertos do dia a dia — torneira, tomada, prateleira, fechadura — para quem não tem tempo ou ferramenta.', false, 2),
  ('servicos-domiciliares', 'Montagem e instalação de móveis', 'Você monta móveis comprados pela internet e instala suportes, prateleiras e eletrodomésticos.', false, 3),
  ('servicos-domiciliares', 'Limpeza de estofados e sofás', 'Você higieniza sofá, colchão e tapete na casa do cliente, com equipamento próprio e ticket maior que faxina comum.', false, 4),
  ('servicos-domiciliares', 'Jardinagem e cuidado de plantas', 'Você mantém jardins, corta grama e cuida de plantas em casas e condomínios, com visitas periódicas.', false, 5),

  -- ---- Agência de marketing digital ----
  ('agencia-marketing-digital', 'Agência de tráfego pago', 'Você gerencia a verba de anúncio de vários clientes ao mesmo tempo, cobrando mensalidade mais um percentual do investido.', false, 1),
  ('agencia-marketing-digital', 'Agência de social media', 'Você assume as redes sociais de um grupo de clientes, com contrato mensal e entrega de conteúdo recorrente.', false, 2),
  ('agencia-marketing-digital', 'Consultoria de marketing para pequenos negócios', 'Você orienta o dono do negócio a divulgar melhor, sem executar por ele — cobra por hora ou por projeto.', false, 3),
  ('agencia-marketing-digital', 'Produção de conteúdo e SEO', 'Você escreve textos e artigos que fazem o site do cliente aparecer no Google sem depender de anúncio pago.', false, 4),

  -- ---- Loja virtual (e-commerce) ----
  ('loja-virtual-ecommerce', 'Loja virtual de nicho', 'Você vende online para um público bem específico (pet, bebê, ciclismo), o que reduz a concorrência com as grandes lojas.', false, 1),
  ('loja-virtual-ecommerce', 'Venda em marketplaces', 'Você vende dentro do Mercado Livre, Shopee ou Amazon, aproveitando o tráfego deles em vez de criar site próprio.', false, 2),
  ('loja-virtual-ecommerce', 'Clube de assinatura', 'Você entrega uma caixa ou um produto todo mês por assinatura, o que traz receita previsível.', false, 3),
  ('loja-virtual-ecommerce', 'Produtos personalizados sob demanda', 'Você vende camiseta, caneca e quadro personalizados, produzindo só depois da venda — sem estoque parado.', false, 4),

  -- ---- Manutenção de informática e celular ----
  ('manutencao-informatica-celular', 'Assistência técnica de celular', 'Você troca telas, baterias e conectores — o serviço de maior giro da área, com peça de custo previsível.', false, 1),
  ('manutencao-informatica-celular', 'Manutenção de computadores e notebooks', 'Você faz limpeza, troca de peça, formatação e recuperação de dados para pessoas e escritórios.', false, 2),
  ('manutencao-informatica-celular', 'Suporte de TI para pequenas empresas', 'Você cuida de computadores, rede e backup de empresas pequenas com contrato mensal, em vez de conserto avulso.', false, 3),
  ('manutencao-informatica-celular', 'Venda de acessórios e peças', 'Você complementa o conserto vendendo capa, película, carregador e fone — margem alta e compra por impulso.', false, 4),

  -- ---- Fotografia e vídeo ----
  ('fotografia-video', 'Fotografia de casamento e eventos', 'Você cobre casamentos, formaturas e festas — ticket alto por trabalho, mas concentrado em fins de semana.', false, 1),
  ('fotografia-video', 'Fotografia de produto para e-commerce', 'Você fotografa produtos para lojas online, com demanda recorrente conforme o cliente lança itens novos.', false, 2),
  ('fotografia-video', 'Ensaios fotográficos', 'Você faz ensaio de gestante, recém-nascido, família e pessoal, normalmente em estúdio ou externa.', false, 3),
  ('fotografia-video', 'Produção de vídeo institucional', 'Você grava e edita vídeos de apresentação, depoimento e treinamento para empresas.', false, 4),

  -- ---- Consultoria e assessoria ----
  ('consultoria-assessoria', 'Consultoria financeira para pequenas empresas', 'Você organiza o caixa, o preço e as contas de negócios pequenos que crescem sem controle financeiro.', false, 1),
  ('consultoria-assessoria', 'Assessoria de RH e departamento pessoal', 'Você cuida de contratação, folha e rotinas trabalhistas de empresas que não têm setor próprio.', false, 2),
  ('consultoria-assessoria', 'Consultoria de processos e produtividade', 'Você mapeia como a empresa trabalha e propõe formas de fazer o mesmo com menos retrabalho.', false, 3),
  ('consultoria-assessoria', 'Assessoria para abertura de empresas', 'Você conduz a burocracia de abrir CNPJ, escolher CNAE e obter alvará para quem está começando.', false, 4),

  -- ---- Academia e personal trainer ----
  ('academia-personal-trainer', 'Personal trainer autônomo', 'Você atende alunos individualmente, em academia parceira, em casa ou ao ar livre — o menor investimento inicial da área.', false, 1),
  ('academia-personal-trainer', 'Estúdio de treino funcional', 'Você monta um espaço próprio para turmas pequenas, cobrando mensalidade em vez de aula avulsa.', true, 2),
  ('academia-personal-trainer', 'Aulas de pilates', 'Você atende em estúdio com aparelhos, com turmas reduzidas e público que costuma ficar por muitos meses.', true, 3),
  ('academia-personal-trainer', 'Assessoria esportiva para corrida', 'Você monta treinos e acompanha grupos de corrida, com mensalidade e forte senso de comunidade.', false, 4),

  -- ---- Aulas particulares e idiomas ----
  ('aulas-particulares-idiomas', 'Aulas de inglês', 'Você dá aula individual ou em grupo pequeno, presencial ou online, com mensalidade recorrente.', false, 1),
  ('aulas-particulares-idiomas', 'Reforço escolar', 'Você ajuda alunos com dificuldade em matérias específicas, com pico de procura perto das provas.', false, 2),
  ('aulas-particulares-idiomas', 'Preparatório para concurso e vestibular', 'Você prepara candidatos para provas específicas, com ticket maior e prazo definido por edital.', false, 3),
  ('aulas-particulares-idiomas', 'Curso online gravado', 'Você grava uma vez e vende muitas vezes — exige mais trabalho no começo, mas escala sem aumentar sua carga horária.', false, 4),

  -- ---- Escola infantil e berçário ----
  ('escola-infantil-bercario', 'Berçário', 'Você cuida de bebês em período integral ou parcial, com exigência alta de estrutura e equipe.', true, 1),
  ('escola-infantil-bercario', 'Educação infantil (pré-escola)', 'Você atende crianças em idade pré-escolar, com mensalidade e calendário letivo definidos.', true, 2),
  ('escola-infantil-bercario', 'Contraturno escolar', 'Você recebe a criança no período oposto ao da escola, com atividades e apoio na lição de casa.', true, 3),
  ('escola-infantil-bercario', 'Escola bilíngue', 'Você agrega ensino de segundo idioma à rotina, com mensalidade mais alta e público específico.', true, 4),

  -- ---- Barbearia ----
  ('barbearia', 'Barbearia de bairro', 'Você atende corte e barba do público local, com clientes voltando a cada duas ou três semanas.', false, 1),
  ('barbearia', 'Barbearia premium com assinatura', 'Você cobra um plano mensal com cortes ilimitados ou pacote fechado, garantindo receita previsível.', true, 2),
  ('barbearia', 'Barbeiro em domicílio', 'Você atende na casa ou no escritório do cliente, sem custo de ponto fixo.', false, 3),
  ('barbearia', 'Barbearia infantil', 'Você monta um ambiente pensado para crianças, com ticket maior e forte indicação entre pais.', false, 4),

  -- ---- Clínica de estética ----
  ('clinica-de-estetica', 'Estética facial', 'Você faz limpeza de pele, peeling e tratamentos faciais, com pacotes de várias sessões.', false, 1),
  ('clinica-de-estetica', 'Estética corporal', 'Você atende massagem modeladora, drenagem e tratamentos corporais, normalmente vendidos em pacote.', false, 2),
  ('clinica-de-estetica', 'Depilação a laser', 'Você investe em equipamento próprio e vende sessões em pacote, com retorno por cliente bem alto.', false, 3),
  ('clinica-de-estetica', 'Micropigmentação', 'Você faz sobrancelha, lábio e couro cabeludo — exige curso e prática, com ticket alto por procedimento.', false, 4),

  -- ---- Confeitaria e doces caseiros ----
  ('confeitaria-doces-caseiros', 'Bolos por encomenda', 'Você produz bolos de aniversário e comemoração sob encomenda, começando da própria cozinha.', false, 1),
  ('confeitaria-doces-caseiros', 'Doces para festa', 'Você vende brigadeiro, docinho e mesa de doces por cento, com demanda concentrada em fins de semana.', false, 2),
  ('confeitaria-doces-caseiros', 'Bolo no pote e sobremesas individuais', 'Você vende porções individuais de giro rápido, com preço acessível e venda por redes sociais.', false, 3),
  ('confeitaria-doces-caseiros', 'Confeitaria sem açúcar ou sem glúten', 'Você atende quem tem restrição alimentar — público menor, mas fiel e disposto a pagar mais.', false, 4),

  -- ---- Cafeteria ----
  ('cafeteria', 'Cafeteria de bairro', 'Você atende o movimento local com café, lanche e atendimento próximo, criando frequência diária.', true, 1),
  ('cafeteria', 'Coffee shop para trabalho remoto', 'Você oferece mesas, tomada e wi-fi para quem trabalha fora de casa, aumentando o tempo de permanência e o consumo.', true, 2),
  ('cafeteria', 'Cafeteria com padaria artesanal', 'Você produz o próprio pão e bolo, o que melhora a margem e diferencia da concorrência.', true, 3),
  ('cafeteria', 'Quiosque de café', 'Você opera num espaço pequeno em galeria, prédio ou shopping, com investimento e custo fixo menores.', false, 4),

  -- ---- Food truck ----
  ('food-truck', 'Food truck de hambúrguer', 'Você trabalha com o item de maior saída da rua, com cardápio enxuto e produção rápida.', true, 1),
  ('food-truck', 'Food truck de comida mexicana', 'Você aposta num cardápio menos comum, com boa margem e diferenciação em praças concorridas.', true, 2),
  ('food-truck', 'Food truck de café e lanches', 'Você atende o público da manhã e do fim de tarde, com investimento em equipamento menor que o de cozinha completa.', false, 3),
  ('food-truck', 'Food truck para eventos corporativos', 'Você fecha contrato com empresas e produtoras em vez de depender de movimento de rua — receita mais previsível.', true, 4),

  -- ---- Buffet e eventos ----
  ('buffet-organizacao-eventos', 'Buffet de festa infantil', 'Você cuida de comida, bolo e estrutura de aniversários, com demanda concentrada em fins de semana.', true, 1),
  ('buffet-organizacao-eventos', 'Buffet de casamento', 'Você atende eventos maiores, com ticket alto por contrato e agenda fechada com meses de antecedência.', true, 2),
  ('buffet-organizacao-eventos', 'Coffee break corporativo', 'Você atende empresas em treinamentos e reuniões, com pedidos em dias úteis e contratos recorrentes.', true, 3),
  ('buffet-organizacao-eventos', 'Assessoria e cerimonial de eventos', 'Você organiza e coordena o evento sem produzir a comida, terceirizando fornecedores — investimento inicial bem menor.', false, 4),

  -- ---- Estética automotiva ----
  ('estetica-automotiva', 'Lavagem e higienização', 'Você faz lavagem completa e higienização interna, o serviço de maior giro e entrada da área.', false, 1),
  ('estetica-automotiva', 'Polimento e vitrificação', 'Você recupera e protege a pintura do carro, com ticket bem maior que o da lavagem simples.', false, 2),
  ('estetica-automotiva', 'Envelopamento e película', 'Você aplica insulfilm e envelopamento, exigindo mais técnica e cobrando por isso.', false, 3),
  ('estetica-automotiva', 'Estética automotiva móvel', 'Você vai até o cliente com equipamento próprio, sem custo de ponto fixo.', false, 4),

  -- ---- Frete e mudanças ----
  ('frete-e-mudancas', 'Mudanças residenciais', 'Você transporta e às vezes embala mudanças de casa e apartamento, com pico em início e fim de mês.', true, 1),
  ('frete-e-mudancas', 'Fretes rápidos com utilitário', 'Você faz entregas avulsas e pequenas cargas na cidade, com veículo menor e custo mais baixo.', false, 2),
  ('frete-e-mudancas', 'Entregas para lojas e e-commerce', 'Você fecha contrato de entrega recorrente com comércios da região, em vez de depender de corrida avulsa.', false, 3),
  ('frete-e-mudancas', 'Transporte de materiais de construção', 'Você atende obras e depósitos, com demanda constante e rotas curtas.', false, 4),

  -- ---- Lavanderia ----
  ('lavanderia-self-service', 'Lavanderia self-service', 'O cliente lava e seca sozinho nas suas máquinas — operação enxuta, com pouca necessidade de equipe.', false, 1),
  ('lavanderia-self-service', 'Lavanderia com coleta e entrega', 'Você busca e devolve a roupa na casa do cliente, cobrando pela conveniência.', false, 2),
  ('lavanderia-self-service', 'Lavagem de tapetes e estofados', 'Você atende peças grandes que não cabem na máquina de casa, com ticket alto por item.', false, 3),
  ('lavanderia-self-service', 'Lavanderia para empresas', 'Você atende hotéis, restaurantes e clínicas com contrato mensal e volume previsível.', true, 4),

  -- ---- Loja de roupas ----
  ('loja-de-roupas', 'Moda feminina', 'Você trabalha o segmento de maior giro do varejo de roupa, com troca de coleção frequente.', false, 1),
  ('loja-de-roupas', 'Moda masculina', 'Você atende um público que compra menos vezes, mas com ticket médio maior e menos troca.', false, 2),
  ('loja-de-roupas', 'Moda infantil', 'Você aproveita a recompra natural — a criança cresce e precisa de peça nova a cada temporada.', false, 3),
  ('loja-de-roupas', 'Moda fitness', 'Você atende o público de academia, com peças de margem boa e forte venda por redes sociais.', false, 4),

  -- ---- Brechó ----
  ('brecho-moda-usada', 'Brechó físico', 'Você monta uma loja de peças usadas selecionadas, com custo de estoque bem menor que o do varejo novo.', false, 1),
  ('brecho-moda-usada', 'Brechó online', 'Você vende por Instagram e marketplaces sem ponto fixo, fotografando peça a peça.', false, 2),
  ('brecho-moda-usada', 'Brechó de luxo', 'Você trabalha peças de grife em bom estado, com ticket alto e público que busca autenticidade.', false, 3),
  ('brecho-moda-usada', 'Brechó infantil', 'Você aposta na troca rápida de tamanho das crianças, o que gera recompra e também revenda pelos pais.', false, 4),

  -- ---- Ateliê de costura ----
  ('atelie-costura', 'Ajustes e consertos de roupa', 'Você faz barra, ajuste e conserto — serviço de entrada, procura constante e investimento baixo.', false, 1),
  ('atelie-costura', 'Roupa sob medida', 'Você cria peças exclusivas para o cliente, com ticket bem maior e prazo mais longo por peça.', false, 2),
  ('atelie-costura', 'Uniformes para empresas', 'Você produz em lote para empresas e escolas, com pedido grande e recorrente.', true, 3),
  ('atelie-costura', 'Enxoval e artigos para casa', 'Você produz cortina, jogo de cama e almofada sob medida, muito ligado a reforma e mudança.', false, 4),

  -- ---- Loja de suplementos ----
  ('loja-de-suplementos', 'Loja de suplementos de bairro', 'Você atende o público de academia da região, com recompra mensal previsível.', false, 1),
  ('loja-de-suplementos', 'Suplementos online', 'Você vende por redes sociais e marketplace sem depender de ponto de rua.', false, 2),
  ('loja-de-suplementos', 'Quiosque dentro de academia', 'Você opera dentro da academia, com público certo passando na sua frente todos os dias.', false, 3),
  ('loja-de-suplementos', 'Produtos naturais e saudáveis', 'Você amplia para alimentação saudável em geral, atingindo além de quem treina.', false, 4),

  -- ---- Floricultura ----
  ('floricultura', 'Floricultura de bairro', 'Você vende flores e arranjos no varejo, com picos fortes em datas comemorativas.', false, 1),
  ('floricultura', 'Flores para eventos e casamentos', 'Você faz a decoração floral de festas, com contrato fechado e ticket alto por evento.', true, 2),
  ('floricultura', 'Assinatura de flores', 'Você entrega arranjo novo toda semana ou todo mês para casas e empresas, gerando receita recorrente.', false, 3),
  ('floricultura', 'Plantas ornamentais e paisagismo', 'Você vende plantas e monta jardins, com ticket maior e menos dependência de data comemorativa.', false, 4),

  -- ---- Marcenaria ----
  ('marcenaria-moveis-planejados', 'Móveis planejados sob medida', 'Você projeta e produz armário e cozinha sob medida, com ticket alto e venda por projeto.', true, 1),
  ('marcenaria-moveis-planejados', 'Reparo e restauro de móveis', 'Você recupera móveis antigos ou danificados — investimento inicial menor que o de produzir do zero.', false, 2),
  ('marcenaria-moveis-planejados', 'Móveis para comércio', 'Você atende lojas, bares e restaurantes que precisam de balcão e mobiliário sob medida.', true, 3),
  ('marcenaria-moveis-planejados', 'Peças de decoração em madeira', 'Você produz itens menores em série e vende online, sem depender de obra ou projeto grande.', false, 4),

  -- ---- Papelaria e presentes ----
  ('papelaria-presentes', 'Papelaria escolar', 'Você atende a demanda de material escolar, com pico forte no início do ano letivo.', false, 1),
  ('papelaria-presentes', 'Papelaria criativa e personalizados', 'Você vende planner, adesivo e itens personalizados, com margem melhor que a de material comum.', false, 2),
  ('papelaria-presentes', 'Loja de presentes', 'Você trabalha itens de presente para datas comemorativas o ano inteiro.', false, 3),
  ('papelaria-presentes', 'Impressão e serviços gráficos rápidos', 'Você agrega cópia, impressão e encadernação, que trazem movimento diário para a loja.', false, 4),

  -- ---- Pequenas reformas ----
  ('pequenas-reformas-construcao', 'Reforma de banheiro e cozinha', 'Você atende os cômodos mais reformados das casas, com projeto de poucas semanas e ticket alto.', true, 1),
  ('pequenas-reformas-construcao', 'Pintura residencial', 'Você faz pintura interna e externa — entrada mais barata da construção civil, com equipe pequena.', false, 2),
  ('pequenas-reformas-construcao', 'Elétrica e hidráulica', 'Você resolve instalação e reparo, com forte demanda de urgência e pouca concorrência qualificada.', false, 3),
  ('pequenas-reformas-construcao', 'Gesso, drywall e acabamento', 'Você faz forro, sanca e divisória, muito ligado a reforma e a apartamento novo.', false, 4),

  -- ---- Pet shop ----
  ('pet-shop-banho-tosa', 'Banho e tosa', 'Você atende a higiene dos pets, com clientes voltando a cada duas ou quatro semanas.', false, 1),
  ('pet-shop-banho-tosa', 'Pet shop com loja', 'Você soma ração, acessório e brinquedo ao serviço, aumentando o gasto por cliente.', true, 2),
  ('pet-shop-banho-tosa', 'Banho e tosa móvel', 'Você atende dentro de um veículo adaptado na porta do cliente, sem custo de ponto fixo.', false, 3),
  ('pet-shop-banho-tosa', 'Creche e hospedagem para pets', 'Você cuida do animal durante o dia ou nas viagens do tutor, com diária e alta procura em feriado.', true, 4)
) as v(slug, nome, descricao, exige_equipe, ordem) on v.slug = n.slug;

-- ============================================================================
-- 4. Diagnóstico: pergunta aberta + o que a IA inferiu dela.
--    `areas_inferidas` é persistido de propósito (RN-37): o que a IA entendeu
--    do texto tem que ser auditável e visível pro usuário, nunca uma caixa
--    preta que muda a ordem das sugestões sem explicação.
-- ============================================================================
alter table public.diagnostic_responses add column interesses_texto text;
alter table public.diagnostic_responses add column areas_inferidas text[] not null default '{}';

comment on column public.diagnostic_responses.interesses_texto is
  'Resposta livre e OPCIONAL do bloco 6 ("o que você gosta de fazer"). Sinal muito mais rico que os checkboxes — é o que a IA interpreta (SDD-66).';
comment on column public.diagnostic_responses.areas_inferidas is
  'Áreas que a IA extraiu de `interesses_texto`, restritas ao vocabulário fechado do bloco 5. Persistido para ser auditável e exibível (RN-37).';

-- RN-4: o questionário mudou de forma (bloco novo), então a versão do schema
-- sobe — respostas antigas continuam válidas e identificáveis como v1.
alter table public.diagnostic_responses alter column schema_version set default 2;

-- ============================================================================
-- 5. Sub-negócio escolhido na Jornada — mesmo padrão de `nicho_personalizado`
--    (SDD-52). Ganho colateral: `loadBusinessContext` (knowledge-search) já lê
--    esta tabela, então a Mary passa a saber que o negócio é "agência de
--    tráfego pago", não só "serviço digital".
-- ============================================================================
alter table public.jornada_instances
  add column sub_negocio_id uuid references public.niche_sub_negocios (id) on delete set null;
