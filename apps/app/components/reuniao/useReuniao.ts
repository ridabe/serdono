import { useCallback, useEffect, useState } from "react";
import { elegivelAssistenteReuniao } from "@serdono/core";
import {
  cancelarAgendamento as cancelarAgendamentoApi,
  enviarConviteReuniao,
  getCurrentSession,
  getMyJornada,
  gerarReuniao,
  listarReunioes,
  salvarAgendamento,
  salvarResultadoReuniao,
  type GerarReuniaoParams,
  type ReuniaoComAgenda,
  type SalvarAgendamentoParams,
  type SalvarResultadoParams,
} from "@serdono/supabase";

export type ReuniaoView = "lista" | "formulario" | "resultado";

/**
 * Estado da tela do Assistente de Reunião — elegibilidade, lista de guias já
 * gerados (histórico, mais recente primeiro), geração de um novo guia,
 * agenda (V2 fatia 1: agendar/reagendar/cancelar), convite por e-mail
 * (V2 fatia 3) e resultado da reunião (13/08/2026: registrar/editar se deu
 * certo e o que ficou combinado, independente de ter usado a agenda). Sem
 * trava mensal (diferente dos outros módulos de IA): o usuário pode gerar
 * quantos guias precisar.
 */
export function useReuniao() {
  const [userId, setUserId] = useState<string | null>(null);
  const [elegivel, setElegivel] = useState(false);
  const [reunioes, setReunioes] = useState<ReuniaoComAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [salvandoResultado, setSalvandoResultado] = useState(false);
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
      const nova: ReuniaoComAgenda = { ...reuniao, agendamento: null, resultado: null };
      setReunioes((atual) => [nova, ...atual]);
      setReuniaoSelecionada(nova);
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

  async function enviarConvite(reuniaoId: string): Promise<boolean> {
    setEnviandoConvite(true);
    setError(null);
    try {
      const agendamento = await enviarConviteReuniao(reuniaoId);
      const base = reunioes.find((r) => r.id === reuniaoId) ?? reuniaoSelecionada;
      if (base) atualizarReuniaoLocal({ ...base, agendamento });
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setEnviandoConvite(false);
    }
  }

  async function salvarResultado(reuniaoId: string, params: SalvarResultadoParams): Promise<boolean> {
    setSalvandoResultado(true);
    setError(null);
    try {
      const resultado = await salvarResultadoReuniao(reuniaoId, params);
      const base = reunioes.find((r) => r.id === reuniaoId) ?? reuniaoSelecionada;
      if (base) atualizarReuniaoLocal({ ...base, resultado });
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSalvandoResultado(false);
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
    enviandoConvite,
    salvandoResultado,
    error,
    elegivel,
    reunioes,
    view,
    reuniaoSelecionada,
    gerar,
    agendar,
    cancelarAgendamento,
    enviarConvite,
    salvarResultado,
    abrirReuniao,
    novaReuniao,
    voltarParaLista,
  };
}
