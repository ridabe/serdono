-- Ser Dono — Jornada Empreendedora, Fase 5: Formalização (SDD-38).
--
-- Diferente das fases anteriores, o conteúdo de cada etapa NÃO é gerado por
-- IA por usuário — é o mesmo processo burocrático real para todo mundo no
-- mesmo regime (MEI ou empresa formal), então o conteúdo é curado e estático,
-- igual a `niches`/`knowledge_articles`. Duas particularidades desta fase:
--
-- 1. Bifurcação por regime: a primeira etapa pergunta "pretende faturar até
--    R$ 81 mil?" — a resposta decide qual conjunto de etapas seguintes é
--    semeado (MEI: 3 etapas; empresa formal: 9 etapas, nomes exatos pedidos
--    pelo dono do produto). A coluna `aplica_se` marca a qual regime cada
--    template pertence (`null` = a própria etapa da pergunta, sempre semeada).
-- 2. Nenhuma etapa trava outra (`depende_de` vazio em todas) — o empreendedor
--    precisa poder ir e voltar livremente entre as etapas de Formalização,
--    inclusive desmarcando uma já concluída pra refazer, sem que isso quebre
--    outra etapa. O cálculo de progresso já é uma razão simples
--    (concluídas/total), então desmarcar já reduz o percentual sozinho —
--    nenhuma lógica nova de "recontagem" é necessária.

-- ============================================================================
-- Escolha do regime — 1:1 por instância, mesmo padrão de nome_empresa_escolhido.
-- ============================================================================
alter table public.jornada_instances add column regime_formalizacao text
  check (regime_formalizacao in ('mei', 'formal'));

-- ============================================================================
-- Conteúdo curado por etapa: lista de documentos (cada um com explicação de
-- como obter) e prazo esperado. `aplica_se` marca a bifurcação por regime.
-- ============================================================================
alter table public.jornada_etapa_templates add column documentos jsonb not null default '[]'::jsonb;
alter table public.jornada_etapa_templates add column prazo text;
alter table public.jornada_etapa_templates add column aplica_se text check (aplica_se in ('mei', 'formal'));

-- ============================================================================
-- Etapa 1 — a pergunta que decide o regime. Sem documentos/prazo (é uma
-- decisão, não um protocolo). `aplica_se` null: sempre semeada ao entrar na
-- fase, antes de qualquer escolha.
-- ============================================================================
insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('formalizacao_regime', 'formalizacao', 1,
   'Qual o formato da sua empresa?',
   'Sua resposta define o caminho: MEI (mais simples e rápido) ou empresa formal (mais estrutura, permite sócios e faturamento maior).',
   'usuario',
   'O limite de faturamento anual do MEI hoje é R$ 81 mil. Se você não tem certeza do quanto vai faturar no primeiro ano, é mais seguro começar como MEI — é bem mais simples de migrar de MEI para empresa formal depois do que o contrário.',
   '{}');

-- ============================================================================
-- Caminho MEI (aplica_se = 'mei') — 3 etapas.
-- ============================================================================
insert into public.jornada_etapa_templates
  (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de, aplica_se, prazo, documentos)
