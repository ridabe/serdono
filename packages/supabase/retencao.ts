import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Módulo Retenção de Clientes (PRD §12.5, SPEC.md SDD-54).
 *
 * Dono do dado é o usuário (`user_id`), não a jornada — o módulo funciona
 * para quem nunca fez a Jornada (RN-29: módulo é independente do workflow).
 * A classificação em si (em dia / esfriando / sumido) NÃO mora aqui: é
 * função pura em `packages/core/retencao.ts` (SDD-3), porque a tela e
 * qualquer futuro consumidor precisam do mesmo resultado.
 */

export type RetencaoCliente = Tables<"retencao_clientes">;
export type RetencaoInteracao = Tables<"retencao_interacoes">;
export type RetencaoInteracaoTipo = "compra" | "contato";

/** Cliente da carteira já com o que a tela precisa saber do histórico dele. */
export interface ClienteComHistorico extends RetencaoCliente {
  ultimaInteracaoEm: string | null;
  totalCompras: number;
  valorTotalCompras: number;
}

// ---- Configuração (ciclo de recompra) ----

export async function getCicloRecompra(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("retencao_config")
    .select("ciclo_recompra_dias")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.ciclo_recompra_dias ?? null;
}

export async function saveCicloRecompra(userId: string, dias: number): Promise<void> {
  const { error } = await supabase
    .from("retencao_config")
    .upsert({ user_id: userId, ciclo_recompra_dias: dias }, { onConflict: "user_id" });
  if (error) throw error;
}

// ---- Carteira ----

export interface RetencaoClienteInput {
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  notas?: string;
}

/**
 * Carteira completa com o histórico agregado por cliente.
 *
 * Uma consulta por tabela em vez de um join com agregação: são duas listas
 * pequenas (carteira pessoal de um empreendedor), e agregar no cliente evita
 * depender de view/RPC que teria que ser mantida em migration à parte.
 */
export async function listClientesComHistorico(userId: string): Promise<ClienteComHistorico[]> {
  const { data: clientes, error } = await supabase
    .from("retencao_clientes")
    .select("*")
    .eq("user_id", userId)
    .order("nome");
  if (error) throw error;
  if (clientes.length === 0) return [];

  const { data: interacoes, error: erroInteracoes } = await supabase
    .from("retencao_interacoes")
    .select("cliente_id, tipo, valor, ocorrida_em")
    .in(
      "cliente_id",
      clientes.map((c) => c.id)
    );
  if (erroInteracoes) throw erroInteracoes;

  return clientes.map((cliente) => {
    const doCliente = interacoes.filter((i) => i.cliente_id === cliente.id);
    const compras = doCliente.filter((i) => i.tipo === "compra");
    // A data mais recente é comparada como string porque `ocorrida_em` é
    // `date` (ISO `YYYY-MM-DD`) — ordem lexicográfica e cronológica coincidem.
    const ultimaInteracaoEm = doCliente.reduce<string | null>(
      (maior, i) => (maior === null || i.ocorrida_em > maior ? i.ocorrida_em : maior),
      null
    );
    return {
      ...cliente,
      ultimaInteracaoEm,
      totalCompras: compras.length,
      valorTotalCompras: compras.reduce((soma, c) => soma + Number(c.valor ?? 0), 0),
    };
  });
}

export async function addCliente(userId: string, input: RetencaoClienteInput): Promise<void> {
  const { error } = await supabase.from("retencao_clientes").insert({ user_id: userId, origem: "manual", ...input });
  if (error) throw error;
}

export async function updateCliente(id: string, input: Partial<RetencaoClienteInput>): Promise<void> {
  const { error } = await supabase.from("retencao_clientes").update(input).eq("id", id);
  if (error) throw error;
}

export async function removeCliente(id: string): Promise<void> {
  const { error } = await supabase.from("retencao_clientes").delete().eq("id", id);
  if (error) throw error;
}

// ---- Importação da Jornada ----

export interface ResultadoImportacao {
  importados: number;
  /** Contatos que já estavam na carteira — informação, não erro. */
  jaExistiam: number;
}

