-- Ser Dono — Jornada Empreendedora, Fase 7: Estrutura (SDD-40).
--
-- Checklist de itens de infraestrutura do negócio (local, internet, conta
-- bancária, site, CRM etc.) que o empreendedor precisa resolver na sequência
-- da abertura. Duas particularidades desta fase, pedidas pelo dono do
-- produto em 30/07/2026:
--
-- 1. Nada bloqueia o avanço para a próxima fase (Marketing) — diferente do
--    padrão geral do motor de etapas (RN-8), aqui o empreendedor pode
--    avançar com o checklist parcialmente feito e voltar a qualquer momento
--    para marcar o que já resolveu. Mesmo padrão de "nada trava" já usado em
--    Formalização (RN-23), mas aplicado também ao avanço de fase, não só
--    entre etapas da própria fase.
-- 2. Checklist inteligente por tipo de negócio: nem todo item se aplica a
--    todo nicho (ex.: Maquininha não é essencial pra quem não depende de
--    ponto físico; CRM/ERP não são essenciais pra quem vende de balcão sem
--    controle de estoque/relacionamento recorrente). As duas colunas novas
--    abaixo guardam o critério de dispensa como dado de configuração —
--    mesmo padrão de `aplica_se` na Formalização — pra não engessar a regra
--    dentro do código do app.

-- ============================================================================
-- Nova fase no motor de etapas.
-- ============================================================================
alter table public.jornada_etapa_templates drop constraint jornada_etapa_templates_fase_check;
alter table public.jornada_etapa_templates add constraint jornada_etapa_templates_fase_check
  check (fase in (
    'validacao_ideia', 'planejamento', 'formalizacao',
    'financeiro', 'estrutura', 'marketing', 'clientes', 'retencao', 'escala'
  ));

alter table public.jornada_instances drop constraint jornada_instances_fase_atual_check;
alter table public.jornada_instances add constraint jornada_instances_fase_atual_check
  check (fase_atual in (
    'validacao_ideia', 'planejamento', 'formalizacao',
    'financeiro', 'estrutura', 'marketing', 'clientes', 'retencao', 'escala'
  ));

-- ============================================================================
-- Critério de relevância por nicho. `dispensavel_sem_ponto_fisico`: item
-- deixa de ser essencial quando `niches.dependencia_ponto_fisico = false`.
-- `dispensavel_categorias`: item deixa de ser essencial quando
-- `niches.categoria` está nesta lista. Sem nenhum critério marcado (padrão),
-- o item é sempre essencial — comportamento seguro se um nicho novo não
-- bater com nenhuma regra.
-- ============================================================================
alter table public.jornada_etapa_templates add column dispensavel_sem_ponto_fisico boolean not null default false;
alter table public.jornada_etapa_templates add column dispensavel_categorias text[] not null default '{}';

-- ============================================================================
-- As 12 etapas da fase — todas `tipo_conclusao = 'usuario'` (ação no mundo
-- real) e `depende_de` vazio (nenhuma trava a outra, mesmo padrão de
-- Formalização). `ordem` segue a lista definida pelo dono do produto.
-- ============================================================================
insert into public.jornada_etapa_templates
  (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de, dispensavel_sem_ponto_fisico, dispensavel_categorias)
