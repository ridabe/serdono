-- Ser Dono — Expansão do catálogo de nichos, de 5 para 31 (SDD-52).
--
-- Pedido do dono do produto: quem já tem negócio (fluxo novo desta SDD)
-- precisa se identificar num catálogo bem mais amplo que os 5 nichos do
-- MVP — aqueles continuam sendo os únicos com dossiê completo, usados no
-- Fit Score do diagnóstico de novo empreendedor (`ativo_no_mvp = true`,
-- filtro já aplicado em `diagnostic-match/index.ts:162`).
--
-- Os 26 nichos abaixo entram num nível mais leve, de propósito (decisão
-- registrada no plano desta SDD): o suficiente pra identificação no fluxo
-- de negócio existente e pro filtro de relevância de Estrutura
-- (`categoria`/`dependencia_ponto_fisico`) — sem o dossiê de mercado
-- completo (`playbook_md` fica null; evolução posterior, não bloqueia este
-- lançamento). `ativo_no_mvp = false`: NÃO entram no Fit Score do
-- diagnóstico de novo empreendedor, só aparecem na tela de seleção do fluxo
-- de negócio existente — dois catálogos com propósito diferente, mesma
-- tabela.
--
-- Faixas de investimento/margem são estimativa de mercado geral (mesmo
-- espírito de honestidade da RN-20 dos 5 nichos originais — não é dado de
-- contrato, é ponto de partida pra funcionar com número real, não
-- fictício); citada a categoria de fonte (Sebrae — guias de ideia de
-- negócio/investimento por setor), sem inventar um link ou data de
-- publicação específica que não temos como verificar.

