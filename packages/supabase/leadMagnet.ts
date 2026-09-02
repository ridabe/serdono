import { supabase } from "./client";

/**
 * Captura de lead da landing pública do e-book (`/ebook`, SDD-139).
 *
 * Chama a Edge Function `lead-capturar` sem exigir sessão — o supabase-js
 * manda a anon key como bearer, que já passa no `verify_jwt`. A function
 * grava em `lead_magnet_leads` com service_role (a tabela não tem policy de
 * INSERT pra ninguém — essa é a única porta de entrada).
 *
 * **Lança** com mensagem amigável em caso de validação/erro — diferente de
 * `enviarEmailBoasVindas`, aqui o envio É o passo (sem ele a pessoa não
 * chega no download), então a tela precisa saber que falhou.
 */
export interface LeadMagnetRespostas {
  /** "Qual seu momento hoje?" */
  momento: string;
  /** "Você tem vontade de empreender?" */
  vontade: string;
  /** "Já tem uma ideia de negócio?" */
  temIdeia: string;
  /** "Tem capital de giro pra começar?" */
  capitalGiro: string;
  /** "Pra quando é esse plano?" */
  prazo: string;
}

export interface CapturarLeadInput {
  nome: string;
  email: string;
  telefone?: string;
  respostas: LeadMagnetRespostas;
  /** Slug da isca — default 'ebook-abrir-negocio'. */
  leadMagnet?: string;
  origem?: string;
  /** Honeypot anti-bot: campo escondido no form, sempre "" pra humano. */
  website?: string;
}

export async function capturarLeadMagnet(input: CapturarLeadInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke("lead-capturar", { body: input });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw new Error("Não consegui registrar seus dados agora. Tente de novo em instantes.");
  }
  if (data && typeof data === "object" && "error" in data) {
    throw new Error((data as { error: string }).error);
  }
}