/**
 * Traz pra carteira os contatos que fecharam na Fase Clientes da Jornada
 * (`status = 'cliente'`, SDD-45).
 *
 * Idempotente por construção: o índice único `(user_id, origem_contato_id)`
 * garante que rodar de novo não duplica ninguém, e a checagem prévia aqui
 * existe só pra poder contar e reportar quantos já estavam — o empreendedor
 * precisa entender por que "importar" às vezes não traz nada.
 *
 * Não é chamada automaticamente ao abrir o módulo, de propósito: mexer na
 * carteira de alguém sem a pessoa pedir é o tipo de "ajuda" que confunde.
 */
export async function importarClientesDaJornada(userId: string, jornadaInstanceId: string): Promise<ResultadoImportacao> {
  const { data: contatos, error } = await supabase
    .from("jornada_clientes_contatos")
    .select("id, nome, telefone, email, empresa, notas")
    .eq("jornada_instance_id", jornadaInstanceId)
    .eq("status", "cliente");
  if (error) throw error;
  if (contatos.length === 0) return { importados: 0, jaExistiam: 0 };

  const { data: jaImportados, error: erroExistentes } = await supabase
    .from("retencao_clientes")
    .select("origem_contato_id")
    .eq("user_id", userId)
    .not("origem_contato_id", "is", null);
  if (erroExistentes) throw erroExistentes;

  const existentes = new Set(jaImportados.map((c) => c.origem_contato_id));
  const novos = contatos.filter((c) => !existentes.has(c.id));
  if (novos.length === 0) return { importados: 0, jaExistiam: contatos.length };

  const { error: erroInsert } = await supabase.from("retencao_clientes").insert(
    novos.map((c) => ({
      user_id: userId,
      nome: c.nome,
      telefone: c.telefone,
      email: c.email,
      empresa: c.empresa,
      notas: c.notas,
      origem: "jornada" as const,
      origem_contato_id: c.id,
    }))
  );
  if (erroInsert) throw erroInsert;

  return { importados: novos.length, jaExistiam: contatos.length - novos.length };
}

// ---- Interações ----

export interface RetencaoInteracaoInput {
  tipo: RetencaoInteracaoTipo;
  /** Só faz sentido em compra, e sempre opcional (RN-1) — nunca obrigar a informar dinheiro. */
  valor?: number | null;
  ocorridaEm: string;
  notas?: string;
}

export async function listInteracoes(clienteId: string): Promise<RetencaoInteracao[]> {
  const { data, error } = await supabase
    .from("retencao_interacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("ocorrida_em", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addInteracao(clienteId: string, input: RetencaoInteracaoInput): Promise<void> {
  const { error } = await supabase.from("retencao_interacoes").insert({
    cliente_id: clienteId,
    tipo: input.tipo,
    valor: input.tipo === "compra" ? input.valor ?? null : null,
    ocorrida_em: input.ocorridaEm,
    notas: input.notas,
  });
  if (error) throw error;
}

export async function removeInteracao(id: string): Promise<void> {
  const { error } = await supabase.from("retencao_interacoes").delete().eq("id", id);
  if (error) throw error;
}

// ---- Roteiro de reaproximação (IA) ----

export interface RoteiroReaproximacao {
  abertura: string;
  motivo: string;
  oferta: string;
  fechamento: string;
  mensagemPronta: string;
}

export async function getRoteiroReaproximacao(clienteId: string): Promise<RoteiroReaproximacao | null> {
  const { data, error } = await supabase
    .from("retencao_roteiros")
    .select("conteudo")
    .eq("cliente_id", clienteId)
    .maybeSingle();
  if (error) throw error;
  return (data?.conteudo as unknown as RoteiroReaproximacao | undefined) ?? null;
}

/** Regenerável quantas vezes o empreendedor quiser (RN-26), como todo entregável de IA do produto. */
export async function generateRoteiroReaproximacao(clienteId: string): Promise<RoteiroReaproximacao> {
  const { data, error } = await supabase.functions.invoke("retencao-gerar-roteiro", {
    body: { cliente_id: clienteId },
  });
  if (error) throw error;
  return data as RoteiroReaproximacao;
}
