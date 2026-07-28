import { LegalLayout } from "../components/legal/LegalLayout";

export default function Privacidade() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      updatedAt="28 de julho de 2026"
      intro="Esta política explica quais dados o Ser Dono coleta, por quê, e como você pode controlar isso — em linha com a Lei Geral de Proteção de Dados (LGPD). Para saber especificamente quais são os seus direitos como titular dos dados, veja a página LGPD."
      sections={[
        {
          heading: "1. Quais dados coletamos",
          paragraphs: [
            "Dados de cadastro: nome, e-mail e senha (a senha nunca é armazenada em texto puro).",
            "Dados do diagnóstico: faixa de capital disponível, fôlego financeiro, apetite a risco, tempo disponível, área de experiência, cidade e estado, e o objetivo com o negócio.",
            "Dados de uso: eventos como diagnóstico iniciado/concluído, nicho visualizado, e etapas do produto que você usa — para entender o que funciona e corrigir o que não funciona.",
          ],
        },
        {
          heading: "2. Base legal para o tratamento (LGPD)",
          paragraphs: [
            "Tratamos seus dados do diagnóstico com base no seu consentimento, dado explicitamente antes de você responder o questionário. Dados de cadastro e de uso são tratados com base na execução do contrato entre você e o Ser Dono (os Termos de Uso) e no nosso legítimo interesse em melhorar o produto.",
          ],
        },
        {
          heading: "3. Para que usamos seus dados",
          paragraphs: [
            "Calcular o seu Fit Score com cada nicho — esse cálculo é feito por fórmula, não pela inteligência artificial.",
            "Gerar, através de um modelo de IA (Anthropic Claude), a explicação em linguagem natural de por que um nicho combina com o seu perfil — usando só os dados que você forneceu e o conteúdo curado da plataforma, nunca compartilhando seus dados pessoais de identificação (nome, e-mail) com o provedor de IA.",
            "Salvar seu progresso no diagnóstico para você continuar de onde parou.",
          ],
        },
        {
          heading: "4. Com quem compartilhamos dados",
          paragraphs: [
            "Supabase (infraestrutura de banco de dados e autenticação) — atua como operador dos seus dados, armazenando-os de forma segura.",
            "Anthropic (provedor do modelo de IA Claude) — recebe apenas os dados estruturados necessários para gerar a explicação do nicho (faixa de capital, apetite a risco, dados do nicho), nunca seu nome, e-mail ou outro identificador pessoal direto.",
            "Não vendemos seus dados a terceiros para fins de marketing.",
          ],
        },
        {
          heading: "5. Segurança e retenção",
          paragraphs: [
            "Seus dados ficam protegidos por controle de acesso por linha (Row Level Security) — mesmo tecnicamente, ninguém além de você acessa suas respostas, exceto o time do Ser Dono em caso de suporte, com seu conhecimento.",
            "Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir sua conta, seus dados pessoais são removidos, exceto o que a lei exigir manter (ex.: registros fiscais de cobrança, quando aplicável).",
          ],
        },
        {
          heading: "6. Sessão anônima antes do cadastro",
          paragraphs: [
            "Se você responde ao diagnóstico antes de criar conta, usamos uma sessão anônima apenas para associar suas respostas a você. Se você fechar o navegador sem criar conta, essa sessão eventualmente expira e os dados deixam de ser acessíveis a você — recomendamos criar a conta para não perder o resultado.",
          ],
        },
        {
          heading: "7. Contato",
          paragraphs: ["Dúvidas sobre privacidade ou solicitações sobre seus dados: privacidade@serdono.com.br"],
        },
      ]}
    />
  );
}
