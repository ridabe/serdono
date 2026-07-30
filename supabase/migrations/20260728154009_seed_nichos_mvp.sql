-- Ser Dono — Seed dos nichos do MVP (Documento de Conceito §12: 5 a 8 nichos,
-- alta demanda, baixa complexidade regulatória).
--
-- Conteúdo inicial revisável: faixas de investimento e margens vêm de
-- pesquisa de mercado geral (Sebrae e guias do setor, ver `fonte`/`fonte_data`
-- em cada linha, RN-20) — não são números fechados de contrato, servem para
-- o diagnóstico funcionar ponta a ponta com dado real, não fictício. Revisar
-- com dados primários antes de usar para decisão de investimento do usuário.

insert into public.niches (
  nome, slug, categoria,
  investimento_min, investimento_max, tempo_ate_equilibrio_meses,
  complexidade_regulatoria, sazonalidade, margem_tipica_pct,
  intensidade_mao_de_obra, dependencia_ponto_fisico, nivel_concorrencia,
  perfil_cliente, playbook_md, fonte, fonte_data, ativo_no_mvp
) values
(
  'Serviços domiciliares', 'servicos-domiciliares', 'serviços',
  300, 3000, 2,
  2, '{"observacao": "demanda estável o ano todo, leve alta em dezembro/janeiro"}'::jsonb, 55,
  5, false, 3,
  'Famílias e profissionais ocupados que preferem terceirizar limpeza, pequenos reparos e manutenção residencial.',
  E'## Panorama\nServiços domiciliares (diarista, faxina, pequenos reparos) têm a menor barreira de entrada dos 5 nichos do MVP: CNAE de MEI já previsto (9700-5/00), investimento inicial concentrado em transporte e material de limpeza.\n\n## Estrutura de custos\nCusto principal é o próprio tempo do prestador. Margem líquida típica de 55% depois de transporte e material.\n\n## Riscos e barreiras\nSazonalidade baixa, mas renda depende diretamente das horas trabalhadas — sem escala sem contratar terceiros.',
  'Sebrae — MEI Faxineiro(a), guia de ideia de negócio', '2026-07-01', true
),
(
  'Alimentação delivery', 'alimentacao-delivery', 'alimentação',
  5000, 35000, 6,
  4, '{"observacao": "picos em datas comemorativas e finais de semana"}'::jsonb, 25,
  4, false, 5,
  'Consumidores locais que buscam praticidade — famílias, jovens profissionais, pedidos por app.',
  E'## Panorama\nModelo dark kitchen (só delivery, sem salão) reduz drasticamente o investimento frente a um restaurante tradicional, mas exige alvará sanitário e curso de manipulação de alimentos.\n\n## Estrutura de custos\nMargem mais apertada que outros nichos do MVP por causa de insumos, embalagem e taxa das plataformas de entrega.\n\n## Riscos e barreiras\nConcorrência alta e regulação sanitária são os dois maiores obstáculos — exige atenção redobrada na etapa de formalização (Trilha C).',
  'Guias de mercado do setor de delivery (Saipos, OlaClick), 2026 — exigência sanitária confirmada nos requisitos de MEI de alimentação do Sebrae', '2026-07-01', true
),
(
  'Beleza e estética', 'beleza-e-estetica', 'beleza',
  3000, 35000, 8,
  2, '{"observacao": "alta em datas comemorativas (dia das mães, festas de fim de ano)"}'::jsonb, 45,
  4, true, 4,
  'Público que busca autocuidado recorrente — cortes, tratamentos, manicure, estética facial e corporal.',
  E'## Panorama\nMercado de beleza brasileiro tem demanda constante e recorrente. Pode começar autônomo (cadeira alugada, atendimento a domicílio) antes de investir num salão próprio.\n\n## Estrutura de custos\nInvestimento varia muito com o formato: de uma maleta de manicure a um salão completo com múltiplos profissionais.\n\n## Riscos e barreiras\nDependência de ponto físico se for salão próprio — localização e visibilidade pesam na conta.',
  'Sebrae — Guia de Investimento, Salão de Beleza', '2026-07-01', true
),
(
  'Comércio de bairro', 'comercio-de-bairro', 'varejo',
  15000, 50000, 10,
  3, '{"observacao": "estável, com alta leve no fim de mês (pagamento de salário) e datas comemorativas"}'::jsonb, 20,
  3, true, 4,
  'Moradores da vizinhança buscando conveniência — reposição rápida, sem precisar ir a um mercado grande.',
  E'## Panorama\nMercadinho ou mercearia de bairro: capital inicial concentrado em ponto comercial, reforma leve, equipamentos (geladeira, freezer, balcão) e estoque inicial.\n\n## Estrutura de custos\nMargem mais apertada do grupo — o negócio compensa no giro (volume de vendas), não na margem por item.\n\n## Riscos e barreiras\nDependência de ponto físico é total; localização e concorrência de mercados maiores são o principal risco.',
  'Sebrae — Guia de Investimento, Minimercados', '2026-07-01', true
),
(
  'Serviço digital', 'servico-digital', 'serviços',
  300, 5000, 3,
  1, '{"observacao": "pouca sazonalidade, picos pontuais conforme demanda de clientes (ex.: campanhas de fim de ano)"}'::jsonb, 70,
  3, false, 4,
  'Pequenas empresas e outros empreendedores que precisam de design, redação, gestão de redes sociais ou suporte administrativo remoto.',
  E'## Panorama\nMenor investimento inicial dos 5 nichos do MVP — o principal ativo é a habilidade do prestador (design, redação, tráfego pago, assistência virtual), não capital.\n\n## Estrutura de custos\nMargem mais alta do grupo: sem estoque, sem ponto físico, custo principal é tempo e eventualmente ferramentas/assinaturas de software.\n\n## Riscos e barreiras\nMaior concorrência por atenção (marketplaces como Workana/99Freelas/Fiverr) e dependência de portfólio para conquistar os primeiros clientes.',
  'Sebrae — "Empreender com menos de R$500,00 é possível"', '2026-07-01', true
);