values
  ('formalizacao_mei_cadastro', 'formalizacao', 2,
   'Cadastro no Portal do Empreendedor',
   'É o único cadastro que já gera o CNPJ na hora, sem esperar aprovação — feito direto em gov.br/empreendedor, com login gov.br nível prata ou ouro. Ao final, você baixa o CCMEI (Certificado de Condição de Microempreendedor Individual), que funciona como o "contrato social" simplificado do MEI.',
   'usuario',
   'Se travar no login gov.br ou tiver dúvida sobre qual CNAE escolher, um contador cobra pouco para fazer esse cadastro por você — vale a pena se você não tem paciência para burocracia online.',
   '{}', 'mei',
   'Na hora — o CNPJ sai imediatamente após o cadastro.',
   '[
     {"nome": "CPF", "como_obter": "Documento que você já tem — não precisa regularizar nada antes."},
     {"nome": "Título de eleitor OU número do recibo do último Imposto de Renda", "como_obter": "Um dos dois é pedido para confirmar sua identidade no cadastro; use o que tiver em mãos."},
     {"nome": "Comprovante de endereço residencial", "como_obter": "Conta de luz, água ou telefone recente no seu nome (ou de alguém da família, com declaração)."},
     {"nome": "Endereço comercial", "como_obter": "Pode ser o mesmo da sua casa, se sua atividade permitir trabalhar de lá — o próprio Portal do Empreendedor avisa se sua atividade tem essa permissão."}
   ]'::jsonb),

  ('formalizacao_mei_cnae', 'formalizacao', 3,
   'Escolha do CNAE',
   'CNAE é o código que identifica sua atividade para a Receita Federal — ele define quais impostos você paga e se sua atividade pode ou não ser MEI (algumas atividades são proibidas para MEI, principalmente serviços regulamentados por conselho profissional). O MEI permite uma atividade principal e até 15 secundárias.',
   'usuario',
   'Se sua atividade não aparecer na lista de ocupações permitidas para MEI, ela provavelmente não pode ser MEI — nesse caso, o caminho é abrir como empresa formal (volte à etapa anterior e escolha a outra opção).',
   '{}', 'mei',
   'Escolhido durante o próprio cadastro do Portal do Empreendedor — não é uma etapa separada no tempo.',
   '[
     {"nome": "Descrição da sua atividade principal", "como_obter": "Escreva em uma frase o que você vai vender ou o serviço que vai prestar — é isso que você vai buscar na lista de CNAEs do Portal do Empreendedor."}
   ]'::jsonb),

  ('formalizacao_mei_alvara', 'formalizacao', 4,
   'Alvará e licenças (se o seu município exigir)',
   'Muitos municípios dispensam o MEI de alvará de funcionamento, principalmente para atividades sem risco (trabalho em casa, sem atendimento ao público). Isso varia de cidade para cidade — consulte a prefeitura da sua cidade ou o Redesim para confirmar se sua atividade específica precisa de alvará, vigilância sanitária ou corpo de bombeiros.',
   'usuario',
   'Se sua atividade envolve alimentos, saúde ou atendimento presencial ao público, é mais provável que precise de licença sanitária ou dos bombeiros além do alvará — nesses casos, vale muito consultar um contador local logo no início, não depois.',
   '{}', 'mei',
   'Varia por município — algumas prefeituras liberam o alvará simplificado do MEI na hora pela internet, outras levam semanas.',
   '[
     {"nome": "CCMEI (Certificado de Condição de MEI)", "como_obter": "Gerado automaticamente no fim do cadastro do Portal do Empreendedor — baixe e guarde uma cópia."},
     {"nome": "Comprovante de endereço do local de atividade", "como_obter": "O mesmo endereço informado no cadastro do CNPJ."}
   ]'::jsonb);

-- ============================================================================
-- Caminho empresa formal (aplica_se = 'formal') — 9 etapas, na ordem e com os
-- nomes pedidos pelo dono do produto.
-- ============================================================================
insert into public.jornada_etapa_templates
  (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de, aplica_se, prazo, documentos)
