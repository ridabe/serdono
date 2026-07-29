import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getAppVersionInfo, type AppVersionInfo } from "@serdono/supabase";

export type UpdateStatus = "up-to-date" | "optional" | "required";

interface UseAppVersionResult {
  status: UpdateStatus;
  latestVersion: string | null;
  releaseNotes: string | null;
  storeUrl: string | null;
}

const UP_TO_DATE: UseAppVersionResult = {
  status: "up-to-date",
  latestVersion: null,
  releaseNotes: null,
  storeUrl: null,
};

// Só existe verificação de update forçado/opcional na build nativa Android
// (RN-x pendente de registro no PRD) — web/iOS não passam por Play Store.
const INSTALLED_VERSION_CODE = (Constants.expoConfig?.android?.versionCode as number | undefined) ?? 0;

export function useAppVersion(): UseAppVersionResult {
  const [row, setRow] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    getAppVersionInfo("android")
      .then(setRow)
      .catch(() => {}); // config indisponível não deve travar o app
  }, []);

  if (Platform.OS !== "android" || !row) return UP_TO_DATE;

  let status: UpdateStatus = "up-to-date";
  if (INSTALLED_VERSION_CODE < row.min_version_code) {
    status = row.force_update ? "required" : "optional";
  } else if (INSTALLED_VERSION_CODE < row.current_version_code) {
    status = "optional";
  }

  return {
    status,
    latestVersion: row.current_version,
    releaseNotes: row.release_notes,
    storeUrl: row.store_url,
  };
}
