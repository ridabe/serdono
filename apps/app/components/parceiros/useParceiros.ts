import { useEffect, useMemo, useState } from "react";
import { getParceirosSugeridos, type FornecedorParceiro } from "@serdono/supabase";

/** Módulo Parceiros e Fornecedores (pedido do dono do produto, 08/08/2026) — lista completa, sem gate de fase/nicho da Jornada, com filtro por categoria. */
export function useParceiros() {
  const [parceiros, setParceiros] = useState<FornecedorParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // `getParceirosSugeridos(null)` já existente (SDD-41) — sem nicho,
        // devolve todos os `ativo = true`, ordenados por nome.
        setParceiros(await getParceirosSugeridos(null));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categorias = useMemo(() => {
    const unicas = new Set(parceiros.map((p) => p.categoria));
    return Array.from(unicas).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [parceiros]);

  const parceirosFiltrados = useMemo(() => {
    if (!categoriaSelecionada) return parceiros;
    return parceiros.filter((p) => p.categoria === categoriaSelecionada);
  }, [parceiros, categoriaSelecionada]);

  return {
    loading,
    error,
    categorias,
    categoriaSelecionada,
    setCategoriaSelecionada,
    parceiros: parceirosFiltrados,
  };
}

export type { FornecedorParceiro };
