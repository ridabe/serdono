import { useEffect, useState } from "react";
import { getCategoriaComMateriais, type CategoriaComMateriais } from "@serdono/supabase";

/** Uma categoria + seus materiais (assuntos), pra tela de drill-down (SDD-60). */
export function useDicasCategoria(categoriaId: string | undefined) {
  const [categoria, setCategoria] = useState<CategoriaComMateriais | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoriaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        setCategoria(await getCategoriaComMateriais(categoriaId));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoriaId]);

  return { categoria, loading, error };
}
