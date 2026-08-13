import { useCallback, useEffect, useState } from "react";
import { elegivelAssistenteReuniao } from "@serdono/core";
import {
  cancelarAgendamento as cancelarAgendamentoApi,
  getCurrentSession,
  getMyJornada,
  gerarReuniao,
  listarReunioes,
  salvarAgendamento,
  type GerarReuniaoParams,
  type ReuniaoComAgenda,
  type SalvarAgendamentoParams,
} from "@serdono/supabase";

export type ReuniaoView = "lista" | "formulario" | "resultado";

/**
 * Estado da tela do Assistente de Reunião — elegibilidade, lista de guias já
 * gerados (histórico, mais recente primeiro), geração de um novo guia e
 * agenda (V2 fatia 1, 12/08/2026: agendar/reagendar/cancelar a partir de um
 * guia já gerado). Sem trava mensal (diferente dos outros módulos de IA): o
 * usuário pode gerar quantos guias precisar.
 */
export function useReuniao() {
  const [userId, setUserId] = useState<string | null>(null);
  const [elegivel, setElegivel] = useState(false);
  const [reunioes, setReunioes] = useState<ReuniaoComAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ReuniaoView>("lista");
  const [reuniaoSelecionada, setReuniaoSelecionada] = useState<ReuniaoComAgenda | null>(null);

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

  /** Atualiza uma reunião tanto na lista quanto na seleção corrente, sem novo fetch completo. */
  function atualizarReuniaoLocal(atualizada: ReuniaoComAgenda) {
    setReunioes((atual) => atual.map((r) => (r.id === atualizada.id ? atualizada : r)));
    setReuniaoSelecionada((atual) => (atual?.id === atualizada.id ? atualizada : atual));
  }

  async function gerar(params: GerarReuniaoParams): Promise<boolean> {
    setGerando(true);
    setError(null);
    try {
      const reuniao = await gerarReuniao(params);
      const comAgenda: ReuniaoComAgenda = { ...reuniao, agendamento: null };
      setReunioes((atual) => [comAgenda, ...atual]);
      setReuniaoSelecionada(comAgenda);
      setView("resultado");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setGerando(false);
    }
  }

  async function agendar(reuniaoId: string, params: SalvarAgendamentoParams): Promise<boolean> {
    setAgendando(true);
    setError(null);
    try {
      const agendamento = await salvarAgendamento(reuniaoId, params);
      const base = reunioes.find((r) => r.id === reuniaoId) ?? reuniaoSelecionada;
      if (base) atualizarReuniaoLocal({ ...base, agendamento });
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAgendando(false);
    }
  }

  async function cancelarAgendamento(reuniaoId: string): Promise<boolean> {
    setAgendando(true);
    setError(null);
    try {
      await cancelarAgendamentoApi(reuniaoId);
      const base = reunioes.find((r) => r.id === reuniaoId) ?? reuniaoSelecionada;
      if (base) atualizarReuniaoLocal({ ...base, agendamento: null });
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAgendando(false);
    }
  }

  function abrirReuniao(reuniao: ReuniaoComAgenda) {
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

  return {
    loading,
    gerando,
    agendando,
    error,
    elegivel,
    reunioes,
    view,
    reuniaoSelecionada,
    gerar,
    agendar,
    cancelarAgendamento,
    abrirReuniao,
    novaReuniao,
    voltarParaLista,
  };
}
