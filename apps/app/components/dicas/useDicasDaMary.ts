import { useEffect, useState } from "react";
import { listCategoriasComMateriais, type CategoriaComMateriais } from "@serdono/supabase";

export function useDicasDaMary() {
  const [categorias, setCategorias] = useState<CategoriaComMateriais[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setCategorias(await listCategoriasComMateriais());
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { categorias, loading, error };
}
