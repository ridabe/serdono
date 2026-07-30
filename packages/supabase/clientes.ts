import { supabase } from "./client";
import type { Tables } from "./types";

export type JornadaClienteContato = Tables<"jornada_clientes_contatos">;
export type ClienteContatoStatus = "novo" | "contatado" | "respondeu" | "orcamento_enviado" | "cliente";

/**
 * Fase Clientes — Captação de Clientes (SDD-45, MVP). Duas partes:
 *  - `jornada_clientes_contatos`: lista pessoal do empreendedor, CRUD livre,
 *    mesmo padrão de `jornada_fornecedores` (SDD-41).
 *  - `clientes_oferta`: entregável de IA regenerável, mesmo padrão de
 *    `marketing_conteudo` (SDD-43).
 */

// ---- Lista pessoal de contatos ----

export interface JornadaClienteContatoInput {
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  notas?: string;
  status?: ClienteContatoStatus;
}

export async function listJornadaClientesContatos(instanceId: string): Promise<JornadaClienteContato[]> {
  const { data, error } = await supabase
    .from("jornada_clientes_contatos")
    .select("*")
    .eq("jornada_instance_id", instanceId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function addJornadaClienteContato(instanceId: string, input: JornadaClienteContatoInput): Promise<void> {
  const { error } = await supabase.from("jornada_clientes_contatos").insert({ jornada_instance_id: instanceId, ...input });
  if (error) throw error;
}

export async function updateJornadaClienteContatoStatus(id: string, status: ClienteContatoStatus): Promise<void> {
  const { error } = await supabase.from("jornada_clientes_contatos").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function removeJornadaClienteContato(id: string): Promise<void> {
  const { error } = await supabase.from("jornada_clientes_contatos").delete().eq("id", id);
  if (error) throw error;
}

// ---- Critérios de conclusão (PRD §9.10) — calculados sobre dado real, nunca um checklist manual ----

export interface CriteriosConclusaoClientes {
  metaDefinida: boolean;
  ofertaCriada: boolean;
  contatosCadastrados: number;
  abordagensRealizadas: number;
  respostasRecebidas: number;
  orcamentosEnviados: number;
  primeiroClienteConquistado: boolean;
  todosAtendidos: boolean;
}

const STATUS_APOS_ABORDAGEM: ClienteContatoStatus[] = ["contatado", "respondeu", "orcamento_enviado", "cliente"];
const STATUS_APOS_RESPOSTA: ClienteContatoStatus[] = ["respondeu", "orcamento_enviado", "cliente"];
const STATUS_APOS_ORCAMENTO: ClienteContatoStatus[] = ["orcamento_enviado", "cliente"];

const CONTATOS_MINIMOS = 20;
const ABORDAGENS_MINIMAS = 10;
const RESPOSTAS_MINIMAS = 3;
const ORCAMENTOS_MINIMOS = 1;

export function calcularCriteriosConclusao(
  metaDefinida: boolean,
  ofertaCriada: boolean,
  contatos: JornadaClienteContato[]
): CriteriosConclusaoClientes {
  const contatosCadastrados = contatos.length;
  const abordagensRealizadas = contatos.filter((c) => STATUS_APOS_ABORDAGEM.includes(c.status as ClienteContatoStatus)).length;
  const respostasRecebidas = contatos.filter((c) => STATUS_APOS_RESPOSTA.includes(c.status as ClienteContatoStatus)).length;
  const orcamentosEnviados = contatos.filter((c) => STATUS_APOS_ORCAMENTO.includes(c.status as ClienteContatoStatus)).length;
  const primeiroClienteConquistado = contatos.some((c) => c.status === "cliente");

  const todosAtendidos =
    metaDefinida &&
    ofertaCriada &&
    contatosCadastrados >= CONTATOS_MINIMOS &&
    abordagensRealizadas >= ABORDAGENS_MINIMAS &&
    respostasRecebidas >= RESPOSTAS_MINIMAS &&
    orcamentosEnviados >= ORCAMENTOS_MINIMOS &&
    primeiroClienteConquistado;

  return {
    metaDefinida,
    ofertaCriada,
    contatosCadastrados,
    abordagensRealizadas,
    respostasRecebidas,
    orcamentosEnviados,
    primeiroClienteConquistado,
    todosAtendidos,
  };
}

export { CONTATOS_MINIMOS, ABORDAGENS_MINIMAS, RESPOSTAS_MINIMAS, ORCAMENTOS_MINIMOS };

// ---- Oferta comercial gerada por IA ----

export interface OfertaComercial {
  produto: string;
  beneficio: string;
  diferencial: string;
  condicao: string;
  prazo: string;
  cta: string;
}

export async function generateOfertaComercial(instanceId: string): Promise<OfertaComercial> {
  const { data, error } = await supabase.functions.invoke("jornada-gerar-oferta", {
    body: { jornada_instance_id: instanceId },
  });
  if (error) throw error;
  return data as OfertaComercial;
}

export async function getOfertaComercial(instanceId: string): Promise<OfertaComercial | null> {
  const { data, error } = await supabase
    .from("jornada_deliverables")
    .select("conteudo")
    .eq("jornada_instance_id", instanceId)
    .eq("tipo", "clientes_oferta")
    .maybeSingle();
  if (error) throw error;
  return (data?.conteudo as unknown as OfertaComercial | undefined) ?? null;
}
