import { supabase } from "./client";
import type { Tables } from "./types";

export interface AppVersionInfo {
  current_version: string;
  current_version_code: number;
  min_version_code: number;
  force_update: boolean;
  store_url: string | null;
  release_notes: string | null;
}

export async function getAppVersionInfo(platform: "android" | "ios"): Promise<AppVersionInfo | null> {
  const { data, error } = await supabase
    .from("app_versions")
    .select("current_version, current_version_code, min_version_code, force_update, store_url, release_notes")
    .eq("platform", platform)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---- Admin (SDD-84 — tela "Versão do App") ----

export type AppVersionRow = Tables<"app_versions">;

export async function getAppVersionRow(platform: "android" | "ios"): Promise<AppVersionRow | null> {
  const { data, error } = await supabase.from("app_versions").select("*").eq("platform", platform).maybeSingle();
  if (error) throw error;
  return data;
}

export interface UpdateAppVersionParams {
  current_version: string;
  current_version_code: number;
  min_version_code: number;
  force_update: boolean;
  store_url: string | null;
  release_notes: string | null;
}

export async function updateAppVersion(platform: "android" | "ios", params: UpdateAppVersionParams): Promise<void> {
  const { error } = await supabase.from("app_versions").update(params).eq("platform", platform);
  if (error) throw error;
}