values
  ('formalizacao_cnae', 'formalizacao', 2,
   'Escolha do CNAE',
   'O CNAE (Classificação Nacional de Atividades Econômicas) é o código que a Receita Federal, a Junta Comercial e a prefeitura usam para saber o que sua empresa faz. Ele afeta diretamente qual regime tributário você pode escolher (Simples Nacional, Lucro Presumido etc.), a alíquota de imposto e se sua atividade precisa de licença especial.',
   'usuario',
   'Escolher o CNAE errado pode te colocar num regime tributário mais caro do que precisava. Essa é uma das perguntas mais baratas de fazer para um contador antes de registrar — vale a consulta.',
   '{}', 'formal',
   'É uma escolha, não um protocolo — normalmente decidida junto com a Natureza Jurídica, antes de ir à Junta Comercial.',
   '[
     {"nome": "Descrição da atividade principal e das secundárias", "como_obter": "Liste tudo que sua empresa vai efetivamente fazer, não só o principal — cada atividade tem um código CNAE próprio."}
   ]'::jsonb),

  ('formalizacao_natureza_juridica', 'formalizacao', 3,
   'Natureza Jurídica',
   'É o "tipo" legal da empresa. As mais comuns para pequeno negócio: Empresário Individual (EI — um dono só, sem separação total entre patrimônio pessoal e da empresa), Sociedade Limitada Unipessoal (SLU — um dono só, mas com patrimônio separado) e Sociedade Limitada (LTDA — dois ou mais sócios, patrimônio separado). A escolha muda sua responsabilidade legal se a empresa tiver dívida.',
   'usuario',
   'Se sua principal dúvida é "e se a empresa quebrar, eu perco minha casa?" — essa é exatamente a pergunta que natureza jurídica responde. Vale levar a um contador ou advogado antes de decidir.',
   '{}', 'formal',
   'Decidida antes do registro — não tem prazo próprio, mas é pré-requisito para preencher o Contrato Social.',
   '[
     {"nome": "Definição de quantos sócios a empresa terá", "como_obter": "Você decide com base no que vai responder na etapa \"Sócios\" — se for só você, a natureza jurídica muda (EI ou SLU em vez de LTDA)."}
   ]'::jsonb),

  ('formalizacao_capital_social', 'formalizacao', 4,
   'Capital Social',
   'É o valor que os sócios declaram ter investido para abrir a empresa — não precisa estar todo em dinheiro na conta no dia do registro (pode ser integralizado aos poucos, conforme o contrato social definir). Aparece no Contrato Social e serve como referência de porte da empresa.',
   'usuario',
   'Declarar um capital social muito baixo é comum, mas pode dificultar abrir conta PJ em alguns bancos ou participar de licitações depois. Um contador ajuda a calibrar um valor realista para o seu caso.',
   '{}', 'formal',
   'Definido junto com o Contrato Social, antes do registro na Junta Comercial.',
   '[
     {"nome": "Valor do capital social declarado", "como_obter": "Não existe valor mínimo obrigatório por lei para LTDA — declare um valor compatível com o que você realmente vai investir para começar (equipamento, estoque inicial, capital de giro)."}
   ]'::jsonb),

  ('formalizacao_socios', 'formalizacao', 5,
   'Sócios',
   'Se a empresa tiver mais de um dono, cada sócio precisa estar formalmente listado, com seus dados e o percentual de participação (quotas) que tem na empresa. Isso define quem decide o quê e como o lucro é dividido.',
   'usuario',
   'Sociedade sem combinado claro sobre divisão de trabalho e decisões é uma das maiores causas de briga entre sócios depois — vale conversar isso abertamente antes de assinar, mesmo entre amigos ou família.',
   '{}', 'formal',
   'Reunido antes de redigir o Contrato Social — sem prazo de órgão público, é organização interna.',
   '[
     {"nome": "CPF e RG (ou CNH) de cada sócio", "como_obter": "Documento pessoal de cada pessoa que vai constar no Contrato Social."},
     {"nome": "Comprovante de endereço de cada sócio", "como_obter": "Conta de luz, água ou telefone recente no nome de cada sócio (ou declaração, se for de outra pessoa da casa)."},
     {"nome": "Percentual de participação de cada sócio", "como_obter": "Vocês decidem entre si — geralmente proporcional ao quanto cada um investiu ou vai trabalhar na empresa; isso vai direto para o Contrato Social."}
   ]'::jsonb),

  ('formalizacao_contrato_social', 'formalizacao', 6,
   'Contrato Social',
   'É o documento que "cria" a empresa oficialmente — nele constam nome empresarial, endereço, atividade (CNAE), capital social, sócios e as regras de administração. É esse documento que você registra na Junta Comercial na próxima etapa.',
   'usuario',
   'Dá para fazer sozinho com um modelo pronto se a sociedade for simples, mas um contrato mal escrito gera problema caro depois (principalmente cláusulas de saída de sócio). Com mais de um sócio, vale muito revisar com um contador ou advogado antes de assinar.',
   '{}', 'formal',
   'Depende de você (ou seu contador) redigir — sem prazo de órgão público nesta etapa, só o tempo de reunir as informações das etapas anteriores.',
   '[
     {"nome": "Modelo de Contrato Social preenchido", "como_obter": "Reúne o que você já decidiu nas etapas anteriores: natureza jurídica, capital social, sócios e CNAE. A Junta Comercial do seu estado disponibiliza modelos padrão gratuitos (busque \"modelo de contrato social\" no site da Junta Comercial do seu estado)."}
   ]'::jsonb),

  ('formalizacao_registro', 'formalizacao', 7,
   'Registro',
   'É o protocolo do Contrato Social na Junta Comercial do seu estado — é esse registro que dá existência legal à empresa e gera o NIRE (Número de Identificação do Registro de Empresas). A maioria dos estados já aceita protocolo digital via Redesim.',
   'usuario',
   'Erros de preenchimento geram "exigência" (pedido de correção) e atrasam tudo — se puder, use um contador para protocolar; muitos cobram um valor fixo só por essa etapa.',
   '{}', 'formal',
   'Costuma sair entre 1 e 5 dias úteis após o protocolo, se não houver exigência (correção pedida pela Junta).',
   '[
     {"nome": "Contrato Social assinado por todos os sócios", "como_obter": "O documento da etapa anterior, assinado (assinatura digital com certificado gov.br ou similar já é aceita pela maioria das Juntas Comerciais)."},
     {"nome": "Guia de recolhimento da taxa da Junta Comercial", "como_obter": "Emitida no próprio site da Junta Comercial do seu estado ao protocolar o pedido de registro."}
   ]'::jsonb),

  ('formalizacao_receita', 'formalizacao', 8,
   'Receita Federal (CNPJ)',
   'Depois do registro na Junta Comercial, o CNPJ é gerado automaticamente pela Receita Federal via integração da Redesim — na maioria dos estados você não precisa fazer nada manualmente aqui, mas vale conferir o CNPJ no site da Receita Federal (Consulta CNPJ) para confirmar que a situação está "Ativa".',
   'usuario',
   'Se depois de alguns dias o CNPJ não aparecer como ativo na consulta da Receita, isso costuma indicar uma pendência no registro — volte à etapa "Registro" ou fale com quem protocolou por você.',
   '{}', 'formal',
   'Geralmente automático, no mesmo dia ou até 1-2 dias úteis após o registro na Junta Comercial.',
   '[
     {"nome": "NIRE (número gerado no registro da Junta Comercial)", "como_obter": "Você recebe automaticamente depois que o registro da etapa anterior é aprovado."}
   ]'::jsonb),

  ('formalizacao_alvara', 'formalizacao', 9,
   'Alvará',
   'É a autorização da prefeitura para sua empresa operar naquele endereço. Cada cidade tem suas próprias regras — o caminho mais seguro é ir direto ao site ou balcão da prefeitura da sua cidade, ou usar o Redesim se seu município já for integrado.',
   'usuario',
   'Este é o ponto onde mais vale ter um contador local: ele já conhece o processo específico da sua prefeitura e evita idas e vindas.',
   '{}', 'formal',
   'Muito variável — de imediato (alvará simplificado online) a várias semanas, dependendo do município e da atividade.',
   '[
     {"nome": "CNPJ ativo", "como_obter": "Emitido na etapa anterior — obrigatório ter em mãos antes de pedir o alvará."},
     {"nome": "Comprovante do endereço comercial", "como_obter": "Contrato de aluguel ou escritura do local onde a empresa vai funcionar."},
     {"nome": "Documentos específicos da sua atividade (se exigidos)", "como_obter": "Varia por cidade — atividades com alimentos, saúde ou grande fluxo de público costumam pedir vistoria da vigilância sanitária e/ou do corpo de bombeiros antes do alvará definitivo. Consulte a prefeitura da sua cidade para saber o que se aplica."}
   ]'::jsonb),

  ('formalizacao_inscricao_estadual', 'formalizacao', 10,
   'Inscrição Estadual',
   'É o cadastro na Secretaria da Fazenda do seu estado — só é obrigatória se sua empresa vende produtos físicos (comércio, indústria) ou presta alguns serviços sujeitos a ICMS. Empresas puramente de serviço (sujeitas só a ISS municipal) geralmente não precisam dela.',
   'usuario',
   'Se você não sabe se sua atividade precisa de Inscrição Estadual, essa é outra pergunta rápida e barata para um contador — evita pedir um cadastro que você nunca vai usar.',
   '{}', 'formal',
   'Costuma sair entre alguns dias e poucas semanas após o pedido, feito no site da Secretaria da Fazenda do seu estado (Sefaz).',
   '[
     {"nome": "CNPJ ativo", "como_obter": "Já emitido nas etapas anteriores."},
     {"nome": "Contrato Social registrado", "como_obter": "O mesmo documento já registrado na Junta Comercial."}
   ]'::jsonb);
