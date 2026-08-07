import { supabase } from "./client";

/**
 * Dispara o e-mail de boas-vindas do usuário recém-cadastrado (SDD-70).
 *
 * **Nunca lança e nunca bloqueia o cadastro.** O e-mail é um acessório do
 * fluxo, não uma etapa dele: se o provedor estiver fora do ar, a conta já foi
 * criada e a pessoa precisa entrar mesmo assim. Uma falha aqui vira log, não
 * mensagem de erro na tela — é o oposto do que acontecia com a confirmação
 * nativa do Supabase, que travava a pessoa esperando um passo que ela não
 * entendia (o motivo de ela ter sido desligada).
 *
 * A idempotência é responsabilidade do servidor (`users.welcome_email_enviado_em`),
 * não deste chamador — chamar duas vezes é seguro.
 *
 * Nenhum dado é passado no corpo: a Edge Function descobre quem é o usuário
 * pelo JWT da sessão. Em particular, **a senha não trafega** (SDD-71).
 */
export async function enviarEmailBoasVindas(): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("enviar-email-boas-vindas");
    if (error) console.warn("[boas-vindas] envio falhou:", error.message);
  } catch (e) {
    console.warn("[boas-vindas] envio falhou:", (e as Error).message);
  }
}
