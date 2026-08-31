-- Ser Dono — Nichos de baixa estrutura / "empreender de casa" (SDD-134).
--
-- Pedido do dono do produto (31/08/2026): a seção pública "Quanto custa abrir"
-- (SDD-133) precisa falar também com quem começa pequeno — bolo de pote,
-- cuidador de pets, cuidador de idosos, designer freelancer, manicure em casa.
-- É o negócio que hoje beira a informalidade e que o Ser Dono quer atrair pra
-- se profissionalizar. Em vez de mexer nos 31 nichos já catalogados
-- (identidade de nicho já referenciada por seleção de usuário via niche_id),
-- ADICIONAMOS 18 ramos novos, todos de baixo investimento e sem ponto físico.
--
-- `ativo_no_mvp = false` de propósito: NÃO entram no Fit Score do diagnóstico
-- (`diagnostic-match/index.ts` filtra `ativo_no_mvp = true`) — decisão do dono
-- do produto de não mexer no diagnóstico. Aparecem só onde o catálogo inteiro
-- é lido: a tela "Já tenho um negócio" (`NegocioExistenteScreen.tsx`, sem
-- filtro de flag) e as páginas públicas /quanto-custa (SDD-133).
--
-- `playbook_md` fica null (mesma decisão da SDD-52 — dado morto, nenhuma tela
-- lê, ver cabeçalho da SDD-66). Faixas de investimento/margem são estimativa
-- de mercado geral, mesmo espírito da RN-20 dos nichos originais: ponto de
-- partida com número real, não fechado de contrato; fonte citada é a categoria
-- de guia do Sebrae, sem inventar link/data que não temos.

