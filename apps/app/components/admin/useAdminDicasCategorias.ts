import { useEffect, useState } from "react";
import {
  createCategoria,
  deleteCategoria,
  listCategoriasAdmin,
  updateCategoria,
  type CategoriaInput,
  type DicasCategoria,
} from "@serdono/supabase";

export function useAdminDicasCategorias() {
  const [categorias, setCategorias] = useState<DicasCategoria[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setCategorias(await listCategoriasAdmin());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(input: CategoriaInput) {
    setSaving(true);
    setError(null);
    try {
      await createCategoria({ ordem: categorias.length, ...input });
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, input: Partial<CategoriaInput>) {
    setSaving(true);
    setError(null);
    try {
      await updateCategoria(id, input);
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(categoria: DicasCategoria) {
    await update(categoria.id, { ativo: !categoria.ativo });
  }

  async function remove(id: string) {
    setError(null);
    try {
      await deleteCategoria(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /** Troca a `ordem` entre duas categorias adjacentes — reordenação simples, sem lib de drag-and-drop. */
  async function mover(id: string, direcao: "cima" | "baixo") {
    const i = categorias.findIndex((c) => c.id === id);
    const j = direcao === "cima" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= categorias.length) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all([
        updateCategoria(categorias[i].id, { ordem: categorias[j].ordem }),
        updateCategoria(categorias[j].id, { ordem: categorias[i].ordem }),
      ]);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const filtro = query.trim().toLowerCase();
  const filtered = filtro
    ? categorias.filter((c) => c.titulo.toLowerCase().includes(filtro) || c.descricao.toLowerCase().includes(filtro))
    : categorias;

  return {
    categorias: filtered,
    buscando: filtro.length > 0,
    query,
    setQuery,
    loading,
    saving,
    error,
    create,
    update,
    toggleAtivo,
    remove,
    mover,
  };
}
