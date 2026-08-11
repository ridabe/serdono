import { useEffect, useState } from "react";
import { createModule, listModules, setModuleAtivo, trocarOrdemModules, type ModuleRow } from "@serdono/supabase";

export function useAdminModules() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [query, setQuery] = useState("");
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

  /** Sobe (`direcao: -1`) ou desce (`direcao: 1`) um módulo na ordem do menu, trocando `ordem` com o vizinho. */
  async function mover(module: ModuleRow, direcao: -1 | 1) {
    const i = modules.findIndex((m) => m.id === module.id);
    const vizinho = modules[i + direcao];
    if (!vizinho) return;
    setError(null);
    try {
      await trocarOrdemModules({ id: module.id, ordem: module.ordem }, { id: vizinho.id, ordem: vizinho.ordem });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const filtro = query.trim().toLowerCase();
  const filtered = filtro
    ? modules.filter((m) => m.nome.toLowerCase().includes(filtro) || (m.descricao ?? "").toLowerCase().includes(filtro))
    : modules;

  return {
    modules: filtered,
    buscando: filtro.length > 0,
    query,
    setQuery,
    loading,
    saving,
    error,
    create,
    toggleAtivo,
    mover,
  };
}