insert into public.niches (
  nome, slug, categoria,
  investimento_min, investimento_max, tempo_ate_equilibrio_meses,
  complexidade_regulatoria, sazonalidade, margem_tipica_pct,
  intensidade_mao_de_obra, dependencia_ponto_fisico, nivel_concorrencia,
  perfil_cliente, fonte, fonte_data, ativo_no_mvp
) values
('Bolo de pote e sobremesas no pote', 'bolo-de-pote', 'alimentação', 300, 3000, 2, 3, '{"observacao": "demanda estável, alta em datas comemorativas"}'::jsonb, 60, 3, false, 4, 'Consumidores locais e encomendas por redes sociais e WhatsApp.', 'Sebrae — MEI Doceira(o), guia de ideia de negócio', '2026-08-31', false),
('Salgados para festa e congelados', 'salgados-para-festa', 'alimentação', 500, 5000, 3, 3, '{"observacao": "picos em fins de semana e datas comemorativas"}'::jsonb, 55, 3, false, 4, 'Famílias organizando festa e comércios que revendem.', 'Sebrae — Fabricação de Salgados, guia de ideia de negócio', '2026-08-31', false),
('Marmitas fitness e congeladas', 'marmitas-congeladas', 'alimentação', 800, 6000, 3, 3, '{"observacao": "leve alta em janeiro/fevereiro"}'::jsonb, 45, 4, false, 4, 'Pessoas sem tempo de cozinhar e público de academia.', 'Sebrae — Marmitas Congeladas, guia de ideia de negócio', '2026-08-31', false),
('Doces para festa por encomenda', 'doces-para-festa', 'alimentação', 500, 5000, 3, 3, '{"observacao": "demanda concentrada em fins de semana"}'::jsonb, 55, 3, false, 4, 'Famílias e assessorias de evento comprando docinho por cento.', 'Sebrae — MEI Doceira(o), guia de ideia de negócio', '2026-08-31', false),
('Cuidador de pets (hospedagem e creche em casa)', 'cuidador-de-pets', 'serviços', 300, 4000, 2, 2, '{"observacao": "alta em feriados e férias escolares"}'::jsonb, 65, 4, false, 3, 'Tutores que viajam ou passam o dia fora e não querem deixar o pet sozinho.', 'Sebrae — Hospedagem para Animais, guia de ideia de negócio', '2026-08-31', false),
('Cuidador de idosos e acompanhante', 'cuidador-de-idosos', 'saúde', 300, 3000, 1, 2, '{"observacao": "demanda estável o ano todo"}'::jsonb, 60, 5, false, 3, 'Famílias que precisam de apoio no cuidado de um familiar idoso.', 'Sebrae — Cuidador de Idosos, MEI', '2026-08-31', false),
('Personal organizer', 'personal-organizer', 'serviços', 300, 4000, 3, 1, '{"observacao": "leve alta em mudanças e início de ano"}'::jsonb, 65, 3, false, 3, 'Famílias e profissionais ocupados que querem organizar armários, documentos e a casa.', 'Sebrae — Personal Organizer, guia de ideia de negócio', '2026-08-31', false),
('Marido de aluguel (pequenos reparos)', 'marido-de-aluguel', 'serviços', 500, 5000, 2, 2, '{"observacao": "demanda estável o ano todo"}'::jsonb, 60, 4, false, 3, 'Moradores que precisam de conserto rápido e não têm ferramenta ou tempo.', 'Sebrae — Serviços de Reparos, MEI', '2026-08-31', false),
('Passadoria e lavanderia domiciliar', 'passadoria-domiciliar', 'serviços', 300, 3000, 2, 2, '{"observacao": "baixa sazonalidade"}'::jsonb, 45, 4, false, 3, 'Famílias e profissionais sem tempo para lavar e passar roupa.', 'Sebrae — Lavanderia e Passadoria, guia de ideia de negócio', '2026-08-31', false),
('Assistente virtual (suporte administrativo remoto)', 'assistente-virtual', 'serviços', 300, 4000, 3, 1, '{"observacao": "baixa sazonalidade"}'::jsonb, 60, 2, false, 4, 'Pequenas empresas e outros empreendedores que precisam terceirizar agenda, e-mail e planilhas.', 'Sebrae — Assessoria Administrativa, MEI', '2026-08-31', false),
('Manicure e nail designer em casa', 'manicure-em-casa', 'beleza', 500, 5000, 2, 2, '{"observacao": "alta em datas comemorativas"}'::jsonb, 65, 3, false, 4, 'Clientela recorrente que atende em casa ou recebe em um espaço no próprio lar.', 'Sebrae — Manicure e Pedicure, MEI', '2026-08-31', false),
('Designer de sobrancelhas e cílios', 'designer-de-sobrancelhas', 'beleza', 800, 8000, 3, 2, '{"observacao": "alta em datas comemorativas"}'::jsonb, 60, 3, false, 4, 'Público que busca design, henna e extensão de cílios com agenda por indicação.', 'Sebrae — Design de Sobrancelhas, guia de ideia de negócio', '2026-08-31', false),
('Cabeleireiro e barbeiro a domicílio', 'cabeleireiro-a-domicilio', 'beleza', 500, 5000, 2, 2, '{"observacao": "sazonalidade leve"}'::jsonb, 60, 4, false, 4, 'Clientes que preferem ser atendidos em casa ou no trabalho.', 'Sebrae — Cabeleireiro(a), MEI', '2026-08-31', false),
('Designer gráfico freelancer', 'designer-grafico-freelancer', 'serviços', 300, 5000, 3, 1, '{"observacao": "picos pontuais conforme demanda de clientes"}'::jsonb, 65, 2, false, 4, 'Pequenos negócios abrindo ou renovando marca, embalagem e material de divulgação.', 'Sebrae — Designer Gráfico, MEI', '2026-08-31', false),
('Social media freelancer', 'social-media-freelancer', 'serviços', 300, 4000, 3, 1, '{"observacao": "baixa sazonalidade"}'::jsonb, 60, 2, false, 5, 'Pequenos negócios que precisam de presença nas redes mas não têm equipe própria.', 'Sebrae — Gestão de Redes Sociais, MEI', '2026-08-31', false),
('Ateliê de artesanato e lembrancinhas', 'atelie-de-artesanato', 'varejo', 500, 5000, 4, 2, '{"observacao": "alta em datas comemorativas e temporada de festas"}'::jsonb, 50, 3, false, 3, 'Famílias e assessorias de evento comprando lembrancinha e peça personalizada.', 'Sebrae — Artesanato, guia de ideia de negócio', '2026-08-31', false),
('Papelaria personalizada e convites', 'papelaria-personalizada', 'varejo', 800, 8000, 4, 2, '{"observacao": "alta em datas comemorativas e volta às aulas"}'::jsonb, 50, 3, false, 4, 'Quem organiza festa, casamento e chá e quer papelaria sob medida.', 'Sebrae — Papelaria Personalizada, guia de ideia de negócio', '2026-08-31', false),
('Revenda de roupas (sacoleira e catálogo)', 'revenda-de-roupas', 'moda', 500, 6000, 3, 2, '{"observacao": "alta em troca de estação e datas comemorativas"}'::jsonb, 40, 2, false, 4, 'Consumidores locais que compram por catálogo, WhatsApp e no boca a boca.', 'Sebrae — Revenda de Roupas, guia de ideia de negócio', '2026-08-31', false);

-- Áreas de afinidade (mesma disciplina da SDD-66): o Fit Score não consome
-- estes nichos hoje (`ativo_no_mvp = false`), mas deixar preenchido evita que
-- uma futura ativação os jogue no motor sem classificação de área.
update public.niches n set areas_afinidade = v.areas
from (values
  ('bolo-de-pote',                 array['alimentação']),
  ('salgados-para-festa',          array['alimentação']),
  ('marmitas-congeladas',          array['alimentação', 'saúde']),
  ('doces-para-festa',             array['alimentação']),
  ('cuidador-de-pets',             array['serviços']),
  ('cuidador-de-idosos',           array['saúde', 'serviços']),
  ('personal-organizer',           array['serviços']),
  ('marido-de-aluguel',            array['serviços']),
  ('passadoria-domiciliar',        array['serviços']),
  ('assistente-virtual',           array['tecnologia', 'serviços']),
  ('manicure-em-casa',             array['beleza']),
  ('designer-de-sobrancelhas',     array['beleza']),
  ('cabeleireiro-a-domicilio',     array['beleza', 'serviços']),
  ('designer-grafico-freelancer',  array['tecnologia', 'serviços']),
  ('social-media-freelancer',      array['tecnologia', 'serviços']),
  ('atelie-de-artesanato',         array['moda', 'varejo']),
  ('papelaria-personalizada',      array['varejo']),
  ('revenda-de-roupas',            array['moda', 'varejo'])
) as v(slug, areas)
where n.slug = v.slug;
