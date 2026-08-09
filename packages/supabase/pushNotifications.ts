import { supabase } from "./client";
import type { Tables } from "./types";

/** Opt-in de notificação push (pedido do dono do produto, 08/08/2026). */

export type UserPushToken = Tables<"user_push_tokens">;

export async function registerPushToken(userId: string, expoPushToken: string, platform: "android" | "ios"): Promise<void> {
  const { error } = await supabase
    .from("user_push_tokens")
    .upsert({ user_id: userId, expo_push_token: expoPushToken, platform }, { onConflict: "expo_push_token" });
  if (error) throw error;
}

export async function removePushToken(expoPushToken: string): Promise<void> {
  const { error } = await supabase.from("user_push_tokens").delete().eq("expo_push_token", expoPushToken);
  if (error) throw error;
}

export async function listMyPushTokens(userId: string): Promise<UserPushToken[]> {
  const { data, error } = await supabase.from("user_push_tokens").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}

/** Manda uma notificação de teste pra si mesmo — usado pelo botão "Testar aviso" no Perfil. */
export async function enviarPushTeste(): Promise<void> {
  const { error } = await supabase.functions.invoke("enviar-push", {
    body: { titulo: "Tudo certo!", corpo: "Assim que eu tiver uma novidade, aviso por aqui." },
  });
  if (error) throw error;
}
