import { supabase } from "./client";

/**
 * Painel Admin de Assinaturas (pedido do dono do produto, 17/08/2026, mesma
 * tarde de SDD-113) — controle de assinaturas, planos mais assinados,
 * inadimplência e estimativa de receita (real vs. potencial). Leitura passa
 * por RPC `security definer` (mesmo espírito de `adminDashboard.ts`: nunca
 * abrir SELECT amplo em `subscriptions` pro client, mesmo pro admin). Escrita
 * (conceder/alterar plano, sincronizar com a AbacatePay) passa por Edge
 * Function com service_role — RLS de `subscriptions` não dá insert/update pro
 * client, nem admin (SDD-110).
 */

export interface AssinaturasResumo {
  mrr_real_centavos: number;
  mrr_potencial_centavos: number;
  ativos_pagos: number;
  ativos_cortesia: number;
  inadimplentes: number;
  gratuitos: number;
  total_usuarios: number;
}

export async function getAssinaturasResumo(): Promise<AssinaturasResumo> {
  const { data, error } = await supabase.rpc("admin_assinaturas_resumo");
  if (error) throw error;
  return data as unknown as AssinaturasResumo;
}

export interface AssinaturaPorPlano {
  plano: string;
  ativos: number;
  ativos_cortesia: number;
  receita_real_centavos: number;
}

export async function getAssinaturasPorPlano(): Promise<AssinaturaPorPlano[]> {
  const { data, error } = await supabase.rpc("admin_assinaturas_por_plano");
  if (error) throw error;
  return data as unknown as AssinaturaPorPlano[];
}

export interface AdminAssinaturaRow {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  plano: string;
  status: string;
  origem: string;
  preco_centavos: number;
  nota: string | null;
  created_at: string;
  renovado_em: string | null;
  cancelado_em: string | null;
}

export async function listAssinaturas(filtroStatus?: string): Promise<AdminAssinaturaRow[]> {
  const { data, error } = await supabase.rpc("admin_assinaturas_listar", filtroStatus ? { filtro_status: filtroStatus } : {});
  if (error) throw error;
  return data as unknown as AdminAssinaturaRow[];
}

export interface AdminPlanoUsuario {
  user_id: string;
  nome: string;
  email: string;
  plano_atual: string;
  assinatura_id: string | null;
  /** `"abacatepay"` (pagou de verdade) | `"concedido_admin"` (cortesia) | `null` (plano gratuito, sem linha em `subscriptions`). */
  origem: string | null;
}

/** Todo usuário + plano vigente — inclusive quem nunca teve `subscriptions` (fica `gratuito`/`origem: null`). Base pro seletor "Definir plano" alcançar qualquer conta, não só quem já assinou. */
export async function listPlanosUsuarios(): Promise<AdminPlanoUsuario[]> {
  const { data, error } = await supabase.rpc("admin_planos_usuarios");
  if (error) throw error;
  return data as unknown as AdminPlanoUsuario[];
}

/** Concede/altera o plano de um usuário sem passar pelo checkout — cortesia ("brinde") ou correção manual, sempre `origem: "concedido_admin"` (nunca conta como receita real). */
export async function definirPlanoManualmente(params: { userId: string; plano: "gratuito" | "essencial" | "master"; nota?: string }): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-plano-definir", { body: params });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
}

export interface SincronizacaoResultado {
  verificadas: number;
  marcadasInadimplentes: number;
  sincronizadasCanceladas: number;
  ignoradas: number;
}

/** Consulta a AbacatePay pra achar assinatura que parou de pagar (sem evento de webhook pra isso, ver Edge Function) — marca `inadimplente`, nunca rebaixa o plano do usuário sozinho. */
export async function sincronizarComAbacatePay(): Promise<SincronizacaoResultado> {
  const { data, error } = await supabase.functions.invoke("admin-assinaturas-sincronizar", { body: {} });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  return data as SincronizacaoResultado;
}
