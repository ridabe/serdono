// Ser Dono — dados da landing pública do e-book "Abrir um negócio do zero"
// (SDD-139). A isca em si (PDF + capas) vive no bucket público `lead-magnets`
// (SDD-138) e é servida por URL direta, sem login.

const STORAGE_BASE =
  "https://klvmbytlqnvydjsauigy.supabase.co/storage/v1/object/public/lead-magnets/ebook-abrir-negocio";

export const EBOOK = {
  slug: "ebook-abrir-negocio",
  titulo: "Abrir um negócio do zero",
  subtitulo:
    "O guia direto ao ponto pra quem quer começar de casa, com pouco, e profissionalizar depois.",
  paginas: 8,
  pdfUrl: `${STORAGE_BASE}/ebook-abrir-um-negocio.pdf`,
  capaVerticalUrl: `${STORAGE_BASE}/capa-vertical.png`,
  capaSocialUrl: `${STORAGE_BASE}/capa-social.png`,
} as const;

export interface EbookPergunta {
  /** Campo enviado em `respostas` pra Edge Function `lead-capturar`. */
  campo: "momento" | "vontade" | "temIdeia" | "capitalGiro" | "prazo";
  overline: string;
  titulo: string;
  opcoes: string[];
}

// 5 perguntas, uma escolha por pergunta — qualificam o lead pro follow-up
// (entender o momento, a vontade, se já tem ideia e capital de giro).
export const EBOOK_PERGUNTAS: EbookPergunta[] = [
  {
    campo: "momento",
    overline: "PERGUNTA 1 DE 5",
    titulo: "Qual é o seu momento hoje?",
    opcoes: [
      "Penso em empreender, mas ainda não comecei",
      "Já estou me organizando pra começar",
      "Já vendo algo por fora e quero profissionalizar",
      "Ainda é só uma curiosidade",
    ],
  },
  {
    campo: "vontade",
    overline: "PERGUNTA 2 DE 5",
    titulo: "Do tamanho de quê é a sua vontade de ter o próprio negócio?",
    opcoes: [
      "É um sonho antigo, quero muito",
      "Tenho vontade, com o pé no chão",
      "Ainda estou avaliando se é pra mim",
      "Baixa por enquanto, só pesquisando",
    ],
  },
  {
    campo: "temIdeia",
    overline: "PERGUNTA 3 DE 5",
    titulo: "Você já tem uma ideia de negócio?",
    opcoes: [
      "Tenho uma ideia definida",
      "Tenho algumas ideias, ainda decidindo",
      "Não tenho ideia ainda, quero descobrir",
    ],
  },
  {
    campo: "capitalGiro",
    overline: "PERGUNTA 4 DE 5",
    titulo: "Quanto você tem pra colocar no começo (capital de giro)?",
    opcoes: [
      "Ainda não tenho nada guardado",
      "Até R$ 1.000",
      "De R$ 1.000 a R$ 5.000",
      "Mais de R$ 5.000",
    ],
  },
  {
    campo: "prazo",
    overline: "PERGUNTA 5 DE 5",
    titulo: "Pra quando é esse plano?",
    opcoes: [
      "Pra ontem — quero começar já",
      "Nos próximos 3 meses",
      "Ainda este ano",
      "Sem data certa, quando der",
    ],
  },
];
