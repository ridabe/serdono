import { useEffect, useState } from "react";
import { getAppVersionRow, updateAppVersion, type AppVersionRow, type UpdateAppVersionParams } from "@serdono/supabase";

const PLATFORM = "android" as const;

export function useAdminVersaoApp() {
  const [versao, setVersao] = useState<AppVersionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setVersao(await getAppVersionRow(PLATFORM));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function salvar(params: UpdateAppVersionParams): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      await updateAppVersion(PLATFORM, params);
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { versao, loading, saving, error, salvar };
}
