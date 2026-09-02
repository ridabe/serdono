import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Painel Admin — leads capturados na landing do e-book (SDD-140).
 *
 * A tabela `lead_magnet_leads` (SDD-139) guarda quem preencheu o formulário
 * e baixou a isca gratuita. RLS: leitura/edição/exclusão só admin; INSERT
 * continua fechado (só a Edge Function `lead-capturar` grava — lead nasce
 * pelo formulário público, nunca à mão).
 *
 * Paginação por offset (não cursor): a lista de leads é pequena e a busca é
 * server-side por `ilike` em nome/e-mail/telefone — offset é suficiente e
 * deixa "ir pra página X" trivial, diferente do Painel AbacatePay (cursor
 * porque a API deles não dá offset).
 */

export type AdminLeadMagnetRow = Tables<"lead_magnet_leads">;

/** Campos editáveis de um lead pelo Painel. */
export interface AdminLeadMagnetPatch {
  nome?: string;
  email?: string;
  telefone?: string | null;
  q_momento?: string;
  q_vontade?: string;
  q_tem_ideia?: string;
  q_capital_giro?: string;
  q_prazo?: string;
}

export interface ListarLeadsParams {
  /** Busca por nome, e-mail ou telefone (case-insensitive, `ilike %termo%`). */
  busca?: string;
  /** Slug da isca — hoje só 'ebook-abrir-negocio'. Omitir traz todas. */
  leadMagnet?: string;
  pagina?: number;
  porPagina?: number;
}

export interface ListarLeadsResult {
  rows: AdminLeadMagnetRow[];
  /** Total de linhas que batem no filtro (pra montar a paginação). */
  total: number;
  pagina: number;
  porPagina: number;
}

export async function listarLeadsMagnet(params: ListarLeadsParams = {}): Promise<ListarLeadsResult> {
  const pagina = Math.max(1, params.pagina ?? 1);
  const porPagina = params.porPagina ?? 15;
  const from = (pagina - 1) * porPagina;
  const to = from + porPagina - 1;

  let query = supabase
    .from("lead_magnet_leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.leadMagnet) query = query.eq("lead_magnet", params.leadMagnet);

  const busca = params.busca?.trim();
  if (busca) {
    const termo = busca.replace(/[%,()]/g, " ");
    query = query.or(`nome.ilike.%${termo}%,email.ilike.%${termo}%,telefone.ilike.%${termo}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0, pagina, porPagina };
}

export async function atualizarLeadMagnet(id: string, patch: AdminLeadMagnetPatch): Promise<void> {
  const { error } = await supabase.from("lead_magnet_leads").update(patch).eq("id", id);
  if (error) throw error;
}

export async function excluirLeadMagnet(id: string): Promise<void> {
  const { error } = await supabase.from("lead_magnet_leads").delete().eq("id", id);
  if (error) throw error;
}

/** Exclusão em lote — usado pela seleção múltipla da tabela. */
export async function excluirLeadsMagnet(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("lead_magnet_leads").delete().in("id", ids);
  if (error) throw error;
}

/**
 * Todos os e-mails da lista (deduplicados), na ordem de cadastro mais
 * recente. **Preparado pro envio de e-mail em massa** (SDD-140): quando a
 * área de disparo existir, ela consome isto pra montar o público. Hoje só a
 * tela usa, pra "Copiar e-mails".
 */
export async function listarEmailsLeadMagnet(leadMagnet?: string): Promise<string[]> {
  let query = supabase
    .from("lead_magnet_leads")
    .select("email, created_at")
    .order("created_at", { ascending: false });
  if (leadMagnet) query = query.eq("lead_magnet", leadMagnet);

  const { data, error } = await query;
  if (error) throw error;

  const vistos = new Set<string>();
  const emails: string[] = [];
  for (const row of data ?? []) {
    const email = (row.email ?? "").toLowerCase().trim();
    if (email && !vistos.has(email)) {
      vistos.add(email);
      emails.push(email);
    }
  }
  return emails;
}
