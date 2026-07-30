-- Ser Dono — Seed inicial da base de conhecimento (RAG)
--
-- Conteúdo parafraseado a partir de fontes oficiais gratuitas — nunca copiado
-- verbatim (direito autoral) — sempre com fonte e data (RN-20). Base inicial
-- revisável e expansível; cobre as 3 áreas pedidas: Empreendedorismo (MEI),
-- Finanças Pessoais e Investimentos.
--
-- Fontes usadas nesta leva:
--  - Governo Federal — Perguntas Frequentes do Empreendedor (Portal Empresas e
--    Negócios), consultado em 28/07/2026.
--  - Banco Central do Brasil — Caderno de Educação Financeira, versão 2026,
--    2ª edição (módulos 2, 3 e 5), consultado em 28/07/2026.

insert into public.knowledge_articles (category_id, titulo, resumo, conteudo, fonte, fonte_url, fonte_data)
select k.id, v.titulo, v.resumo, v.conteudo, v.fonte, v.fonte_url, v.fonte_data::date
from (values

-- ============================================================================
-- EMPREENDEDORISMO (MEI) — Portal Empresas e Negócios, gov.br
-- ============================================================================
(
  'empreendedorismo',
  'O que é o MEI e quem pode se formalizar',
  'MEI é o registro simplificado para quem trabalha como pequeno empresário individual, com faturamento anual de até R$ 81 mil.',
  'O Microempreendedor Individual (MEI) é uma forma simplificada de registro para quem exerce uma atividade econômica por conta própria. Para se formalizar como MEI, a pessoa precisa faturar no máximo R$ 81 mil por ano (ou até R$ 251,6 mil no caso de transportador autônomo de cargas), não pode ter sócios, não pode ser titular, sócia ou administradora de outra empresa, não pode ter filial, pode contratar no máximo um empregado recebendo salário mínimo ou o piso da categoria, e precisa exercer uma ocupação que conste na lista oficial de atividades permitidas para MEI.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'Quem não pode se formalizar como MEI',
  'Menores de 16 anos, sócios de outra empresa e servidores públicos federais em atividade não podem ser MEI.',
  'Não podem se formalizar como MEI: pessoas com menos de 16 anos de idade; quem já é titular, sócio ou administrador de outra empresa; e servidores públicos federais em atividade. Já servidores estaduais ou municipais devem consultar as regras do próprio órgão, porque a permissão varia conforme a legislação local.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'MEI com ressalvas: adolescentes emancipados e quem recebe benefício social',
  'É possível ser MEI com ressalvas em casos como emancipação legal entre 16 e 18 anos, ou recebimento de alguns benefícios sociais.',
  'Existem situações em que a formalização como MEI é permitida, mas com atenção redobrada: pessoas entre 16 e 18 anos, desde que legalmente emancipadas; quem recebe seguro-desemprego (a formalização pode suspender o benefício); e quem recebe BPC-LOAS ou Bolsa Família/Auxílio Brasil (nesses casos normalmente não há cancelamento automático, mas pode haver reavaliação de renda). Já quem recebe auxílio-doença, aposentadoria por invalidez ou licença-maternidade perde o benefício a partir do mês da formalização como MEI.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'Como formalizar o MEI e quanto tempo leva',
  'A formalização é feita de graça, on-line, no Portal do Empreendedor, e fica pronta em poucos minutos.',
  'A formalização do MEI é feita pelo serviço "Formalize-se" do Portal Empresas e Negócios (Portal do Empreendedor), 24 horas por dia, sem qualquer custo — a Lei Complementar 123/2006 isenta o MEI de taxa de abertura e registro. O processo leva poucos minutos: o CNPJ, a inscrição na Junta Comercial e o cadastro no INSS saem na hora, e ao final é emitido o Certificado da Condição de MEI (CCMEI), sem necessidade de levar nenhum documento físico a uma Junta Comercial.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'O que é o CCMEI e por que ele dispensa alvará',
  'O CCMEI é o documento que comprova a formalização e, ao mesmo tempo, dispensa o MEI de tirar alvará e licença de funcionamento.',
  'O Certificado da Condição de Microempreendedor Individual (CCMEI) é o documento que comprova que a formalização foi concluída. Ele também tem efeito de "Termo de Ciência e Responsabilidade" que dispensa o MEI de alvará e licença de funcionamento prévios, já que todas as atividades permitidas para MEI são classificadas como baixo risco. Essa dispensa não elimina, porém, a obrigação de cumprir depois as exigências sanitárias, ambientais, de segurança e de uso do solo aplicáveis ao tipo de negócio.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'MEI pode ter sócio ou fazer contrato social?',
  'Não. O MEI é sempre individual, sem sócios e sem contrato social.',
  'O MEI não pode ter sócios nem ser, ele mesmo, sócio de outra empresa. Como é uma modalidade de empresário individual, o MEI também não tem contrato social — o próprio Certificado da Condição de MEI (CCMEI) já substitui esse documento para todos os efeitos legais.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'MEI pode ter mais de uma atividade (CNAE)?',
  'Sim — além da atividade principal, o MEI pode registrar até 15 atividades secundárias.',
  'O MEI pode ter uma atividade econômica principal e registrar até 15 atividades secundárias (CNAEs), desde que todas constem na lista oficial de ocupações permitidas para essa modalidade. Isso dá alguma flexibilidade para quem presta mais de um tipo de serviço ou vende mais de uma linha de produto.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'MEI é obrigado a emitir nota fiscal?',
  'Só é obrigatório emitir nota fiscal quando o cliente é uma empresa, ou quando o consumidor pede.',
  'Para venda a consumidor pessoa física, o MEI não é obrigado a emitir nota fiscal, exceto se o cliente pedir (o Código de Defesa do Consumidor garante esse direito). Já quando quem compra é outra empresa, a emissão da nota fiscal é obrigatória. Também não é preciso emitir nota fiscal eletrônica (NF-e), a menos que o próprio MEI opte por isso.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'Quais são as obrigações mensais do MEI',
  'O MEI paga um valor fixo mensal (DAS) e precisa registrar suas receitas todo mês.',
  'Todo mês, o MEI paga o Documento de Arrecadação do Simples Nacional (DAS), um valor fixo que já inclui a contribuição ao INSS e, dependendo da atividade, ICMS ou ISS. Além disso, precisa anotar mensalmente o total das receitas brutas recebidas em um relatório simplificado, e guardar por 5 anos as notas fiscais de compra e de venda relacionadas ao negócio.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'O nome fantasia do MEI ainda existe?',
  'Não — o campo de nome fantasia foi descontinuado; para proteger uma marca, o caminho é o INPI.',
  'Desde novembro de 2023, o registro de "nome fantasia" para MEI foi descontinuado no processo de formalização. Quem quer registrar oficialmente uma marca ou um nome de fantasia para o negócio precisa recorrer ao INPI (Instituto Nacional da Propriedade Industrial), fora do processo de abertura do MEI.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'O MEI é fiscalizado depois de aberto?',
  'Sim — a dispensa de alvará não isenta o MEI de cumprir depois as regras sanitárias, ambientais e de segurança.',
  'Mesmo com a dispensa de alvará prévio, o MEI continua obrigado a cumprir as exigências legais da sua atividade, e pode ser fiscalizado quanto a questões trabalhistas, sanitárias, ambientais, de proteção ao consumidor, de prevenção a incêndio e de uso do solo. A lei determina que, na primeira visita, a fiscalização deve ter caráter orientador — explicando o que precisa ser corrigido — em vez de aplicar multa de imediato.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),
(
  'empreendedorismo',
  'MEI pode ter carteira assinada ao mesmo tempo?',
  'Sim, é permitido ser MEI e ter um emprego com carteira assinada ao mesmo tempo.',
  'Não existe impedimento legal para alguém ser MEI e, ao mesmo tempo, ter um emprego formal com carteira assinada. É uma situação comum para quem está começando um negócio próprio como renda extra antes de decidir se sai ou não do emprego atual.',
  'Governo Federal — Portal Empresas e Negócios, Perguntas Frequentes do Empreendedor',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes',
  '2026-07-28'
),

-- ============================================================================
-- FINANÇAS PESSOAIS — Banco Central, Caderno de Educação Financeira
-- ============================================================================
(
  'financas',
  'O que é um orçamento pessoal e para que serve',
  'Orçamento é a ferramenta de organizar todas as receitas e despesas para planejar a vida financeira.',
  'Um orçamento pessoal (ou familiar) é o registro organizado de tudo o que entra (receitas) e tudo o que sai (despesas) em um período, geralmente um mês. Ele ajuda a conhecer a própria realidade financeira, definir prioridades, entender hábitos de consumo, e administrar imprevistos — sem orçamento, é comum não saber exatamente para onde o dinheiro está indo todo mês.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'Como montar um orçamento em 4 etapas',
  'Planejamento, registro, agrupamento e avaliação são as 4 etapas recomendadas para montar um orçamento.',
  'A forma recomendada de montar um orçamento segue quatro etapas: (1) planejamento — estimar receitas e despesas do período com base no histórico recente; (2) registro — anotar diariamente tudo o que entra e sai, guardando comprovantes e notas; (3) agrupamento — separar as despesas por categoria (alimentação, moradia, transporte, lazer etc.) para enxergar onde o dinheiro está concentrado; (4) avaliação — revisar periodicamente se o orçamento fechou no positivo, no zero ou no negativo, e ajustar o que for preciso.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'Orçamento deficitário, neutro ou superavitário',
  'A meta de todo orçamento é ser superavitário: gastar menos do que se ganha.',
  'Um orçamento pode estar em três situações: deficitário (despesas maiores que as receitas), neutro (despesas iguais às receitas) ou superavitário (despesas menores que as receitas). A meta básica de uma boa gestão financeira pessoal é manter o orçamento superavitário — ou seja, sobrar dinheiro todo mês — porque é esse excedente que permite formar poupança e enfrentar imprevistos sem precisar recorrer a dívida.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'A regra de "pagar-se primeiro"',
  'Separar o dinheiro da poupança assim que a receita entra, antes de pagar qualquer despesa, é mais eficaz do que poupar só o que sobra no fim do mês.',
  'Esperar para poupar só o que sobrar no fim do mês costuma não funcionar, porque o dinheiro vai sendo gasto ao longo do período e sobra pouco ou nada. A recomendação é inverter a ordem: assim que a receita (salário, pró-labore, faturamento) entra, já separar uma parte para a poupança antes de pagar as demais contas — inclusive automatizando essa transferência com o banco, se possível.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'O que é crédito e quando ele compensa',
  'Crédito é dinheiro de terceiros que permite antecipar consumo, mas sempre tem custo: os juros.',
  'Crédito é a possibilidade de usar dinheiro de terceiros (bancos, financeiras, cooperativas) para comprar algo hoje e pagar depois — seja no cheque especial, cartão de crédito, empréstimo ou financiamento. Usar crédito pode ser vantajoso para antecipar um consumo importante, atender uma emergência ou aproveitar uma boa oportunidade, mas tem sempre um custo (os juros) e o risco de comprometer o orçamento futuro se usado sem planejamento.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'Juros simples e juros compostos: qual a diferença',
  'Juros compostos são "juros sobre juros" e crescem de forma muito mais rápida que os juros simples ao longo do tempo.',
  'Juros simples incidem sempre sobre o valor inicial (o capital principal), sem se acumular. Já os juros compostos são recalculados a cada período sobre o saldo já atualizado (capital mais juros anteriores) — por isso são chamados de "juros sobre juros". Na prática comercial e financeira, quase sempre se usam juros compostos, tanto em investimentos quanto em dívidas — o que faz o valor crescer (ou uma dívida aumentar) de forma cada vez mais acelerada ao longo do tempo.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'O poder dos juros compostos ao longo do tempo',
  'Começar a poupar mais cedo, mesmo com valores pequenos, pode render muito mais do que poupar por mais tempo começando depois.',
  'Um exemplo clássico de educação financeira compara duas pessoas: uma que poupa R$ 150 por mês durante 10 anos, começando aos 20 anos, e outra que poupa o mesmo valor só que durante 30 anos, começando aos 30. Graças aos juros compostos, quem começou mais cedo (e parou de depositar antes) termina aos 60 anos com um patrimônio parecido ao de quem depositou por muito mais tempo — mas tendo desembolsado bem menos dinheiro do próprio bolso. A lição prática é que o tempo de exposição ao investimento pesa tanto quanto o valor investido.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'Custo Efetivo Total (CET): por que olhar além da taxa de juros anunciada',
  'O CET mostra o custo real de um empréstimo, somando juros, tarifas e impostos — pode ser bem maior que a taxa de juros anunciada.',
  'O Custo Efetivo Total (CET) representa quanto um empréstimo ou financiamento realmente custa, incluindo não só os juros, mas também tarifas administrativas, impostos (como o IOF) e outros encargos. Duas ofertas com a mesma taxa de juros anunciada podem ter CET bem diferentes dependendo das tarifas cobradas — por isso, antes de contratar crédito, o ideal é comparar o CET entre instituições, e não apenas a taxa de juros divulgada.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'Cuidado com ofertas de "crédito fácil"',
  'Ofertas de crédito pré-aprovado ou aumento automático de limite costumam ter os juros mais altos do mercado.',
  'Propagandas de "crédito pré-aprovado" ou de aumento automático do limite do cartão/cheque especial costumam esconder as taxas de juros mais altas do mercado, e podem levar rapidamente ao superendividamento. A recomendação é desconfiar desse tipo de oferta, procurar sempre instituições financeiras autorizadas a funcionar pelo Banco Central, e comparar o Custo Efetivo Total antes de aceitar qualquer proposta.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'financas',
  'O que é endividamento e quando uma dívida preocupa',
  'Toda compra não paga na hora já é uma dívida — o problema começa quando ela não cabe no orçamento planejado.',
  'De forma ampla, dívida é tudo que já foi consumido mas ainda não foi pago — inclusive a fatura do cartão de crédito ou a conta de luz do mês corrente. Isso, por si só, não é motivo de preocupação quando o pagamento já está previsto no orçamento e há dinheiro reservado para a data de vencimento. O problema surge quando as dívidas somadas ultrapassam a capacidade de pagamento, obrigando a pessoa a tomar mais crédito para pagar crédito anterior — o início do endividamento excessivo.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),

-- ============================================================================
-- INVESTIMENTOS — Banco Central, Caderno de Educação Financeira
-- ============================================================================
(
  'investimentos',
  'Poupança não é a mesma coisa que caderneta de poupança',
  'Poupança é o dinheiro que sobra depois das despesas; caderneta de poupança é só um dos tipos de investimento onde esse dinheiro pode ser aplicado.',
  'Poupança é a diferença entre o que se ganha e o que se gasta — o excedente financeiro que deveria ser direcionado a algum investimento. Já a "caderneta de poupança" (a aplicação bancária tradicional) é apenas uma das formas de investir essa poupança, entre várias outras. Ela é popular no Brasil por ser simples de contratar e por ser protegida pelo Fundo Garantidor de Créditos (FGC), mas não é sinônimo do conceito mais amplo de "poupar".',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'investimentos',
  'Os três componentes de todo investimento: liquidez, risco e rentabilidade',
  'Nenhum investimento real oferece alta liquidez, baixo risco e alta rentabilidade ao mesmo tempo — se prometer isso, desconfie.',
  'Todo investimento pode ser avaliado por três características: liquidez (a rapidez com que pode virar dinheiro disponível), risco (a chance de perder parte ou todo o valor aplicado) e rentabilidade (o retorno esperado). Em geral, investimentos mais seguros rendem menos, e os que prometem retorno mais alto carregam mais risco — as três características raramente andam todas a favor do investidor ao mesmo tempo em um produto legítimo.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'investimentos',
  'Perfil de investidor: conservador, moderado ou arrojado',
  'Conhecer o próprio perfil de risco ajuda a escolher investimentos compatíveis com os objetivos e o momento de vida.',
  'O investidor costuma se enquadrar em um de três perfis: conservador (prioriza segurança, aceita rentabilidade menor para reduzir risco de perda), moderado (busca equilíbrio entre segurança e retorno) ou arrojado (aceita mais risco em busca de rentabilidade maior). Esse perfil não é fixo para sempre — pode mudar conforme a fase da vida e os objetivos financeiros da pessoa, e vale reavaliar periodicamente.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'investimentos',
  'O que verificar antes de investir dinheiro em qualquer aplicação',
  'Antes de investir, confirme se a instituição é autorizada pelo Banco Central ou pela CVM, e leia o regulamento do produto.',
  'Antes de aplicar dinheiro em qualquer investimento, o recomendado é: verificar se a instituição financeira é autorizada a funcionar pelo Banco Central (ou, no caso de ações e fundos, se está registrada na Comissão de Valores Mobiliários — CVM); ler o regulamento e o prospecto do produto; entender os custos envolvidos (taxa de administração, custódia, performance); e desconfiar de promessas de rentabilidade muito acima da média do mercado — rentabilidade passada nunca é garantia de rentabilidade futura.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'investimentos',
  'Renda fixa e renda variável: qual a diferença',
  'Na renda fixa, a regra de remuneração é conhecida desde o início; na renda variável, o retorno é incerto e pode ser negativo.',
  'Investimentos de renda fixa pagam uma remuneração baseada em uma taxa definida no momento da aplicação (prefixada) ou calculada no resgate a partir de um indexador (pós-fixada) — costumam ter risco e rentabilidade esperada menores. Já os investimentos de renda variável, como ações, não têm remuneração definida antecipadamente: o retorno pode ser maior, mas também pode ser negativo, e envolvem mais risco.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'investimentos',
  'O que é o Fundo Garantidor de Créditos (FGC) e o que ele protege',
  'O FGC protege até R$ 250 mil por CPF por instituição em produtos como poupança, CDB e LCI/LCA, caso o banco quebre.',
  'O Fundo Garantidor de Créditos (FGC) e o Fundo Garantidor do Cooperativismo de Crédito (FGCoop) protegem depositantes e investidores caso a instituição financeira onde o dinheiro está aplicado sofra intervenção ou liquidação. Produtos como conta corrente, poupança, CDB, RDB, LCI e LCA estão entre os protegidos, com garantia até o limite de R$ 250 mil por CPF por instituição (valor de referência de 2025). Vale sempre confirmar o limite vigente antes de decidir onde concentrar recursos.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'investimentos',
  'Apostas, bets e criptomoedas não são investimento',
  'Jogos de azar e apostas não são investimento — dependem de sorte, não de uma lógica de retorno financeiro real.',
  'Apostas esportivas (bets), loterias, jogos de cartas, roleta e bingo não são modalidades de investimento — multiplicar dinheiro nesses casos depende de sorte, não de uma lógica financeira previsível, e o risco de perder tudo é real. Moedas virtuais (como Bitcoin e outras criptomoedas) também merecem cuidado redobrado: não são emitidas nem garantidas pelo Banco Central, seu valor depende só da confiança entre quem compra e quem vende, e podem ter volatilidade e risco de perda muito altos.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
),
(
  'investimentos',
  'Diversificar investimentos e reavaliar periodicamente',
  'Não colocar todo o dinheiro em um único investimento, e reavaliar as escolhas de tempos em tempos, reduz risco.',
  'Espalhar as aplicações entre investimentos com características diferentes (por exemplo, parte em renda fixa, parte em renda variável, eventualmente imóveis) ajuda a equilibrar risco e retorno — é a lógica por trás da recomendação popular de "não colocar todos os ovos na mesma cesta". Além disso, como os objetivos pessoais e o cenário econômico mudam com o tempo, vale reavaliar periodicamente se os investimentos escolhidos continuam fazendo sentido para os planos atuais.',
  'Banco Central do Brasil — Caderno de Educação Financeira, versão 2026',
  'https://www.bcb.gov.br/cidadaniafinanceira',
  '2026-07-28'
)

) as v(slug, titulo, resumo, conteudo, fonte, fonte_url, fonte_data)
join public.knowledge_categories k on k.slug = v.slug;
