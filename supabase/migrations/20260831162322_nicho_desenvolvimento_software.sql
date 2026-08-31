-- Ser Dono — Nicho "Desenvolvimento de software e sistemas" (SDD-136).
--
-- Buraco no catálogo achado testando o diagnóstico: perfil com "até R$ 40 mil",
-- afinidade tecnologia, texto livre "sou bom com desenvolvimento de sistema,
-- python e programação" — não existia um ramo de DESENVOLVIMENTO. "Serviço
-- digital" é guarda-chuva de marketing/design/admin (sub-negócios: sites,
-- redes sociais, tráfego, design gráfico, edição de vídeo), e "Manutenção de
-- informática" é conserto de hardware. Quem programa não se reconhece em
-- nenhum dos dois.

insert into public.niches (
  nome, slug, categoria,
  investimento_min, investimento_max, tempo_ate_equilibrio_meses,
  complexidade_regulatoria, sazonalidade, margem_tipica_pct,
  intensidade_mao_de_obra, dependencia_ponto_fisico, nivel_concorrencia,
  perfil_cliente, fonte, fonte_data, ativo_no_mvp
) values
(
  'Desenvolvimento de software e sistemas', 'desenvolvimento-de-software', 'tecnologia',
  500, 20000, 4,
  1, '{"observacao": "baixa sazonalidade; demanda puxada por projeto de cliente"}'::jsonb, 65,
  2, false, 4,
  'Empresas que precisam de sistema sob medida, automação ou aplicativo, e outros negócios digitais que terceirizam a parte técnica.',
  'Sebrae — Desenvolvimento de Software, guia de ideia de negócio', '2026-08-31', true
);

update public.niches set areas_afinidade = array['tecnologia']
where slug = 'desenvolvimento-de-software';

insert into public.niche_sub_negocios (niche_id, nome, descricao, exige_equipe, ordem)
select n.id, v.nome, v.descricao, v.exige_equipe, v.ordem
from public.niches n
join (values
  ('desenvolvimento-de-software', 'Desenvolvimento web (sites e sistemas)', 'Você constrói sites, painéis e sistemas que rodam no navegador para outras empresas — cobrando pelo projeto e, muitas vezes, uma mensalidade de manutenção.', false, 1),
  ('desenvolvimento-de-software', 'Aplicativos mobile', 'Você desenvolve apps para Android e iOS sob encomenda, do protótipo à publicação nas lojas.', false, 2),
  ('desenvolvimento-de-software', 'Automação e scripts (Python, planilhas, robôs)', 'Você automatiza tarefas repetitivas de empresas — relatórios, integrações, robôs de coleta — normalmente com projetos curtos e de retorno rápido.', false, 3),
  ('desenvolvimento-de-software', 'Sistemas sob medida para empresas', 'Você levanta a necessidade do cliente e entrega um sistema feito para o processo dele, em vez de um software de prateleira.', false, 4),
  ('desenvolvimento-de-software', 'Integração de sistemas e APIs', 'Você conecta as ferramentas que a empresa já usa (ERP, e-commerce, gateway de pagamento) para que conversem entre si.', false, 5),
  ('desenvolvimento-de-software', 'Consultoria e análise de sistemas', 'Você analisa processos, desenha a solução técnica e orienta a equipe do cliente — cobrando por hora ou por projeto, sem necessariamente programar tudo.', false, 6)
) as v(slug, nome, descricao, exige_equipe, ordem) on v.slug = n.slug;
