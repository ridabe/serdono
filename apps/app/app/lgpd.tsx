import { LegalLayout } from "../components/legal/LegalLayout";

export default function Lgpd() {
  return (
    <LegalLayout
      title="LGPD — Seus Direitos"
      updatedAt="28 de julho de 2026"
      intro="A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) garante uma série de direitos sobre os seus dados pessoais. Esta página explica esses direitos e como exercê-los no Ser Dono."
      sections={[
        {
          heading: "1. Controlador dos dados",
          paragraphs: [
            "O Ser Dono é o controlador dos dados pessoais tratados na plataforma — a entidade responsável por decidir como e por que esses dados são usados, conforme descrito na nossa Política de Privacidade.",
          ],
        },
        {
          heading: "2. Seus direitos como titular",
          paragraphs: [
            "Confirmação e acesso: saber se tratamos seus dados e ter acesso a eles.",
            "Correção: pedir a correção de dados incompletos, inexatos ou desatualizados.",
            "Exclusão: pedir a eliminação dos dados tratados com base no seu consentimento — inclusive os dados do diagnóstico.",
            "Portabilidade: solicitar seus dados em formato estruturado, para uso em outro serviço.",
            "Revogação do consentimento: retirar, a qualquer momento, o consentimento dado para o diagnóstico, sem afetar tratamentos já realizados antes da revogação.",
            "Oposição: se opor a um tratamento realizado com base em outra hipótese legal que não o consentimento, quando você entender que há descumprimento da LGPD.",
            "Informação sobre compartilhamento: saber com quais entidades públicas ou privadas o Ser Dono compartilhou seus dados.",
          ],
        },
        {
          heading: "3. Como exercer esses direitos",
          paragraphs: [
            "Envie um e-mail para privacidade@serdono.com.br descrevendo o que você precisa (ex.: \"quero exportar meus dados\" ou \"quero excluir minha conta e meus dados\"). Para sua segurança, podemos pedir uma confirmação de identidade antes de processar o pedido.",
          ],
        },
        {
          heading: "4. Prazo de resposta",
          paragraphs: [
            "Respondemos toda solicitação em até 15 dias corridos, prazo previsto pela LGPD para requisições desse tipo. Pedidos mais complexos podem levar um pouco mais, e você será avisado do novo prazo.",
          ],
        },
        {
          heading: "5. Encarregado de dados (DPO)",
          paragraphs: [
            "Ainda estamos formalizando a indicação do encarregado de proteção de dados (DPO) exigido pela LGPD. Até lá, qualquer contato sobre proteção de dados deve ser feito por privacidade@serdono.com.br, e será tratado com a mesma prioridade.",
          ],
        },
        {
          heading: "6. Autoridade Nacional de Proteção de Dados (ANPD)",
          paragraphs: [
            "Se você entender que seu direito não foi atendido adequadamente, também pode registrar uma reclamação diretamente na ANPD (gov.br/anpd).",
          ],
        },
      ]}
    />
  );
}
