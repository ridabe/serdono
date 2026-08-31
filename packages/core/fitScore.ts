/**
 * Motor de Fit Score — PRD §5.3, Documento de Conceito §5.2.
 *
 * O Fit Score é uma nota CALCULADA (0-100), nunca gerada por IA — a IA só
 * explica o resultado em linguagem natural depois, e (SDD-66/SDD-135) amplia
 * o sinal de entrada traduzindo o texto livre do diagnóstico em áreas e
 * nichos. Função pura e testável sem rede, para poder rodar tanto no cliente
 * quanto na Edge Function (SPEC §3, SDD-3).
 *
 * Pesos e proxies aqui são revisáveis conforme dado real de uso. Revisão
 * grande em SDD-135 (o motor sugeria nichos fora do contexto declarado): a
 * afinidade passou a ser o eixo dominante, o capital deixou de derrubar um
 * nicho que dá pra começar enxuto, e o "começar de casa" virou parte do
 * cálculo — o público é micro e pequeno empreendedor, não franqueado.
 */

export type CapitalFaixa = "ate_5k" | "5k_15k" | "15k_40k" | "mais_40k";
export type TempoDisponivel = "integral" | "parcial" | "paralelo_emprego";

export interface DiagnosticoParaScore {
  capital_disponivel: CapitalFaixa | null;
  meses_de_folego: number | null;
  apetite_risco: number | null; // 1-5
  tempo_disponivel: TempoDisponivel | null;
  formacao: string[];
  experiencia: string[];
  /**
   * Áreas que a IA extraiu do texto livre do diagnóstico (SDD-66, RN-37).
   * Entram no cálculo de interesse com o MESMO peso das áreas marcadas no
   * checkbox — a IA amplia o sinal de perfil, nunca decide ou recalcula a
   * nota. Quem chama a IA é a Edge Function; esta função continua pura.
   */
  areas_inferidas?: string[];
  /**
   * Slugs de nicho que a IA apontou como relevantes pro perfil (SDD-135/136):
   * a partir da SDD-136, a IA ranqueia o catálogo inteiro contra o perfil
   * completo (checkboxes + texto livre) e devolve os mais aderentes em ordem —
   * "gosto de cortar cabelo" → `barbearia`/`cabeleireiro-a-domicilio`,
   * "python, sistemas" → `desenvolvimento-de-software`. Filtrado contra o
   * catálogo real (RN-38). Estes nichos entram com afinidade máxima; a nota
   * (financeiro, tempo, risco) segue calculada, e a ORDEM final é a da IA.
   */
  nichos_inferidos?: string[];
}

export interface NichoParaScore {
  /** Identificador do nicho no catálogo — usado para casar com `nichos_inferidos`. */
  slug?: string;
  categoria: string;
  /**
   * Áreas do diagnóstico que este nicho atende (SDD-66). Um nicho pode
   * pertencer a mais de uma ("Agência de marketing digital" é tecnologia E
   * serviços), coisa que a `categoria` única não conseguia expressar — e que
   * fazia nicho digital ficar escondido sob 'serviços'. Vazio = usa `categoria`.
   */
  areas_afinidade?: string[];
  investimento_min: number;
  investimento_max: number;
  tempo_ate_equilibrio_meses: number | null;
  complexidade_regulatoria: number; // 1-5
  intensidade_mao_de_obra: number; // 1-5
  nivel_concorrencia: number; // 1-5
  /**
   * `true` se a operação madura depende de ponto comercial (loja, salão,
   * cozinha industrial). Usado também fora do Fit Score (relevância da fase
   * Estrutura da Jornada) — não mexer no significado.
   */
  dependencia_ponto_fisico?: boolean;
  /**
   * `true` quando dá pra COMEÇAR de casa / atendendo na casa do cliente, mesmo
   * que a versão madura queira um ponto (SDD-135). Um barbeiro monta a
   * primeira cadeira em casa; uma barbearia de rua é o passo seguinte. Junto
   * com `dependencia_ponto_fisico === false`, libera o piso de entrada enxuto.
   */
  permite_inicio_em_casa?: boolean;
}