insert into public.niches (
  nome, slug, categoria,
  investimento_min, investimento_max, tempo_ate_equilibrio_meses,
  complexidade_regulatoria, sazonalidade, margem_tipica_pct,
  intensidade_mao_de_obra, dependencia_ponto_fisico, nivel_concorrencia,
  perfil_cliente, fonte, fonte_data, ativo_no_mvp
) values
('Confeitaria e doces caseiros', 'confeitaria-doces-caseiros', 'alimentação', 1000, 8000, 4, 3, '{"observacao": "picos em datas comemorativas"}'::jsonb, 45, 3, false, 4, 'Consumidores locais e encomendas por redes sociais.', 'Sebrae — MEI Doceira(o), guia de ideia de negócio', '2026-07-31', false),
('Brechó e moda usada', 'brecho-moda-usada', 'varejo', 2000, 15000, 6, 2, '{"observacao": "alta em trocas de estação"}'::jsonb, 50, 2, true, 3, 'Consumidores conscientes buscando preço menor.', 'Sebrae — Guia de Investimento, Brechó', '2026-07-31', false),
('Pet shop (banho e tosa)', 'pet-shop-banho-tosa', 'serviços', 5000, 30000, 8, 3, '{"observacao": "demanda estável o ano todo"}'::jsonb, 40, 4, true, 4, 'Tutores de pets.', 'Sebrae — Ideias de Negócio, Pet Shop', '2026-07-31', false),
('Academia e personal trainer', 'academia-personal-trainer', 'saúde', 3000, 25000, 6, 2, '{"observacao": "alta em janeiro/fevereiro"}'::jsonb, 60, 2, false, 4, 'Pessoas buscando saúde e estética.', 'Sebrae — Personal Trainer, MEI', '2026-07-31', false),
('Barbearia', 'barbearia', 'beleza', 8000, 40000, 8, 2, '{"observacao": "sazonalidade leve"}'::jsonb, 45, 4, true, 5, 'Público masculino recorrente.', 'Sebrae — Guia de Investimento, Barbearia', '2026-07-31', false),
('Consultoria e assessoria empresarial', 'consultoria-assessoria', 'serviços', 500, 10000, 4, 2, '{"observacao": "baixa sazonalidade"}'::jsonb, 65, 2, false, 4, 'Pequenas empresas.', 'Sebrae — Consultoria Empresarial', '2026-07-31', false),
('Aulas particulares e idiomas', 'aulas-particulares-idiomas', 'educação', 300, 5000, 3, 1, '{"observacao": "alta no início do ano/semestre"}'::jsonb, 70, 2, false, 3, 'Estudantes e adultos buscando qualificação.', 'Sebrae — Aulas Particulares, MEI', '2026-07-31', false),
('Ateliê de costura', 'atelie-costura', 'moda', 1000, 10000, 5, 2, '{"observacao": "estável"}'::jsonb, 50, 3, false, 3, 'Clientes de ajuste e roupa sob medida.', 'Sebrae — Costureira(o), MEI', '2026-07-31', false),
('Fotografia e produção de vídeo', 'fotografia-video', 'serviços', 5000, 30000, 6, 1, '{"observacao": "alta em casamentos e eventos (out-mar)"}'::jsonb, 55, 2, false, 4, 'Famílias, empresas e casais.', 'Sebrae — Fotógrafo(a), MEI', '2026-07-31', false),
('Marcenaria e móveis planejados', 'marcenaria-moveis-planejados', 'varejo', 10000, 60000, 10, 3, '{"observacao": "estável"}'::jsonb, 35, 4, true, 3, 'Famílias reformando ou mobiliando.', 'Sebrae — Marcenaria, Guia de Investimento', '2026-07-31', false),
('Floricultura', 'floricultura', 'varejo', 5000, 25000, 6, 2, '{"observacao": "alta em datas comemorativas"}'::jsonb, 40, 3, true, 3, 'Consumidores em datas especiais e eventos.', 'Sebrae — Floricultura, Guia de Investimento', '2026-07-31', false),
('Loja de roupas', 'loja-de-roupas', 'varejo', 10000, 50000, 8, 2, '{"observacao": "alta em troca de estação e datas comemorativas"}'::jsonb, 45, 3, true, 5, 'Consumidores locais de moda.', 'Sebrae — Loja de Roupas, Guia de Investimento', '2026-07-31', false),
('Papelaria e presentes', 'papelaria-presentes', 'varejo', 8000, 40000, 8, 2, '{"observacao": "alta na volta às aulas e datas comemorativas"}'::jsonb, 35, 3, true, 4, 'Estudantes, famílias e escritórios.', 'Sebrae — Papelaria, Guia de Investimento', '2026-07-31', false),
('Lavanderia self-service', 'lavanderia-self-service', 'serviços', 30000, 100000, 12, 3, '{"observacao": "baixa sazonalidade"}'::jsonb, 30, 2, true, 3, 'Moradores de apartamento e famílias sem tempo.', 'Sebrae — Lavanderia, Guia de Investimento', '2026-07-31', false),
('Food truck', 'food-truck', 'alimentação', 20000, 80000, 8, 4, '{"observacao": "depende de eventos e clima"}'::jsonb, 35, 3, false, 4, 'Público de rua, eventos e feiras.', 'Sebrae — Food Truck, Guia de Investimento', '2026-07-31', false),
('Cafeteria', 'cafeteria', 'alimentação', 30000, 150000, 10, 4, '{"observacao": "sazonalidade leve"}'::jsonb, 30, 4, true, 5, 'Consumidores locais e trabalho remoto.', 'Sebrae — Cafeteria, Guia de Investimento', '2026-07-31', false),
('Loja de suplementos', 'loja-de-suplementos', 'varejo', 15000, 60000, 8, 3, '{"observacao": "alta em janeiro/fevereiro"}'::jsonb, 35, 2, true, 4, 'Praticantes de atividade física.', 'Sebrae — Loja de Suplementos, Guia de Investimento', '2026-07-31', false),
('Manutenção de informática e celular', 'manutencao-informatica-celular', 'serviços', 3000, 20000, 5, 2, '{"observacao": "baixa sazonalidade"}'::jsonb, 45, 2, true, 4, 'Consumidores com equipamento quebrado.', 'Sebrae — Assistência Técnica, MEI', '2026-07-31', false),
('Estética automotiva', 'estetica-automotiva', 'serviços', 5000, 30000, 6, 2, '{"observacao": "sazonalidade leve"}'::jsonb, 45, 3, true, 4, 'Donos de carro.', 'Sebrae — Estética Automotiva, Guia de Investimento', '2026-07-31', false),
('Pequenas reformas e construção', 'pequenas-reformas-construcao', 'serviços', 3000, 30000, 6, 3, '{"observacao": "baixa sazonalidade"}'::jsonb, 40, 4, false, 3, 'Famílias reformando o imóvel.', 'Sebrae — Pequenas Reformas, MEI', '2026-07-31', false),
('Buffet e organização de eventos', 'buffet-organizacao-eventos', 'serviços', 5000, 40000, 8, 3, '{"observacao": "alta out-dez e em casamentos"}'::jsonb, 40, 4, false, 4, 'Famílias e empresas organizando eventos.', 'Sebrae — Buffet, Guia de Investimento', '2026-07-31', false),
('Clínica de estética', 'clinica-de-estetica', 'beleza', 20000, 100000, 10, 4, '{"observacao": "alta em datas comemorativas"}'::jsonb, 50, 3, true, 5, 'Público buscando procedimentos estéticos.', 'Sebrae — Clínica de Estética, Guia de Investimento', '2026-07-31', false),
('Loja virtual (e-commerce de nicho)', 'loja-virtual-ecommerce', 'varejo', 2000, 30000, 6, 2, '{"observacao": "alta em datas comemorativas e Black Friday"}'::jsonb, 35, 2, false, 5, 'Consumidores de um nicho específico, online.', 'Sebrae — Comércio Eletrônico, MEI', '2026-07-31', false),
('Agência de marketing digital', 'agencia-marketing-digital', 'serviços', 1000, 15000, 5, 1, '{"observacao": "baixa sazonalidade"}'::jsonb, 60, 2, false, 5, 'Pequenas empresas precisando de presença digital.', 'Sebrae — Marketing Digital, MEI', '2026-07-31', false),
('Frete e mudanças', 'frete-e-mudancas', 'serviços', 10000, 60000, 6, 2, '{"observacao": "alta em fim/início de mês"}'::jsonb, 35, 3, false, 3, 'Famílias e empresas se mudando.', 'Sebrae — Transporte e Frete, MEI', '2026-07-31', false),
('Escola infantil e berçário', 'escola-infantil-bercario', 'educação', 30000, 150000, 12, 5, '{"observacao": "alta no início do ano letivo"}'::jsonb, 30, 5, true, 3, 'Famílias com crianças pequenas.', 'Sebrae — Educação Infantil, Guia de Investimento', '2026-07-31', false);
