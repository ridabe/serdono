// Ser Dono — Edge Function "lead-capturar" (SDD-139).
//
// Recebe o formulário da landing pública do e-book (`/ebook`): contato
// (e-mail obrigatório, nome, telefone opcional) + 5 respostas sobre o momento
// empreendedor. Valida e grava em `public.lead_magnet_leads` com service_role
// — a tabela não tem policy de INSERT pra ninguém, essa function é a única
// porta de entrada (assim a anon key nunca escreve direto e não dá pra
// floodar por SQL).
//
// Não exige usuário logado: o supabase-js chama com a anon key como bearer
// (JWT válido do projeto, passa no verify_jwt) e a função nunca chama
// `auth.getUser()`. É de propósito — baixar uma isca gratuita não pode criar
// conta nem pedir login.
//
// O e-mail com o PDF NÃO sai daqui: a landing já entrega o link do bucket
// público direto depois do envio. Esta function só registra o lead.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function limpar(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não suportado." }, 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Corpo inválido." }, 400);

    // Honeypot: campo invisível no form. Bot preenche, humano não. Responde
    // sucesso falso pra não sinalizar que foi barrado.
    if (limpar((body as Record<string, unknown>).website, 200)) {
      return json({ ok: true });
    }

    const nome = limpar((body as Record<string, unknown>).nome, 120);
    const email = limpar((body as Record<string, unknown>).email, 200).toLowerCase();
    const telefone = limpar((body as Record<string, unknown>).telefone, 40) || null;
    const origem = limpar((body as Record<string, unknown>).origem, 60) || "landing-ebook";
    const leadMagnet = limpar((body as Record<string, unknown>).leadMagnet, 80) || "ebook-abrir-negocio";
    const r = ((body as Record<string, unknown>).respostas ?? {}) as Record<string, unknown>;

    const q_momento = limpar(r.momento, 200);
    const q_vontade = limpar(r.vontade, 200);
    const q_tem_ideia = limpar(r.temIdeia, 200);
    const q_capital_giro = limpar(r.capitalGiro, 200);
    const q_prazo = limpar(r.prazo, 200);

    if (!nome) return json({ error: "Informe seu nome." }, 400);
    if (!EMAIL_RE.test(email)) return json({ error: "E-mail inválido." }, 400);
    if (!q_momento || !q_vontade || !q_tem_ideia || !q_capital_giro || !q_prazo) {
      return json({ error: "Responda as 5 perguntas antes de baixar." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await admin.from("lead_magnet_leads").insert({
      lead_magnet: leadMagnet,
      nome,
      email,
      telefone,
      q_momento,
      q_vontade,
      q_tem_ideia,
      q_capital_giro,
      q_prazo,
      origem,
      user_agent: limpar(req.headers.get("user-agent"), 400) || null,
    });
    if (error) throw error;

    return json({ ok: true });
  } catch (e) {
    console.error("lead-capturar", e);
    return json({ error: (e as Error).message ?? "Erro inesperado" }, 500);
  }
});