export interface FitScoreResult {
  fit_score: number;
  score_perfil: number;
  score_financeiro: number;
  score_contexto: number;
  score_tempo: number;
  /**
   * O capital do usuário não cobre nem o começo enxuto deste nicho. A tela de
   * resultado usa isso pra mostrar "dá pra mirar, só planeje um pouco mais de
   * caixa" em vez de esconder a sugestão lá no fim da lista (SDD-135).
   */
  precisa_de_mais_capital: boolean;
  /**
   * O texto livre do diagnóstico apontou este nicho pelo nome. A Edge Function
   * usa isso pra garantir que um nicho que a pessoa pediu explicitamente não
   * fique fora dos 3 melhores por causa de um componente secundário
   * (concorrência, tempo) — o pedido explícito vem primeiro (SDD-135).
   */
  afinidade_direta: boolean;
}

// Pesos dos 4 componentes. Afinidade (dentro de `perfil`) é o eixo dominante:
// o primeiro contato tem que refletir o que a pessoa DISSE que quer fazer.
// Capital ainda pesa, mas não manda sozinho no resultado (era 0.35 e
// empurrava todo perfil pra nicho barato). `contexto` é quase placeholder
// até existir inteligência regional real — peso baixo de propósito.
const WEIGHTS = { perfil: 0.4, financeiro: 0.3, contexto: 0.08, tempo: 0.22 } as const;

