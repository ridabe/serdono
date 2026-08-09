import { useEffect, useState } from "react";
import { getCurrentSession, listPlanosAcaoHistorico, type PlanoAcaoComItens } from "@serdono/supabase";

export const MAX_PLANOS_COMPARACAO = 3;

export function useHistoricoPlanoAcao() {
  const [planos, setPlanos] = useState<PlanoAcaoComItens[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setPlanos(await listPlanosAcaoHistorico(session.user.id));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function alternarSelecao(planoId: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(planoId)) {
        proximo.delete(planoId);
      } else if (proximo.size < MAX_PLANOS_COMPARACAO) {
        proximo.add(planoId);
      }
      return proximo;
    });
  }

  return { planos, loading, error, selecionados, alternarSelecao };
}
