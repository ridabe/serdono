/**
 * Fonte única de valores visuais do produto Ser Dono.
 * Todo componente consome estes tokens — nunca um hex, px ou fontFamily solto.
 * Ver docs/identidade-visual/DESIGN_SYSTEM.md (§2, §3, §4, §5, §6, §7, §8, §11) — DS-0, DS-7.
 */

// ---- §2.1 Paleta primitiva (uso interno deste arquivo — não referenciar direto em componentes) ----
const primitive = {
  brand900: "#0E3A4F",
  brand700: "#17546E",
  brand100: "#BFD4DC",
  brand50: "#F7F9FC",
  gold500: "#F2B03D",
  gold600: "#D89620",
  gold100: "#FCE9C2",
  ink900: "#111827",
  ink600: "#374151",
  ink400: "#6B7280",
  ink200: "#D1D5DB",
  ink50: "#F3F4F6",
  white: "#FFFFFF",
  success600: "#1E8E5A",
  success100: "#DCF3E7",
  warning600: "#B5760E",
  warning100: "#FBEBD2",
  danger600: "#C23B2E",
  danger100: "#F9DEDB",
  info600: "#2464B0",
  info100: "#DCE8F7",
  // DS-23 (08/08/2026) — só estas 2 são hex genuinamente novos da paleta de
  // ícone de módulo/fase (§9.14); os outros 4 slots do ciclo reaproveitam
  // tons semânticos já existentes. `violet600` é o mesmo hex já usado (e
  // validado, DS-21) em `chart.categorical.cenario` — reaproveitado aqui como
  // primitivo de uso geral, sem alterar a paleta categórica do gráfico.
  violet600: "#8B4FD6",
  orange600: "#D9631E",
} as const;

// ---- §2.2 Tokens semânticos ----
export const color = {
  bg: {
    canvas: primitive.brand50,
    surface: primitive.white,
    surfaceAlt: primitive.ink50,
    brand: primitive.brand900,
    brandHover: primitive.brand700,
    brandSubtle: primitive.brand100,
  },
  action: {
    primary: primitive.gold500,
    primaryHover: primitive.gold600,
    primarySubtle: primitive.gold100,
    secondary: primitive.brand900,
  },
  text: {
    primary: primitive.ink900,
    secondary: primitive.ink600,
    muted: primitive.ink400,
    onBrand: primitive.white,
    onAction: primitive.brand900, // nunca branco sobre gold.500 — DS §2.3
  },
  border: { default: primitive.ink200, focus: primitive.brand700 },
  state: {
    success: primitive.success600,
    successBg: primitive.success100,
    warning: primitive.warning600,
    warningBg: primitive.warning100,
    danger: primitive.danger600,
    dangerBg: primitive.danger100,
    info: primitive.info600,
    infoBg: primitive.info100,
  },
} as const;

// ---- §9.14 Paleta de ícone de módulo/fase (DS-23, registrada em 08/08/2026) ----
// Ciclo de 6 cores pra dar identidade visual própria a cada card de
// módulo/fase (grade colorida no Início, pedido do dono do produto em
// 08/08/2026) — mais rico que reaproveitar só o ciclo de acento da sanfona
// (§9.10/DS-18), que já é usado com outro propósito (faixa lateral de card
// colapsável) na mesma tela em alguns fluxos.
export type ModuleAccent = "teal" | "gold" | "blue" | "green" | "purple" | "orange";
export const MODULE_ACCENT_CYCLE: ModuleAccent[] = ["teal", "gold", "blue", "green", "purple", "orange"];
/** `fg` sempre valida contraste AA contra `bg` (DS-2/§2.3) — ver §9.14 pros números. */
export const moduleAccent: Record<ModuleAccent, { bg: string; fg: string }> = {
  teal: { bg: color.bg.brand, fg: color.text.onBrand },
  gold: { bg: color.action.primaryHover, fg: color.text.onAction },
  blue: { bg: color.state.info, fg: color.text.onBrand },
  green: { bg: color.state.success, fg: color.text.onBrand },
  purple: { bg: primitive.violet600, fg: color.text.onBrand },
  orange: { bg: primitive.orange600, fg: color.text.onBrand },
} as const;

// ---- §4 Espaçamento (grid de 4px) ----
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ---- §5 Raio de borda e elevação ----
export const radius = { sm: 6, md: 10, lg: 14, full: 999 } as const;

