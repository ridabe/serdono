import { useCallback, useEffect, useState } from "react";
import { camposValidos, gerarClausulas, tituloResumo, type CamposContrato, type ClausulaContrato, type TipoContrato } from "@serdono/core";
import {
  criarContrato,
  enviarContratoPorEmail,
  getCurrentSession,
  getMyJornada,
  listarContratos,
  type ContratoRow,
} from "@serdono/supabase";

export type ContratoView = "lista" | "formulario" | "revisao" | "detalhe";

export interface PrefillNegocio {
  nome: string;
  documento: string;
}

/**
 * Estado da tela do Assistente de Contrato (pedido do dono do produto,
 * 17/08/2026). Diferente de todo módulo de IA do produto: `salvar` chama
 * `criarContrato` direto (insert client→Postgres), sem Edge Function — a
 * geração do texto (`gerarClausulas`) roda 100% local, sem chamada de
 * rede, o que permite uma tela de revisão instantânea antes de salvar.
 * Sem trava mensal — cada contrato gerado é uma linha nova no histórico.
 */
export function useContrato() {
  const [userId, setUserId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<PrefillNegocio | null>(null);
  const [contratos, setContratos] = useState<ContratoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ContratoView>("lista");

  const [tipoRevisao, setTipoRevisao] = useState<TipoContrato | null>(null);
  const [camposRevisao, setCamposRevisao] = useState<CamposContrato | null>(null);
  const [clausulasRevisao, setClausulasRevisao] = useState<ClausulaContrato[]>([]);
  const [contratoSelecionado, setContratoSelecionado] = useState<ContratoRow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setUserId(session.user.id);
        setContratos(await listarContratos(session.user.id));

        const jornada = await getMyJornada(session.user.id);
        if (jornada) {
          const nome = jornada.nome_empresa_escolhido || jornada.nome_negocio || "";
          setPrefill({ nome, documento: jornada.cnpj ?? "" });
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setContratos(await listarContratos(userId));
  }, [userId]);

  function novoContrato() {
    setError(null);
    setView("formulario");
  }

  /** Só monta a prévia local (sem chamada de rede) — nada é salvo até `confirmarSalvar`. */
  function revisar(tipo: TipoContrato, campos: CamposContrato): boolean {
    if (!camposValidos(tipo, campos)) {
      setError("Preencha todos os campos obrigatórios com dados válidos antes de continuar.");
      return false;
    }
    setError(null);
    setTipoRevisao(tipo);
    setCamposRevisao(campos);
    setClausulasRevisao(gerarClausulas(tipo, campos));
    setView("revisao");
    return true;
  }

  async function confirmarSalvar(): Promise<boolean> {
    if (!userId || !tipoRevisao || !camposRevisao) return false;
    setSalvando(true);
    setError(null);
    try {
      const contrato = await criarContrato({
        userId,
        tipo: tipoRevisao,
        titulo: tituloResumo(tipoRevisao, camposRevisao),
        campos: camposRevisao,
      });
      setContratos((atual) => [contrato, ...atual]);
      setContratoSelecionado(contrato);
      setView("detalhe");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function enviarPorEmail(contratoId: string, email: string): Promise<boolean> {
    setEnviando(true);
    setError(null);
    try {
      const atualizado = await enviarContratoPorEmail(contratoId, email);
      setContratos((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
      setContratoSelecionado((atual) => (atual?.id === atualizado.id ? atualizado : atual));
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  function abrirContrato(contrato: ContratoRow) {
    setContratoSelecionado(contrato);
    setView("detalhe");
  }

  function voltarParaLista() {
    setError(null);
    setContratoSelecionado(null);
    setTipoRevisao(null);
    setCamposRevisao(null);
    setView("lista");
  }

  function voltarParaFormulario() {
    setError(null);
    setView("formulario");
  }

  return {
    loading,
    salvando,
    enviando,
    error,
    prefill,
    contratos,
    view,
    tipoRevisao,
    camposRevisao,
    clausulasRevisao,
    contratoSelecionado,
    novoContrato,
    revisar,
    confirmarSalvar,
    enviarPorEmail,
    abrirContrato,
    voltarParaLista,
    voltarParaFormulario,
    recarregar,
  };
}
