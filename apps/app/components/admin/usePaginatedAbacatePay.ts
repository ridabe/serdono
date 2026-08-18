import { useCallback, useEffect, useState } from "react";
import type { AbacatePayListResult } from "@serdono/supabase";

/**
 * Paginação por cursor genérica pro Painel Admin AbacatePay — a API deles só
 * dá um cursor "próxima página" (`pagination.next`), sem cursor reverso
 * utilizável pra pular direto pra uma página arbitrária de trás. Em vez de
 * reimplementar isso em cada aba (Produtos/Webhooks/Clientes/Cupons/
 * Assinaturas/Saques/PIX), este hook guarda cada página já buscada num
 * array — "Anterior" nunca refaz a chamada, só troca o índice pro que já
 * está em cache; só "Próxima" busca de verdade quando ainda não tem cache.
 */
export function usePaginatedAbacatePay<T>(
  fetcher: (params: { limit: number; after?: string }) => Promise<AbacatePayListResult<T>>,
  pageSize = 10
) {
  const [pages, setPages] = useState<(T[] | null)[]>([null]);
  const [nextCursors, setNextCursors] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarPagina = useCallback(
    async (index: number, after?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetcher({ limit: pageSize, after });
        setPages((prev) => {
          const copia = [...prev];
          copia[index] = res.data;
          return copia;
        });
        setNextCursors((prev) => {
          const copia = [...prev];
          copia[index] = res.pagination.hasMore ? res.pagination.next : null;
          return copia;
        });
        setPageIndex(index);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetcher, pageSize]
  );

  const refresh = useCallback(() => {
    setPages([null]);
    setNextCursors([null]);
    carregarPagina(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarPagina]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function proxima() {
    const cursor = nextCursors[pageIndex];
    if (!cursor) return;
    if (pages[pageIndex + 1]) {
      setPageIndex(pageIndex + 1);
      return;
    }
    carregarPagina(pageIndex + 1, cursor);
  }

  function anterior() {
    if (pageIndex === 0) return;
    setPageIndex(pageIndex - 1);
  }

  return {
    items: pages[pageIndex] ?? [],
    loading,
    error,
    pageNumber: pageIndex + 1,
    hasNext: !!nextCursors[pageIndex],
    hasPrev: pageIndex > 0,
    proxima,
    anterior,
    refresh,
  };
}
