import { LegalLayout } from "../components/legal/LegalLayout";

export default function Termos() {
  return (
    <LegalLayout
      title="Termos de Uso"
      updatedAt="28 de julho de 2026"
      intro="Estes Termos de Uso regulam o acesso e uso da plataforma Ser Dono (serdono.com.br). Ao usar o diagnóstico ou criar uma conta, você concorda com o que está descrito aqui."
      sections={[
        {
          heading: "1. O que é o Ser Dono",
          paragraphs: [
            "O Ser Dono é uma plataforma que ajuda quem quer empreender a descobrir qual negócio combina com o seu perfil, capital e cidade, e depois acompanha a construção desse negócio passo a passo, com apoio de um copiloto de inteligência artificial.",
            "Hoje a plataforma oferece o diagnóstico gratuito e a prévia de nichos recomendados. Módulos pagos (workflow guiado, dossiê completo por nicho, copiloto especializado) estão em desenvolvimento e serão anunciados antes de qualquer cobrança.",
          ],
        },
        {
          heading: "2. Cadastro e conta",
          paragraphs: [
            "Você pode responder ao diagnóstico antes de criar uma conta — nesse momento, usamos uma sessão anônima apenas para salvar seu progresso. Ao criar sua conta (nome, e-mail e senha), essa sessão anônima vira uma conta permanente e o resultado do seu diagnóstico continua associado a ela.",
            "Você é responsável por manter sua senha em sigilo e por todas as atividades realizadas na sua conta. Avise imediatamente se suspeitar de uso não autorizado.",
          ],
        },
        {
          heading: "3. O que você recebe gratuitamente",
          paragraphs: [
            "O diagnóstico completo, o Perfil Empreendedor e a prévia com os três nichos de maior aderência (nome, nota calculada, uma justificativa e a faixa de investimento) são gratuitos, sem necessidade de cartão de crédito.",
            "O conteúdo completo de cada nicho (dossiê de mercado, passo a passo de abertura, copiloto de IA) faz parte de planos pagos que ainda serão lançados — você será avisado antes de qualquer cobrança ser feita.",
          ],
        },
        {
          heading: "4. Sobre as recomendações da plataforma",
          paragraphs: [
            "A nota de aderência (Fit Score) de cada nicho é calculada por uma fórmula a partir das suas respostas — nunca é decidida pela inteligência artificial. A IA é usada apenas para explicar o resultado em linguagem simples, sempre citando a fonte e a data de qualquer dado de mercado usado.",
            "Recomendações sobre temas jurídicos, tributários ou sanitários vêm sempre acompanhadas do aviso de que não substituem a orientação de um profissional habilitado (contador, advogado ou órgão responsável). O Ser Dono não se responsabiliza por decisões de negócio tomadas exclusivamente com base no conteúdo da plataforma.",
          ],
        },
        {
          heading: "5. Uso aceitável",
          paragraphs: [
            "Você concorda em não usar a plataforma para fins ilegais, em não tentar acessar dados de outros usuários, e em não copiar, redistribuir ou explorar comercialmente o conteúdo curado dos nichos (playbooks) sem autorização.",
          ],
        },
        {
          heading: "6. Alterações nestes termos",
          paragraphs: [
            "Podemos atualizar estes Termos conforme o produto evolui. Mudanças relevantes serão comunicadas por e-mail ou aviso dentro da plataforma antes de entrarem em vigor.",
          ],
        },
        {
          heading: "7. Lei aplicável",
          paragraphs: [
            "Estes Termos são regidos pelas leis do Brasil. Qualquer disputa relacionada a eles será resolvida no foro do domicílio do usuário, conforme a legislação de defesa do consumidor.",
          ],
        },
        {
          heading: "8. Contato",
          paragraphs: ["Dúvidas sobre estes Termos: contato@serdono.com.br"],
        },
      ]}
    />
  );
}
