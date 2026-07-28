import type { CapitalFaixa, TempoDisponivel } from "@serdono/core";

export type DiagnosticoField =
  | "capital_disponivel"
  | "meses_de_folego"
  | "apetite_risco"
  | "tempo_disponivel"
  | "formacao"
  | "localizacao"
  | "objetivo";

export interface ChoiceOption {
  label: string;
  value: string | number;
}

export interface SingleChoiceBlock {
  type: "single";
  field: DiagnosticoField;
  overline: string;
  title: string;
  subtitle?: string;
  options: ChoiceOption[];
}

export interface MultiChoiceBlock {
  type: "multi";
  field: DiagnosticoField;
  overline: string;
  title: string;
  subtitle?: string;
  options: ChoiceOption[];
}

export interface LocationBlock {
  type: "location";
  field: "localizacao";
  overline: string;
  title: string;
  subtitle?: string;
}

export type DiagnosticoBlock = SingleChoiceBlock | MultiChoiceBlock | LocationBlock;

// PRD §7.1/§5.2: um bloco por dimensão, nunca mais de uma decisão principal por tela.
// Versão condensada para o MVP (RN-2) — estilo de vida e rede de ativos ficam para
// uma iteração futura do questionário (schema_version cobre essa evolução, RN-4).
export const DIAGNOSTICO_BLOCKS: DiagnosticoBlock[] = [
  {
    type: "single",
    field: "capital_disponivel",
    overline: "BLOCO 1 DE 7 · CAPITAL",
    title: "Quanto você tem guardado para começar?",
    subtitle: "Não precisa ser exato — é só pra entender seu ponto de partida.",
    options: [
      { label: "Até R$ 5 mil", value: "ate_5k" satisfies CapitalFaixa },
      { label: "De R$ 5 mil a R$ 15 mil", value: "5k_15k" satisfies CapitalFaixa },
      { label: "De R$ 15 mil a R$ 40 mil", value: "15k_40k" satisfies CapitalFaixa },
      { label: "Mais de R$ 40 mil", value: "mais_40k" satisfies CapitalFaixa },
    ],
  },
  {
    type: "single",
    field: "meses_de_folego",
    overline: "BLOCO 2 DE 7 · FÔLEGO",
    title: "Por quantos meses você viveria sem tirar dinheiro do negócio?",
    subtitle: "Pensando nas suas outras fontes de renda ou reservas.",
    options: [
      { label: "Menos de 3 meses", value: 2 },
      { label: "De 3 a 6 meses", value: 4 },
      { label: "De 6 a 12 meses", value: 9 },
      { label: "Mais de 12 meses", value: 15 },
    ],
  },
  {
    type: "single",
    field: "apetite_risco",
    overline: "BLOCO 3 DE 7 · PERFIL",
    title: "Como você lida com incerteza?",
    subtitle: "Não existe resposta certa — é só pra calibrar o tipo de negócio.",
    options: [
      { label: "Prefiro o caminho mais seguro possível", value: 1 },
      { label: "Aceito algum risco, com cautela", value: 2 },
      { label: "Risco moderado, se o retorno valer a pena", value: 3 },
      { label: "Topo arriscar bastante por um retorno maior", value: 4 },
      { label: "Gosto de apostar alto", value: 5 },
    ],
  },
  {
    type: "single",
    field: "tempo_disponivel",
    overline: "BLOCO 4 DE 7 · TEMPO",
    title: "Quanto tempo você vai dedicar ao negócio?",
    options: [
      { label: "Dedicação integral", value: "integral" satisfies TempoDisponivel },
      { label: "Meio período", value: "parcial" satisfies TempoDisponivel },
      { label: "Nas horas livres, ainda empregado", value: "paralelo_emprego" satisfies TempoDisponivel },
    ],
  },
  {
    type: "multi",
    field: "formacao",
    overline: "BLOCO 5 DE 7 · EXPERIÊNCIA",
    title: "Em quais dessas áreas você já tem experiência ou formação?",
    subtitle: "Pode marcar mais de uma — ou nenhuma, se estiver começando do zero.",
    options: [
      { label: "Serviços", value: "serviços" },
      { label: "Alimentação", value: "alimentação" },
      { label: "Beleza", value: "beleza" },
      { label: "Varejo", value: "varejo" },
      { label: "Tecnologia / digital", value: "tecnologia" },
    ],
  },
  {
    type: "location",
    field: "localizacao",
    overline: "BLOCO 6 DE 7 · LOCALIZAÇÃO",
    title: "Em que cidade você pretende empreender?",
    subtitle: "Isso ajuda a entender demanda e concorrência da sua região.",
  },
  {
    type: "single",
    field: "objetivo",
    overline: "BLOCO 7 DE 7 · OBJETIVO",
    title: "O que esse negócio representa pra você?",
    options: [
      { label: "Uma renda extra, sem trocar de emprego", value: "renda_extra" },
      { label: "Substituir o salário do meu emprego atual", value: "substituir_salario" },
      { label: "Construir algo grande, que eu possa escalar", value: "escalar" },
    ],
  },
];
