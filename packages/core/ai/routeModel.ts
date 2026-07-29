/**
 * Roteamento de modelo de IA — PRD RN-10, SPEC.md §5. Função pura e
 * testável sem rede (SDD-3), pra rodar tanto no cliente quanto em Edge
 * Functions Deno (via import relativo, como `diagnostic-match` já faz com
 * `fitScore.ts`).
 *
 * "Econômico" cobre perguntas de baixa complexidade (FAQ, formatação,
 * resumo, justificativa curta — caso de `diagnostic-match`); "avançado"
 * cobre geração de entregável final e checagem de etapa (RN-9) — caso da
 * geração de documentos da Jornada Empreendedora (SDD-32).
 */

export type ModelKind = "economico" | "avancado";

export function routeModel(kind: ModelKind): string {
  return kind === "avancado" ? "claude-sonnet-4-5" : "claude-haiku-4-5-20251001";
}
