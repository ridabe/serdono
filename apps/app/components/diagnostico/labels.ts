export const CAPITAL_LABEL: Record<string, string> = {
  ate_5k: "até R$ 5 mil",
  "5k_15k": "R$ 5 a 15 mil",
  "15k_40k": "R$ 15 a 40 mil",
  mais_40k: "mais de R$ 40 mil",
};

export const TEMPO_LABEL: Record<string, string> = {
  integral: "dedicação integral",
  parcial: "meio período",
  paralelo_emprego: "nas horas livres, ainda empregado",
};

export const OBJETIVO_LABEL: Record<string, string> = {
  renda_extra: "uma renda extra",
  substituir_salario: "substituir o salário atual",
  escalar: "construir algo para escalar",
};

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// Defesa extra no client: linhas geradas antes do ajuste do prompt (Edge Function
// diagnostic-match) podem ter markdown salvo em niche_matches.justificativa_ia.
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
}