values
  ('estrutura_local', 'estrutura', 1,
   'Local',
   'O espaço físico de onde você vai operar o negócio — pode ser uma loja, um ponto comercial, uma cozinha, um estúdio ou até um cantinho dedicado na sua própria casa.',
   'usuario',
   'Se seu negócio não depende de receber cliente presencialmente, começar de casa é normal e mais barato — boa parte dos municípios aceita formalizar o próprio endereço residencial como comercial. Se depende de ponto físico (loja, atendimento ao público), pesquise pelo menos 3 imóveis antes de fechar contrato e confirme o zoneamento da atividade com a prefeitura.',
   '{}', false, '{}'),

  ('estrutura_internet', 'estrutura', 2,
   'Internet',
   'Conexão de internet estável para atender cliente, usar sistema de vendas, redes sociais e emitir nota fiscal.',
   'usuario',
   'Trabalhando de casa, um bom plano residencial já resolve no início. Com ponto físico usando maquininha e sistema de vendas, vale um plano empresarial com suporte prioritário — internet fora do ar é venda parada.',
   '{}', false, '{}'),

  ('estrutura_telefone', 'estrutura', 3,
   'Telefone',
   'Um número (fixo, celular ou WhatsApp Business) para o cliente conseguir falar com você ou com o negócio.',
   'usuario',
   'WhatsApp Business é gratuito e já cobre a maior parte dos casos no início — tem catálogo, respostas automáticas e etiquetas de atendimento. Separar um número só do negócio, diferente do seu pessoal, ajuda assim que der.',
   '{}', false, '{}'),

  ('estrutura_notebook', 'estrutura', 4,
   'Notebook',
   'Um computador (ou notebook) para lidar com planilhas, sistema de vendas, emissão de nota fiscal e a gestão financeira do dia a dia.',
   'usuario',
   'Não precisa ser um modelo caro — a maioria dos sistemas de gestão e emissores de nota fiscal roda bem em qualquer notebook básico, ou até num tablet, se o negócio for simples no início.',
   '{}', false, '{}'),

  ('estrutura_erp', 'estrutura', 5,
   'ERP',
   'Sistema que integra estoque, vendas, financeiro e emissão de nota fiscal em um só lugar — substitui controlar tudo em planilhas separadas.',
   'usuario',
   'Se o negócio tem estoque de produto físico, vale considerar um ERP simples desde o início (muitos emissores de nota fiscal já incluem controle básico de estoque). Prestando serviço sem estoque, uma planilha organizada mais o emissor de nota fiscal já dão conta no começo.',
   '{}', false, '{"serviços","beleza"}'),

  ('estrutura_conta_bancaria', 'estrutura', 6,
   'Conta Bancária',
   'Uma conta no nome do CNPJ, separada da sua conta pessoal — é o que permite emitir nota fiscal, receber pagamentos como empresa e organizar as finanças do negócio.',
   'usuario',
   'A maioria dos bancos digitais abre conta PJ gratuita em poucos minutos pelo app, direto com o CNPJ. Nunca misture dinheiro do negócio com dinheiro pessoal — é a causa mais comum de descontrole financeiro no começo.',
   '{}', false, '{}'),

  ('estrutura_pix', 'estrutura', 7,
   'Pix',
   'Chave Pix vinculada à conta PJ do negócio, para receber pagamentos rápidos e sem taxa.',
   'usuario',
   'Cadastre a chave (o próprio CNPJ como chave é o mais comum) direto no app do banco — leva menos de um minuto e já pode ser usada no mesmo dia.',
   '{}', false, '{}'),

  ('estrutura_maquininha', 'estrutura', 8,
   'Maquininha',
   'Equipamento para receber pagamento com cartão de débito/crédito presencialmente.',
   'usuario',
   'Compare taxa e prazo de recebimento entre pelo menos 3 operadoras antes de escolher — a diferença de taxa impacta direto sua margem. Se o negócio é 100% online, Pix e link de pagamento já resolvem, sem precisar de maquininha agora.',
   '{}', true, '{}'),

  ('estrutura_email', 'estrutura', 9,
   'E-mail',
   'Um e-mail dedicado ao negócio (idealmente no formato contato@suaempresa.com.br), para separar do seu e-mail pessoal e passar mais confiança.',
   'usuario',
   'No início, mesmo um e-mail gratuito com o nome do negócio já ajuda. Depois de ter domínio próprio, migrar para um endereço no seu domínio é rápido e profissionaliza o contato com o cliente.',
   '{}', false, '{}'),

  ('estrutura_dominio', 'estrutura', 10,
   'Domínio',
   'O endereço do seu negócio na internet (ex.: suaempresa.com.br) — é o que viabiliza site e e-mail profissional com a sua marca.',
   'usuario',
   'Registrar um domínio .com.br custa pouco por ano (via registro.br ou revendedores) e é rápido. Se ainda não decidiu o nome definitivo, a etapa "Nome da Empresa" da fase Planejamento já checou a disponibilidade de domínio pra você.',
   '{}', false, '{}'),

  ('estrutura_site', 'estrutura', 11,
   'Site',
   'Uma página na internet onde o cliente encontra seu negócio, o que você vende e como falar com você — pode ser um site completo ou uma landing page simples.',
   'usuario',
   'Não precisa ser complexo no início: uma página de uma tela só, com o que você oferece, fotos e contato, já ajuda bastante. Ferramentas gratuitas ou de baixo custo resolvem enquanto o negócio ainda é pequeno.',
   '{}', false, '{}'),

  ('estrutura_crm', 'estrutura', 12,
   'CRM',
   'Sistema para organizar contatos, histórico de conversas e follow-up de clientes — ajuda a não perder venda por esquecimento e a entender quem já comprou de você.',
   'usuario',
   'Negócios com venda recorrente ou ciclo de venda mais longo (serviços, consultoria, agendamento) se beneficiam bastante de um CRM desde cedo — mesmo uma planilha organizada já é um começo. Com venda rápida de balcão, dá pra deixar essa ferramenta pra depois.',
   '{}', false, '{"varejo","alimentação"}');
