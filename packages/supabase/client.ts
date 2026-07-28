import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type { Database } from "./types";

// SPEC.md §8, SDD-8: URL e chave pública vêm de env, nunca hardcoded.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

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
