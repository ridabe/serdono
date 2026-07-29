import { Platform } from "react-native";
import { supabase } from "./client";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

/**
 * Fora da web, `skipBrowserRedirect` evita que o supabase-js tente navegar o
 * app inteiro para a URL do provider — o caller abre essa URL numa aba de
 * auth (expo-web-browser) e trata o retorno via deep link manualmente.
 */
export async function signInWithGoogle(redirectTo: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
