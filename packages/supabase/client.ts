import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";
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
