// Ser Dono — Edge Function "assinatura-verificar-vencidas" (inadimplência
// automática de assinatura, pedido do dono do produto, 28/08/2026).
//
// A AbacatePay não dispara nenhum webhook de "cobrança recorrente falhou" —
// só existem subscription.completed/renewed/cancelled (achado já registrado
// em SDD-114). Sem essa checagem periódica, o sistema nunca saberia sozinho
// que uma mensalidade venceu sem pagamento confirmado.
//
// Roda via pg_cron a cada 6h (migration `20260828150100_...`), autenticada
// com `CRON_AUTH_TOKEN` (secret dedicado — achado/corrigido na mesma sessão:
// o secret antigo, `edge_functions_service_role_key` no Vault, usado tanto
// aqui quanto em `lembretes-diarios`, estava desatualizado e os dois cron
// jobs vinham devolvendo 401 silenciosamente em produção). `verify_jwt:
// false` no deploy de propósito — `CRON_AUTH_TOKEN` é uma string aleatória
// (`crypto.randomBytes`), NUNCA um JWT de verdade; com `verify_jwt: true` o
// gateway rejeita ANTES de chegar no código (`UNAUTHORIZED_INVALID_JWT_FORMAT`,
// achado testando). A checagem que importa de verdade é a comparação manual
// abaixo, mesmo mecanismo do `webhookSecret` de `assinatura-webhook`. Dois
// passos, cada um idempotente pela própria transição de `status` (rodar de
// novo antes do próximo ciclo não repete e-mail nem rebaixamento):
//
// 1. Assinatura `ativa` cujo ciclo (`renovado_em` + 1 mês) já passou sem um
//    novo `subscription.renewed` → vira `inadimplente`, dispara o e-mail
//    "não recebi o pagamento" (uma vez só: assim que sai de `ativa`, a
//    próxima rodada não pega mais essa linha aqui).
// 2. Assinatura `inadimplente` há mais de 2 dias (`inadimplente_desde` + 2
//    dias) → vira `cancelada` (mesma semântica de cancelamento manual — a
//    cobrança recorrente parou de vez) e `users.plano_atual` volta pro
//    Gratuito, MAS só se não houver outra assinatura `ativa` do mesmo
//    usuário (mesma regra já usada no cancelamento via webhook/tela). Nunca
//    apaga nenhum dado — jornada, progresso e histórico continuam intactos;
//    só o gate de plano (`hasModuleAccess`/`faseJornadaLiberada`) volta a
//    barrar os módulos acima do Gratuito. Se o pagamento voltar a acontecer
//    (retry da própria AbacatePay na mesma cobrança, ou uma assinatura nova
//    pelo `/planos`), o webhook de sempre (`assinatura-webhook`) já religa
//    tudo — nenhuma lógica de "restaurar" precisa existir aqui.

import { createClient } from "npm:@supabase/supabase-js@2";
import { assuntoAssinaturaVencida, htmlAssinaturaVencida, textoAssinaturaVencida, type DadosEmailAssinaturaVencida } from "./template.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_AUTH_TOKEN = Deno.env.get("CRON_AUTH_TOKEN")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("EMAIL_FROM") ?? "Mary do Ser Dono <mary@serdono.com.br>";
const REPLY_TO = Deno.env.get("EMAIL_REPLY_TO") ?? "contato@serdono.com.br";
const BASE_URL = Deno.env.get("PUBLIC_BASE_URL") ?? "https://serdono.com.br";

const DIAS_CARENCIA = 2;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SubscriptionRow {
  id: string;
  user_id: string;
  plano: string;
  preco_centavos: number;
  renovado_em: string | null;
  inadimplente_desde: string | null;
}

async function enviarEmailVencida(sub: SubscriptionRow, prazoLimiteISO: string) {
  try {
    if (sub.plano !== "essencial" && sub.plano !== "master") return;

    const [{ data: authUser }, { data: perfil }] = await Promise.all([
      admin.auth.admin.getUserById(sub.user_id),
      admin.from("users").select("nome").eq("id", sub.user_id).maybeSingle(),
    ]);
    const email = authUser?.user?.email;
    if (!email) {
      console.warn("assinatura-verificar-vencidas: sem e-mail pra avisar vencimento", { user_id: sub.user_id });
      return;
    }

    const dados: DadosEmailAssinaturaVencida = {
      nome: (perfil?.nome as string) ?? "",
      email,
      plano: sub.plano,
      precoCentavos: sub.preco_centavos,
      prazoLimite: prazoLimiteISO,
      baseUrl: BASE_URL,
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: REPLY_TO,
        subject: assuntoAssinaturaVencida(dados),
        html: htmlAssinaturaVencida(dados),
        text: textoAssinaturaVencida(dados),
      }),
    });
    if (!resp.ok) {
      console.error("assinatura-verificar-vencidas: Resend falhou", resp.status, await resp.text());
    }
  } catch (error) {
    console.error("assinatura-verificar-vencidas: erro enviando e-mail", error);
  }
}

