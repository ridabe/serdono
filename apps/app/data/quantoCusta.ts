// Ser Dono — camada de acesso ao dado gerado das páginas "Quanto custa abrir"
// (SDD-93, docs/SPEC.md). O JSON é gerado por scripts/generate-quanto-custa-data.mjs
// a partir das migrations reais de `public.niches` — nunca editar
// `quantoCusta.generated.json` à mão; reexecute o script.

import generated from "./quantoCusta.generated.json";

export interface QuantoCustaNicho {
  nome: string;
  slug: string;
  categoria: string;
  investimentoMin: number;
  investimentoMax: number;
  tempoEquilibrioMeses: number | null;
  margemTipicaPct: number | null;
  nivelConcorrencia: number | null;
  dependenciaPontoFisico: boolean;
  perfilCliente: string | null;
  fonte: string;
  fonteData: string | null;
}

export const nichos: QuantoCustaNicho[] = generated as QuantoCustaNicho[];

export function getNicho(slug: string): QuantoCustaNicho | undefined {
  return nichos.find((n) => n.slug === slug);
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatFonteData(iso: string | null): string {
  if (!iso) return "";
  const [ano, mes] = iso.split("-");
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const idx = Number(mes) - 1;
  return idx >= 0 && idx < 12 ? `${meses[idx]}/${ano}` : iso;
}

/** Rótulo textual — nunca mostrar o nível de concorrência só como número ou só como cor (DS-2). */
export function concorrenciaLabel(nivel: number | null): string {
  if (nivel == null) return "Não informado";
  if (nivel <= 2) return "Baixa";
  if (nivel === 3) return "Média";
  return "Alta";
}
