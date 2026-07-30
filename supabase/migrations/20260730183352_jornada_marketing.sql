-- Ser Dono — Jornada Empreendedora, Fase 10: Marketing (SDD-43).
--
-- "marketing" já existe no enum de fase desde a primeira migration do motor
-- de etapas — só nunca teve conteúdo. Duas partes, como pedido pelo dono do
-- produto:
--
-- 1. Checklist de 5 canais (Instagram, Facebook, Google, TikTok, WhatsApp
--    Business) — mesmo padrão não-bloqueante das fases anteriores
--    (RN-23/24): 5 etapas independentes, `tipo_conclusao = 'usuario'`,
--    `depende_de` vazio.
-- 2. Geração de bio + sugestões de post + sugestões de anúncio — como
--    Persona/SWOT/Canvas/Proposta de Valor (SDD-32), é ENTREGÁVEL final que
--    o empreendedor vai usar de verdade nas redes, não uma explicação
--    curta — por isso `jornada_deliverables` (não uma etapa própria: o
--    dono do produto pediu explicitamente pra poder gerar de novo sempre
--    que quiser, mesmo padrão do roteiro de fornecedores, SDD-41).
insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('marketing_conta_instagram', 'marketing', 1,
   'Criar conta comercial no Instagram',
   'A rede mais usada pra mostrar o dia a dia do negócio e vender direto pelo perfil — praticamente obrigatória pra qualquer negócio pequeno hoje em dia.',
   'usuario',
   'Crie (ou converta) pra conta comercial gratuita em Configurações > Conta > Mudar para conta profissional — isso libera estatísticas, botão de contato e catálogo de produtos. Preencha foto, bio e link antes de postar o primeiro conteúdo.',
   '{}'),

  ('marketing_conta_facebook', 'marketing', 2,
   'Criar Página no Facebook',
   'Mesmo quem não usa Facebook no dia a dia, ter uma Página (não perfil pessoal) ajuda a aparecer no Google e é pré-requisito pra anunciar no Instagram/Facebook.',
   'usuario',
   'Crie em facebook.com/pages/create — escolha a categoria certa do negócio, preencha endereço e horário de funcionamento se você atende presencial. Dá pra vincular direto com o Instagram depois.',
   '{}'),

  ('marketing_conta_google', 'marketing', 3,
   'Criar Perfil da Empresa no Google',
   'É o que faz seu negócio aparecer no Google Maps e na busca com endereço, horário, telefone e avaliações — o primeiro lugar que cliente novo procura.',
   'usuario',
   'Crie em google.com/business — se você atende no local, peça a verificação por cartão postal ou telefone (o Google confirma que o endereço é real). Responder toda avaliação, boa ou ruim, pesa no algoritmo de busca.',
   '{}'),

  ('marketing_conta_tiktok', 'marketing', 4,
   'Criar conta no TikTok',
   'Rede de vídeo curto com o maior alcance orgânico hoje pra quem tá começando — mesmo sem seguidor, um vídeo pode viralizar.',
   'usuario',
   'Ative a conta comercial gratuita em Configurações > Gerenciar conta > Mudar para conta comercial — libera estatísticas. A Loja do TikTok (TikTok Shop, venda direto no app) só vale configurar se você vende produto físico e já tem estoque/logística prontos; se seu negócio é só serviço, o TikTok normal já é suficiente, pode pular essa parte.',
   '{}'),

  ('marketing_conta_whatsapp', 'marketing', 5,
   'Configurar WhatsApp Business',
   'É o canal onde a maioria das vendas de negócio pequeno realmente acontece — o app WhatsApp Business (separado do WhatsApp comum, gratuito) adiciona catálogo, respostas automáticas e etiquetas de atendimento.',
   'usuario',
   'Baixe o app "WhatsApp Business", cadastre um número (pode ser outro chip, se preferir separar do pessoal) e preencha o catálogo com foto, nome e preço de cada produto/serviço.',
   '{}');

alter table public.jornada_deliverables drop constraint jornada_deliverables_tipo_check;
alter table public.jornada_deliverables add constraint jornada_deliverables_tipo_check
  check (tipo in (
    'persona', 'swot', 'canvas', 'proposta_valor', 'nomes_empresa',
    'identidade_visual', 'fornecedores_roteiro', 'marketing_conteudo'
  ));