/** Passo 1: `ativa` que passou do ciclo sem renovação confirmada → `inadimplente` + e-mail. */
async function marcarVencidas(): Promise<number> {
  const limite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // ~1 mês (ciclo "mensal", único suportado hoje)

  const { data: vencidas, error } = await admin
    .from("subscriptions")
    .select("id, user_id, plano, preco_centavos, renovado_em, inadimplente_desde")
    .eq("status", "ativa")
    .not("renovado_em", "is", null)
    .lt("renovado_em", limite);
  if (error) throw error;
  if (!vencidas || vencidas.length === 0) return 0;

  const agora = new Date();
  const prazoLimite = new Date(agora.getTime() + DIAS_CARENCIA * 24 * 60 * 60 * 1000).toISOString();

  for (const sub of vencidas as SubscriptionRow[]) {
    // Cada linha atualizada individualmente (não um `update` em massa) —
    // idempotência real depende do `.eq("status", "ativa")` valer no
    // instante exato desta linha, não da seleção feita alguns milissegundos
    // atrás (evita reenviar e-mail se outra chamada concorrente já processou).
    const { data: atualizada } = await admin
      .from("subscriptions")
      .update({ status: "inadimplente", inadimplente_desde: agora.toISOString(), updated_at: agora.toISOString() })
      .eq("id", sub.id)
      .eq("status", "ativa")
      .select("id")
      .maybeSingle();
    if (!atualizada) continue; // já processada por outra execução — pula sem reenviar
    await enviarEmailVencida(sub, prazoLimite);
  }
  return vencidas.length;
}

/** Passo 2: `inadimplente` há mais de `DIAS_CARENCIA` dias → `cancelada` + rebaixa `plano_atual`. */
async function rebaixarExpiradas(): Promise<number> {
  const limite = new Date(Date.now() - DIAS_CARENCIA * 24 * 60 * 60 * 1000).toISOString();

  const { data: expiradas, error } = await admin
    .from("subscriptions")
    .select("id, user_id")
    .eq("status", "inadimplente")
    .not("inadimplente_desde", "is", null)
    .lt("inadimplente_desde", limite);
  if (error) throw error;
  if (!expiradas || expiradas.length === 0) return 0;

  const agora = new Date().toISOString();

  for (const sub of expiradas as { id: string; user_id: string }[]) {
    const { data: atualizada } = await admin
      .from("subscriptions")
      .update({
        status: "cancelada",
        cancelado_em: agora,
        updated_at: agora,
        nota: "Cancelada automaticamente por falta de pagamento (assinatura-verificar-vencidas).",
      })
      .eq("id", sub.id)
      .eq("status", "inadimplente")
      .select("id")
      .maybeSingle();
    if (!atualizada) continue; // já processada por outra execução

    // Mesma regra do cancelamento via webhook: só rebaixa se não houver
    // OUTRA assinatura ativa do mesmo usuário (ex.: já trocou de plano).
    const { data: outraAtiva } = await admin
      .from("subscriptions")
      .select("plano")
      .eq("user_id", sub.user_id)
      .eq("status", "ativa")
      .neq("id", sub.id)
      .maybeSingle();
    await admin.from("users").update({ plano_atual: outraAtiva?.plano ?? "gratuito" }).eq("id", sub.user_id);
  }
  return expiradas.length;
}

Deno.serve(async (req) => {
  try {
    // Chamada só pelo pg_cron com `CRON_AUTH_TOKEN` — não é um endpoint público.
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${CRON_AUTH_TOKEN}`) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }

    const [marcadas, rebaixadas] = await Promise.all([marcarVencidas(), rebaixarExpiradas()]);

    return new Response(JSON.stringify({ marcadas_inadimplentes: marcadas, rebaixadas_pro_gratuito: rebaixadas }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("assinatura-verificar-vencidas", error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? "Erro inesperado" }), { status: 500 });
  }
});