const CAPITAL_RANGES: Record<CapitalFaixa, { min: number; max: number }> = {
  ate_5k: { min: 0, max: 5_000 },
  "5k_15k": { min: 5_000, max: 15_000 },
  "15k_40k": { min: 15_000, max: 40_000 },
  mais_40k: { min: 40_000, max: Number.POSITIVE_INFINITY },
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function normalizar(lista: string[]): string[] {
  return lista.map((t) => t.toLowerCase().trim()).filter(Boolean);
}

/** Piso do score de capital para quem consegue começar, mas sem folga nenhuma. */
const CAPITAL_SO_DA_PRA_COMECAR = 70;

/**
 * Fração do investimento mínimo de mercado que um negócio SEM dependência de
 * ponto físico realmente exige pra começar. As faixas do catálogo assumem
 * ponto alugado, reforma leve e fachada; um barbeiro atendendo em casa
 * precisa de cadeira, espelho, máquina e esterilizador — não do piso cheio.
 * SDD-135: sem isso, "Barbearia" (piso R$ 8 mil) sumia pra quem marcou "até
 * R$ 5 mil" e escreveu explicitamente que quer cortar cabelo.
 */
const FATOR_INICIO_ENXUTO = 0.4;

function podeComecarEmCasa(n: NichoParaScore): boolean {
  return n.dependencia_ponto_fisico === false || n.permite_inicio_em_casa === true;
}

function pisoDeEntrada(n: NichoParaScore): number {
  return podeComecarEmCasa(n) ? n.investimento_min * FATOR_INICIO_ENXUTO : n.investimento_min;
}

/**
 * Quanto o capital do usuário dá conta de começar este negócio.
 *
 * A pergunta é "você consegue começar?", nunca "suas faixas coincidem?". Ter
 * capital de sobra nunca é desencaixe (regressão da versão que media
 * sobreposição de faixas). E um negócio que dá pra tocar de casa é medido
 * pelo piso enxuto, não pelo piso de vitrine.
 */
function scoreCapital(capitalMax: number, n: NichoParaScore): number {
  const piso = pisoDeEntrada(n);

  // Banca até o teto do nicho — cabe no bolso com folga.
  if (capitalMax >= n.investimento_max) return 100;

  // Banca pelo menos o começo enxuto: dá pra começar. Quanto mais da faixa o
  // dinheiro cobre, mais confortável — mas começar já vale a maior parte da nota.
  if (capitalMax >= piso) {
    const faixa = n.investimento_max - piso || 1;
    const cobertura = (capitalMax - piso) / faixa;
    return clamp(CAPITAL_SO_DA_PRA_COMECAR + cobertura * (100 - CAPITAL_SO_DA_PRA_COMECAR));
  }

  // Não alcança nem o começo enxuto — aí sim é desencaixe real, proporcional
  // ao quanto falta. A tela ainda mostra a sugestão (precisa_de_mais_capital),
  // só não no topo.
  return clamp((capitalMax / piso) * CAPITAL_SO_DA_PRA_COMECAR);
}

function scoreFinanceiro(d: DiagnosticoParaScore, n: NichoParaScore): number {
  if (!d.capital_disponivel) return 0;
  const capital = CAPITAL_RANGES[d.capital_disponivel];
  const capitalScore = scoreCapital(capital.max, n);

  if (d.meses_de_folego == null || !n.tempo_ate_equilibrio_meses) {
    return capitalScore;
  }
  const folegoScore = clamp((d.meses_de_folego / n.tempo_ate_equilibrio_meses) * 100);
  return clamp(capitalScore * 0.7 + folegoScore * 0.3);
}

/** Nenhum dado de área/nicho de interesse informado — nem penaliza nem favorece. */
const AREA_SEM_DADO = 50;
/** O texto livre apontou ESTE nicho pelo nome (ou a IA o ranqueou como relevante) — o sinal mais forte que existe. */
const NICHO_MATCH_DIRETO = 100;
/** Área específica (beleza, alimentação, tecnologia…) do usuário bate com uma área do nicho. */
const AREA_COM_MATCH = 88;
/** O único ponto em comum é uma área genérica ("serviços"/"varejo"), que quase todo nicho carrega — quase não diz nada. */
const AREA_MATCH_GENERICO = 45;
/** Usuário informou interesse, mas nenhum bate com este nicho. */
const AREA_SEM_MATCH = 15;

/**
 * "serviços" e "varejo" são rótulos de categoria, não afinidade — quase todo
 * nicho tem um dos dois. Casar só por eles (um dev "de serviços" batendo com
 * barbearia "de serviços") era a maior fonte de falso positivo do motor.
 */
const AREAS_GENERICAS = new Set(["serviços", "varejo"]);

/**
 * Aderência entre o que o usuário demonstrou querer — áreas marcadas no bloco
 * "Experiência", áreas que a IA inferiu do texto livre (SDD-66) e agora
 * nichos que a IA inferiu do texto livre (SDD-135) — e o que o nicho é.
 *
 * Ordem de força: nicho citado no texto > área citada/marcada > área que não
 * bate. Antes, isto era um bônus de +15 diluído a ponto de o empreendedor que
 * só marcou "Tecnologia" ver comércio de bairro no topo; virou o próprio eixo.
 */
function scoreInteresse(d: DiagnosticoParaScore, n: NichoParaScore): number {
  const slug = n.slug?.toLowerCase().trim();
  if (slug && normalizar(d.nichos_inferidos ?? []).includes(slug)) {
    return NICHO_MATCH_DIRETO;
  }

  const tags = normalizar([...d.formacao, ...d.experiencia, ...(d.areas_inferidas ?? [])]);
  if (tags.length === 0) return AREA_SEM_DADO;

  // `areas_afinidade` é a fonte de verdade quando existe; `categoria` fica
  // como fallback pra nicho que ainda não foi mapeado (nenhum fica pior que antes).
  const areasDoNicho = normalizar(n.areas_afinidade?.length ? n.areas_afinidade : [n.categoria]);

  const casa = (t: string, a: string) => t === a || t.includes(a) || a.includes(t);
  const matchEspecifico = tags.some((t) =>
    areasDoNicho.some((a) => !AREAS_GENERICAS.has(a) && casa(t, a))
  );
  if (matchEspecifico) return AREA_COM_MATCH;

  const matchGenerico = tags.some((t) => areasDoNicho.some((a) => casa(t, a)));
  return matchGenerico ? AREA_MATCH_GENERICO : AREA_SEM_MATCH;
}

function scorePerfil(d: DiagnosticoParaScore, n: NichoParaScore): number {
  // Proxy de "risco" do nicho: média entre complexidade regulatória e nível de concorrência.
  const riscoNicho = (n.complexidade_regulatoria + n.nivel_concorrencia) / 2;
  const riscoFit = d.apetite_risco ? clamp(100 - Math.abs(d.apetite_risco - riscoNicho) * 25) : 50;

  // 70/30 a favor do interesse: o ajuste de risco calibra, o interesse decide.
  return clamp(riscoFit * 0.3 + scoreInteresse(d, n) * 0.7);
}

function scoreContexto(d: DiagnosticoParaScore, n: NichoParaScore): number {
  // Proxy de saturação enquanto não existe inteligência regional real
  // (Documento §7.1) — nível de concorrência do nicho.
  const concorrencia = clamp((6 - n.nivel_concorrencia) * 20);

  // Viés de micro/pequeno negócio (SDD-135): quem tem pouco capital ou não vai
  // se dedicar em tempo integral se dá melhor num negócio que não depende de
  // ponto físico. Nudge pequeno (peso 0.08 no fit), não um filtro.
  const perfilEnxuto = d.capital_disponivel === "ate_5k" || (!!d.tempo_disponivel && d.tempo_disponivel !== "integral");
  const semPontoFisico = perfilEnxuto && podeComecarEmCasa(n) ? 100 : 50;

  return clamp(concorrencia * 0.5 + semPontoFisico * 0.5);
}

function scoreTempo(d: DiagnosticoParaScore, n: NichoParaScore): number {
  if (!d.tempo_disponivel) return 50;
  const disponibilidade: Record<TempoDisponivel, number> = {
    integral: 3,
    parcial: 2,
    paralelo_emprego: 1,
  };
  const exigido = n.intensidade_mao_de_obra >= 4 ? 3 : n.intensidade_mao_de_obra >= 2 ? 2 : 1;
  const gap = disponibilidade[d.tempo_disponivel] - exigido;

  if (gap >= 0) return 100;
  if (gap === -1) return 60;
  return 20;
}

export function calculateFitScore(diagnostico: DiagnosticoParaScore, nicho: NichoParaScore): FitScoreResult {
  const score_perfil = scorePerfil(diagnostico, nicho);
  const score_financeiro = scoreFinanceiro(diagnostico, nicho);
  const score_contexto = scoreContexto(diagnostico, nicho);
  const score_tempo = scoreTempo(diagnostico, nicho);

  const fit_score = clamp(
    score_perfil * WEIGHTS.perfil +
      score_financeiro * WEIGHTS.financeiro +
      score_contexto * WEIGHTS.contexto +
      score_tempo * WEIGHTS.tempo
  );

  const capital = diagnostico.capital_disponivel ? CAPITAL_RANGES[diagnostico.capital_disponivel] : null;
  const precisa_de_mais_capital = capital ? capital.max < pisoDeEntrada(nicho) : false;

  const slug = nicho.slug?.toLowerCase().trim();
  const afinidade_direta = !!slug && normalizar(diagnostico.nichos_inferidos ?? []).includes(slug);

  return {
    fit_score: Math.round(fit_score),
    score_perfil: Math.round(score_perfil),
    score_financeiro: Math.round(score_financeiro),
    score_contexto: Math.round(score_contexto),
    score_tempo: Math.round(score_tempo),
    precisa_de_mais_capital,
    afinidade_direta,
  };
}
