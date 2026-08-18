import { supabase } from "./client";

/**
 * Painel Admin AbacatePay (pedido do dono do produto, 18/08/2026) — CRUD
 * direto contra a API da AbacatePay pra concentrar as ações que hoje só dá
 * pra fazer no painel deles (produtos, webhooks, clientes, cupons, saques,
 * PIX) dentro do Ser Dono. Tudo passa por UMA Edge Function proxy
 * (`admin-abacatepay-proxy`) que injeta a `ABACATEPAY_API_KEY` no servidor —
 * o client nunca vê a chave, só manda `{ method, path, query?, body? }` e a
 * function valida `path` contra um allowlist fechado antes de repassar.
 *
 * Fora de escopo de propósito (ver comentário no proxy): Payment Links e
 * Transparent Checkout (PIX/Boleto avulso) — não usados pelo fluxo de
 * cobrança do Ser Dono. `store/get` também ficou fora — a API devolve
 * "Not found" pra esse endpoint apesar de documentado, achado testando antes
 * de construir a tela (não vale montar uma aba que nunca funciona).
 */

export interface AbacatePayPagination {
  hasMore: boolean;
  next: string | null;
  before: string | null;
}

export interface AbacatePayListResult<T> {
  data: T[];
  pagination: AbacatePayPagination;
}

async function chamar<T = unknown>(method: "GET" | "POST", path: string, opts?: { query?: Record<string, string | undefined>; body?: Record<string, unknown> }): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-abacatepay-proxy", {
    body: { method, path, query: opts?.query, body: opts?.body },
  });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      const respBody = await context.json().catch(() => null);
      if (respBody?.error) throw new Error(respBody.error);
    }
    throw error;
  }
  if (data && typeof data === "object" && "success" in data && (data as { success: boolean }).success === false) {
    throw new Error((data as { error?: string }).error ?? "A AbacatePay recusou a operação.");
  }
  return data as T;
}

export interface PageParams {
  limit?: number;
  after?: string;
  before?: string;
}

