import { useCallback, useEffect, useMemo, useState } from "react";
import { elegivelPlanoAcao, primeiroDiaMesAtualISO, type JornadaFaseCore } from "@serdono/core";
import {
  getCurrentSession,
  getMyJornada,
  getPlanoDoMes,
  gerarPlanoAcao,
  toggleItemPlanoAcao,
  type PlanoAcaoComItens,
} from "@serdono/supabase";

/**
 * Estado da tela principal do módulo Plano de Ação Mensal. Elegibilidade
 * (RN nova, PRD §12.9) e o plano do mês corrente (se já tiver sido gerado)
 * — histórico e comparação vivem em `useHistoricoPlanoAcao.ts`, tela
 * separada.
 */
export function usePlanoAcao() {
  const [userId, setUserId] = useState<string | null>(null);
  const [elegivel, setElegivel] = useState(false);
  const [plano, setPlano] = useState<PlanoAcaoComItens | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mesAtual = useMemo(() => primeiroDiaMesAtualISO(), []);

  const carregar = useCallback(
    async (uid: string, faseAtual: JornadaFaseCore | "concluida" | null, jornadaExiste: boolean) => {
      const podeUsar = elegivelPlanoAcao(jornadaExiste, faseAtual);
      setElegivel(podeUsar);
      if (!podeUsar) {
        setPlano(null);
        return;
      }
      setPlano(await getPlanoDoMes(uid, mesAtual));
    },
    [mesAtual]
  );

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setUserId(session.user.id);
        const jornada = await getMyJornada(session.user.id);
        await carregar(session.user.id, (jornada?.fase_atual as JornadaFaseCore | "concluida" | undefined) ?? null, !!jornada);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [carregar]);

  async function gerar() {
    if (!userId) return;
    setGerando(true);
    setError(null);
    try {
      setPlano(await gerarPlanoAcao());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGerando(false);
    }
  }

  /** Otimista — a marcação é instantânea na tela e só reverte se a gravação falhar. */
  async function marcarItem(itemId: string, concluido: boolean) {
    if (!plano) return;
    const anterior = plano;
    setPlano({ ...plano, itens: plano.itens.map((i) => (i.id === itemId ? { ...i, concluido } : i)) });
    try {
      await toggleItemPlanoAcao(itemId, concluido);
    } catch (e) {
      setPlano(anterior);
      setError((e as Error).message);
    }
  }

  return { loading, gerando, error, elegivel, plano, mesAtual, gerar, marcarItem };
}
