import { useCallback, useEffect, useState } from "react";
import { elegivelAssistenteReuniao } from "@serdono/core";
import { getCurrentSession, getMyJornada, gerarReuniao, listarReunioes, type GerarReuniaoParams, type ReuniaoRow } from "@serdono/supabase";

export type ReuniaoView = "lista" | "formulario" | "resultado";

/**
 * Estado da tela do Assistente de Reunião — elegibilidade, lista de guias já
 * gerados (histórico, mais recente primeiro) e geração de um novo guia.
 * Sem trava mensal (diferente dos outros módulos de IA): o usuário pode
 * gerar quantos guias precisar.
 */
export function useReuniao() {
  const [userId, setUserId] = useState<string | null>(null);
  const [elegivel, setElegivel] = useState(false);
  const [reunioes, setReunioes] = useState<ReuniaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ReuniaoView>("lista");
  const [reuniaoSelecionada, setReuniaoSelecionada] = useState<ReuniaoRow | null>(null);

  const carregar = useCallback(async (uid: string, jornadaExiste: boolean) => {
    const podeUsar = elegivelAssistenteReuniao(jornadaExiste);
    setElegivel(podeUsar);
    if (!podeUsar) return;
    setReunioes(await listarReunioes(uid));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setUserId(session.user.id);
        const jornada = await getMyJornada(session.user.id);
        await carregar(session.user.id, !!jornada);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [carregar]);

  async function gerar(params: GerarReuniaoParams): Promise<boolean> {
    setGerando(true);
    setError(null);
    try {
      const reuniao = await gerarReuniao(params);
      setReunioes((atual) => [reuniao, ...atual]);
      setReuniaoSelecionada(reuniao);
      setView("resultado");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setGerando(false);
    }
  }

  function abrirReuniao(reuniao: ReuniaoRow) {
    setReuniaoSelecionada(reuniao);
    setView("resultado");
  }

  function novaReuniao() {
    setError(null);
    setView("formulario");
  }

  function voltarParaLista() {
    setReuniaoSelecionada(null);
    setView("lista");
  }

  return { loading, gerando, error, elegivel, reunioes, view, reuniaoSelecionada, gerar, abrirReuniao, novaReuniao, voltarParaLista };
}
