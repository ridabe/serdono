import { useEffect, useState } from "react";
import { createModule, listModules, setModuleAtivo, type ModuleRow } from "@serdono/supabase";

export function useAdminModules() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setModules(await listModules());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(params: { slug: string; nome: string; descricao?: string }) {
    setSaving(true);
    setError(null);
    try {
      await createModule(params);
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(module: ModuleRow) {
    setError(null);
    try {
      await setModuleAtivo(module.id, !module.ativo);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return { modules, loading, saving, error, create, toggleAtivo };
}
