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

/**
 * Contatos já marcados como `cliente` — usado pela Fase Primeira Venda
 * (SDD-47) pra deixar o empreendedor escolher qual deles foi a venda de
 * verdade, em vez de pedir pra cadastrar um cliente do zero. Sempre
 * não-vazio nessa fase: a Fase Clientes já exige pelo menos 1 contato
 * `cliente` pra liberar o próprio avanço (SDD-45).
 */
export async function getContatosCliente(instanceId: string): Promise<JornadaClienteContato[]> {
  const contatos = await listJornadaClientesContatos(instanceId);
  return contatos.filter((c) => c.status === "cliente");
}

// ---- Critérios de conclusão (PRD §9.10) — calculados sobre dado real, nunca um checklist manual ----

export interface CriteriosConclusaoClientes {
  metaDefinida: boolean;
  ofertaCriada: boolean;
  /** Piso de contatos cadastrados — dinâmico, igual a `contatosNecessarios` calculado a partir da própria meta do usuário (nunca um número fixo desconectado do que ele pediu). */
  contatosMinimos: number;
  contatosCadastrados: number;
  /** Igual a `contatosMinimos` — não faz sentido exigir mais abordagens do que o próprio piso de contatos calculado pela meta. */
  abordagensMinimas: number;
  abordagensRealizadas: number;
  /** Piso derivado de `metaClientes`: pra fechar K clientes, no mínimo K pessoas precisam ter respondido — nunca mais que `abordagensMinimas`. */
  respostasMinimas: number;
  respostasRecebidas: number;
  /** Mesmo piso de `respostasMinimas` — pra fechar K clientes, no mínimo K orçamentos precisam ter sido enviados. */
  orcamentosMinimos: number;
  orcamentosEnviados: number;
  primeiroClienteConquistado: boolean;
  todosAtendidos: boolean;
}

const STATUS_APOS_ABORDAGEM: ClienteContatoStatus[] = ["contatado", "respondeu", "orcamento_enviado", "cliente"];
const STATUS_APOS_RESPOSTA: ClienteContatoStatus[] = ["respondeu", "orcamento_enviado", "cliente"];
const STATUS_APOS_ORCAMENTO: ClienteContatoStatus[] = ["orcamento_enviado", "cliente"];

/**
 * Todos os pisos derivam da própria meta do usuário — nada fixo desconectado
 * do que ele pediu (correção de 31/07/2026, ver SPEC.md SDD-45). A cadeia é
 * logicamente encaixada, cada piso menor ou igual ao piso anterior do funil:
 *
 * `contatosNecessarios` (de `calcularMetaCaptacao`) já significa "quantos
 * contatos você precisa ABORDAR pra bater a meta" (PRD §9.10) — por isso
 * `contatosMinimos` e `abordagensMinimas` são o MESMO número, nunca um maior
 * que o outro. `respostasMinimas`/`orcamentosMinimos` vêm de `metaClientes`
 * direto: pra fechar K clientes, o mínimo matematicamente possível é K
 * respostas e K orçamentos (melhor caso, 100% de conversão em cada etapa
 * seguinte) — nunca mais que isso, e nunca mais que `abordagensMinimas`.
 */
export function calcularCriteriosConclusao(
  metaDefinida: boolean,
  ofertaCriada: boolean,
  contatos: JornadaClienteContato[],
  contatosNecessarios: number,
  metaClientes: number
): CriteriosConclusaoClientes {
  const contatosMinimos = Math.max(Math.round(contatosNecessarios), 1);
  const abordagensMinimas = contatosMinimos;
  const respostasMinimas = Math.min(Math.max(Math.round(metaClientes), 1), abordagensMinimas);
  const orcamentosMinimos = respostasMinimas;

  const contatosCadastrados = contatos.length;
  const abordagensRealizadas = contatos.filter((c) => STATUS_APOS_ABORDAGEM.includes(c.status as ClienteContatoStatus)).length;
  const respostasRecebidas = contatos.filter((c) => STATUS_APOS_RESPOSTA.includes(c.status as ClienteContatoStatus)).length;
  const orcamentosEnviados = contatos.filter((c) => STATUS_APOS_ORCAMENTO.includes(c.status as ClienteContatoStatus)).length;
  const primeiroClienteConquistado = contatos.some((c) => c.status === "cliente");

  const todosAtendidos =
    metaDefinida &&
    ofertaCriada &&
    contatosCadastrados >= contatosMinimos &&
    abordagensRealizadas >= abordagensMinimas &&
    respostasRecebidas >= respostasMinimas &&
    orcamentosEnviados >= orcamentosMinimos &&
    primeiroClienteConquistado;

  return {
    metaDefinida,
    ofertaCriada,
    contatosMinimos,
    contatosCadastrados,
    abordagensMinimas,
    abordagensRealizadas,
    respostasMinimas,
    respostasRecebidas,
    orcamentosMinimos,
    orcamentosEnviados,
    primeiroClienteConquistado,
    todosAtendidos,
  };
}

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
