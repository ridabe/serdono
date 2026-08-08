import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";
import type { Database } from "./types";

// SPEC.md §8, SDD-8/SDD-14: URL e chave pública vêm de env, nunca hardcoded.
// Lidas via app.config.js -> extra -> expo-constants (SDD-14: o inlining
// EXPO_PUBLIC_* via `expo/virtual/env` se mostrou instável no dev web do SDK 54).
const extra = Constants.expoConfig?.extra ?? {};
const url = (extra.supabaseUrl as string | undefined) ?? "";
const anonKey = (extra.supabaseAnonKey as string | undefined) ?? "";

// Web usa localStorage (padrão do supabase-js); iOS/Android precisam de um
// adapter explícito — RN não tem storage persistente embutido no client.
const storage = Platform.OS === "web" ? undefined : AsyncStorage;

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

// `autoRefreshToken` sozinho não basta no nativo: o timer de refresh do
// supabase-js não sobrevive de forma confiável ao app ir pra segundo plano
// (o SO suspende timers em Android/iOS) — recomendação oficial do Supabase
// pra React Native é acionar o refresh manualmente pelo ciclo de vida do
// app. Sem isso, o token expira em silêncio enquanto o app fica minimizado
// e a primeira chamada a uma Edge Function depois volta com 401 "Sessão
// inválida" (achado testando a Fase 2 da Jornada no Expo Go, SDD-77).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