// DS-6: sombra não é CSS em React Native — shadow* (iOS) + elevation (Android).
export const elevation = {
  0: { ios: {}, android: { elevation: 0 }, borderColor: color.border.default },
  1: {
    ios: { shadowColor: "#111827", shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
    android: { elevation: 2 },
  },
  2: {
    ios: { shadowColor: "#111827", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 6 },
  },
  3: {
    ios: { shadowColor: "#111827", shadowOpacity: 0.16, shadowRadius: 32, shadowOffset: { width: 0, height: 12 } },
    android: { elevation: 12 },
  },
} as const;

// ---- §3.2 Tipografia — família + peso + tamanho + line-height como objeto único (DS-5) ----
export const type = {
  display: { fontFamily: "Sora_700Bold", fontSize: 32, lineHeight: 40 },
  h1: { fontFamily: "Sora_700Bold", fontSize: 24, lineHeight: 32 },
  h2: { fontFamily: "Sora_600SemiBold", fontSize: 20, lineHeight: 28 },
  h3: { fontFamily: "Inter_600SemiBold", fontSize: 17, lineHeight: 24 },
  bodyLg: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24 },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: "Inter_700Bold", fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  button: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 20 },
  mono: { fontFamily: "ui-monospace", fontSize: 13, lineHeight: 18 },
} as const;

// ---- §6 Grid e breakpoints ----
export const breakpoint = { compact: 0, medium: 768, expanded: 1080 } as const;
export const content = { maxWidth: 640, maxWidthWide: 1024 } as const;
export const layout = { gutterCompact: space[4], gutterMedium: space[6] } as const;

// ---- §7 Iconografia ----
export const icon = { sm: 16, md: 20, lg: 24, xl: 32, strokeWidth: 1.75 } as const;

// ---- §12 Cores de dado — gráficos (DS-19, registradas em 31/07/2026) ----
// Rampa ORDINAL de uma matiz só (o teal da marca), não uma paleta
// categórica: os gráficos do produto comparam magnitude e progresso, não
// identidade de séries. Escolha deliberada — paleta categórica é o que gera
// problema de daltonismo, e aqui não há série pra distinguir por cor.
//
// Validada com o script do método de dataviz contra a superfície real
// (`bg.surface`, #FFFFFF): monotonia de luminosidade, degrau mínimo entre
// passos, ponta clara acima de 2:1 de contraste e matiz única (spread 9°) —
// todos PASS. Não trocar um passo isolado sem revalidar o conjunto.
export const chart = {
  ramp: ["#7FA9BC", "#5E93A8", "#3C7791", "#1E5B76", "#0E3A4F"],
  /** Passo padrão para série única (linha/área/barra sem gradação). */
  series: "#1E5B76",
  /** Preenchimento da área sob a linha — mesma matiz, transparência baixa. */
  seriesFill: "rgba(30,91,118,0.16)",
  /** Ênfase: marca o ponto/estado que é o assunto do gráfico. Sempre com rótulo junto — sozinho não passa 3:1 (DS-2). */
  accent: primitive.gold500,
  /** Trilho de medidor e de barra de progresso. */
  track: primitive.ink200,
  grid: primitive.ink200,
  axis: primitive.ink400,
  /**
   * §12.1 Paleta CATEGÓRICA (DS-21, registrada em 03/08/2026) — para o único
   * caso do produto em que séries têm **identidade**, não magnitude: o
   * comparador de aplicações do módulo de Investimentos (CDB × Tesouro Selic ×
   * Poupança × cenário do usuário). A rampa ordinal acima continua sendo o
   * padrão de todo o resto; isto é a exceção, não uma segunda opção de estilo.
   *
   * Validada pelo script do método de dataviz contra a superfície do produto:
   * faixa de luminosidade, piso de croma, separação sob daltonismo
   * (pior par ΔE 9,4 protan), piso de visão normal (ΔE 19,8) e contraste
   * ≥ 3:1 — todos PASS. **Ordem fixa: nunca cicle, nunca recolora uma série
   * porque outra saiu do gráfico.** Trocar um valor isolado exige revalidar o
   * conjunto inteiro (mesma regra da rampa).
   */
  categorical: {
    cdb: "#2E6FD4",
    selic: "#12876A",
    poupanca: "#C77A0A",
    cenario: "#8B4FD6",
  },
} as const;

// ---- §10 Acessibilidade ----
export const a11y = { minTouchTarget: 44 } as const;

// ---- §11 Motion ----
export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  /** Deslocamento vertical da animação de entrada (`Reveal`) — DS-16. */
  revealDistance: 16,
  /** Atraso entre itens de uma mesma lista revelada em sequência — DS-16. */
  revealStagger: 70,
  /** Quanto um card sobe no hover (web) — DS-16. */
  hoverLift: 4,
  /** Escala aplicada no press de um elemento interativo — DS-16. */
  pressScale: 0.97,
} as const;

export const tokens = { color, space, radius, elevation, type, breakpoint, content, layout, icon, a11y, motion };
export default tokens;