// ---- Produtos ----
export interface AbacatePayProduto {
  id: string;
  externalId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  status: string;
  cycle: string | null;
  trialDays: number | null;
  devMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listarProdutosAbacatePay(params: PageParams = {}): Promise<AbacatePayListResult<AbacatePayProduto>> {
  return chamar("GET", "/products/list", { query: params as Record<string, string> });
}

export async function criarProdutoAbacatePay(params: {
  externalId: string;
  name: string;
  description?: string;
  price: number;
  cycle?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "ANNUALLY";
  /** URL pública (não é upload de arquivo — a API da AbacatePay só aceita URL). Ver `uploadAbacatePayProdutoImagem` em `storage.ts` pra subir a imagem antes e gerar essa URL. */
  imageUrl?: string;
}): Promise<AbacatePayProduto> {
  const resp = await chamar<{ data: AbacatePayProduto }>("POST", "/products/create", { body: { ...params, currency: "BRL" } });
  return resp.data;
}

export async function apagarProdutoAbacatePay(id: string): Promise<void> {
  await chamar("POST", "/products/delete", { query: { id } });
}

// ---- Webhooks ----
export interface AbacatePayWebhook {
  id: string;
  name: string;
  events: string[];
  endpoint: string;
  devMode: boolean;
  createdAt: string;
  updatedAt: string;
}

const EVENTOS_WEBHOOK_DISPONIVEIS = [
  "checkout.completed",
  "checkout.refunded",
  "checkout.lost",
  "subscription.completed",
  "subscription.renewed",
  "subscription.cancelled",
  "subscription.plan_changed",
  "subscription.payment_failed",
  "payout.completed",
  "payout.failed",
] as const;
export { EVENTOS_WEBHOOK_DISPONIVEIS };

export async function listarWebhooksAbacatePay(params: PageParams = {}): Promise<AbacatePayListResult<AbacatePayWebhook>> {
  return chamar("GET", "/webhooks/list", { query: params as Record<string, string> });
}

export async function criarWebhookAbacatePay(params: { name: string; endpoint: string; secret: string; events: string[] }): Promise<AbacatePayWebhook> {
  const resp = await chamar<{ data: AbacatePayWebhook }>("POST", "/webhooks/create", { body: params });
  return resp.data;
}

export async function apagarWebhookAbacatePay(id: string): Promise<void> {
  await chamar("POST", "/webhooks/delete", { query: { id } });
}

// ---- Clientes ----
export interface AbacatePayCliente {
  id: string;
  name: string | null;
  email: string | null;
  taxId: string | null;
  cellphone: string | null;
  devMode: boolean;
}

export async function listarClientesAbacatePay(params: PageParams & { email?: string } = {}): Promise<AbacatePayListResult<AbacatePayCliente>> {
  return chamar("GET", "/customers/list", { query: params as Record<string, string> });
}

export async function apagarClienteAbacatePay(id: string): Promise<void> {
  await chamar("POST", "/customers/delete", { query: { id } });
}

// ---- Cupons ----
export interface AbacatePayCupom {
  id: string;
  discountKind: "PERCENTAGE" | "FIXED";
  discount: number;
  status: "ACTIVE" | "DISABLED" | "EXPIRED";
  notes: string | null;
  maxRedeems: number;
  redeemsCount: number;
  devMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listarCuponsAbacatePay(params: PageParams = {}): Promise<AbacatePayListResult<AbacatePayCupom>> {
  return chamar("GET", "/coupons/list", { query: params as Record<string, string> });
}

export async function criarCupomAbacatePay(params: { code: string; discountKind: "PERCENTAGE" | "FIXED"; discount: number; notes?: string; maxRedeems?: number }): Promise<AbacatePayCupom> {
  const resp = await chamar<{ data: AbacatePayCupom }>("POST", "/coupons/create", { body: params });
  return resp.data;
}

export async function apagarCupomAbacatePay(id: string): Promise<void> {
  await chamar("POST", "/coupons/delete", { query: { id } });
}

export async function alternarCupomAbacatePay(id: string): Promise<void> {
  await chamar("POST", "/coupons/toggle", { query: { id } });
}

// ---- Assinaturas (leitura, cruzamento de auditoria com `subscriptions` do nosso banco) ----
export interface AbacatePaySubscriptionCheckout {
  id: string;
  externalId: string;
  status: string;
  amount: number;
  paidAmount: number;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listarAssinaturasAbacatePay(params: PageParams & { status?: string; email?: string } = {}): Promise<AbacatePayListResult<AbacatePaySubscriptionCheckout>> {
  return chamar("GET", "/subscriptions/list", { query: params as Record<string, string> });
}

// ---- Saques (payouts) — MOVE DINHEIRO DE VERDADE ----
export interface AbacatePayPayout {
  id: string;
  status: string;
  amount: number;
  platformFee: number;
  externalId: string;
  receiptUrl: string | null;
  devMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listarPayoutsAbacatePay(params: PageParams = {}): Promise<AbacatePayListResult<AbacatePayPayout>> {
  return chamar("GET", "/payouts/list", { query: params as Record<string, string> });
}

/** Cria um saque de verdade da conta AbacatePay pro banco cadastrado — `amountCentavos` mínimo 350 (R$ 3,50). Exige `confirm: true`, que a tela só manda depois de um `ConfirmModal` com o valor por extenso. */
export async function criarPayoutAbacatePay(params: { amountCentavos: number; description?: string }): Promise<AbacatePayPayout> {
  const resp = await chamar<{ data: AbacatePayPayout }>("POST", "/payouts/create", {
    body: { amount: params.amountCentavos, externalId: `serdono-payout-${Date.now()}`, description: params.description, confirm: true },
  });
  return resp.data;
}

// ---- PIX pra terceiro — MOVE DINHEIRO DE VERDADE ----
export interface AbacatePayPix {
  id: string;
  status: string;
  amount: number;
  platformFee: number;
  externalId: string;
  receiptUrl: string | null;
  devMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listarPixAbacatePay(params: PageParams = {}): Promise<AbacatePayListResult<AbacatePayPix>> {
  return chamar("GET", "/pix/list", { query: params as Record<string, string> });
}

/** Envia PIX de verdade pra uma chave de terceiro. Exige `confirm: true`, que a tela só manda depois de um `ConfirmModal` com o valor e a chave por extenso. */
export async function criarPixAbacatePay(params: {
  amountCentavos: number;
  pixKey: string;
  pixKeyType: "CPF" | "CNPJ" | "PHONE" | "EMAIL" | "RANDOM" | "BR_CODE";
  description?: string;
}): Promise<AbacatePayPix> {
  const resp = await chamar<{ data: AbacatePayPix }>("POST", "/pix/create", {
    body: {
      amount: params.amountCentavos,
      externalId: `serdono-pix-${Date.now()}`,
      pix: { key: params.pixKey, type: params.pixKeyType },
      description: params.description,
      confirm: true,
    },
  });
  return resp.data;
}
