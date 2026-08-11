// Ser Dono — Registro de uso de IA (tokens por chamada), consumido pelo
// Dashboard Admin (card "Tokens de IA", mesma funcionalidade já existente no
// admin do StrivePersonal — pedido explícito do dono do produto).
//
// Best-effort de propósito: uma falha aqui NUNCA pode derrubar a geração de
// conteúdo real do usuário — é telemetria, não parte do contrato da function.

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export interface IaUsageParams {
  userId: string;
  /** Slug da Edge Function que fez a chamada, ex. "jornada-gerar-nomes". */
  funcao: string;
  provider: "anthropic" | "openai";
  modelo: string;
  /** Ausente/null quando o provedor não devolveu contagem pra essa chamada — nunca estimamos. */
  inputTokens?: number | null;
  outputTokens?: number | null;
  /** Chamadas não medidas em token (ex.: 1 imagem gerada) — padrão 1. */
  unidades?: number;
}

export async function logIaUsage(supabase: SupabaseClient, params: IaUsageParams): Promise<void> {
  try {
    const { error } = await supabase.from("ia_usage_logs").insert({
      user_id: params.userId,
      funcao: params.funcao,
      provider: params.provider,
      modelo: params.modelo,
      input_tokens: params.inputTokens ?? null,
      output_tokens: params.outputTokens ?? null,
      unidades: params.unidades ?? 1,
    });
    if (error) throw error;
  } catch (e) {
    console.error(`Falha ao registrar uso de IA de "${params.funcao}" (seguindo sem bloquear):`, e);
  }
}
