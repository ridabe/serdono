import { useEffect, useMemo, useState } from "react";
import { calcularMetaCaptacao, metaCaptacaoPadrao, type MetaCaptacaoInputs } from "@serdono/core";
import {
  addJornadaClienteContato,
  advanceFase,
  calcularCriteriosConclusao,
  generateOfertaComercial,
  getOfertaComercial,
  listJornadaClientesContatos,
  removeJornadaClienteContato,
  saveMetaCaptacao,
  updateJornadaClienteContatoStatus,
  type ClienteContatoStatus,
  type JornadaClienteContato,
  type JornadaClienteContatoInput,
  type JornadaEtapa,
  type JornadaInstance,
  type OfertaComercial,
} from "@serdono/supabase";

const SLUG_CLIENTES_META = "clientes_meta";

/**
 * Fase Clientes — Captação de Clientes (SDD-45, MVP). Diferente de toda fase
 * desde Financeiro (RN-24, "nada trava"), o avanço aqui é BLOQUEADO até os 7
 * critérios reais de `calcularCriteriosConclusao` serem atendidos — mesmo
 * espírito de Formalização (RN-23).
 */
export function useClientes(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const etapa = etapas.find((e) => e.template.slug === SLUG_CLIENTES_META);
  const metaDefinida = etapa?.status === "concluida";

  const [metaInputs, setMetaInputs] = useState<MetaCaptacaoInputs>(metaCaptacaoPadrao());
  const [savingMeta, setSavingMeta] = useState(false);

  const [oferta, setOferta] = useState<OfertaComercial | null>(null);
  const [generatingOferta, setGeneratingOferta] = useState(false);

  const [contatos, setContatos] = useState<JornadaClienteContato[]>([]);
  const [addingContato, setAddingContato] = useState(false);
  const [updatingContatoId, setUpdatingContatoId] = useState<string | null>(null);
  const [removingContatoId, setRemovingContatoId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshContatos() {
    setContatos(await listJornadaClientesContatos(jornada.id));
  }

  useEffect(() => {
    const dadosSalvos = etapa?.dados_usuario as unknown as Partial<MetaCaptacaoInputs> | undefined;
    if (dadosSalvos && dadosSalvos.metaClientes != null) {
      setMetaInputs(dadosSalvos as MetaCaptacaoInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa?.id]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [ofertaSalva, contatosAtuais] = await Promise.all([
          getOfertaComercial(jornada.id),
          listJornadaClientesContatos(jornada.id),
        ]);
        if (cancelado) return;
        setOferta(ofertaSalva);
        setContatos(contatosAtuais);
      } catch (e) {
        if (!cancelado) setError((e as Error).message);
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jornada.id]);

  const resultado = useMemo(() => calcularMetaCaptacao(metaInputs), [metaInputs]);

  function updateMetaInput<K extends keyof MetaCaptacaoInputs>(campo: K, valor: number) {
    setMetaInputs((prev) => ({ ...prev, [campo]: Number.isFinite(valor) ? valor : 0 }));
  }

  async function salvarMeta() {
    setSavingMeta(true);
    setError(null);
    try {
      await saveMetaCaptacao(jornada.id, metaInputs);
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingMeta(false);
    }
  }

  async function gerarOferta() {
    setGeneratingOferta(true);
    setError(null);
    try {
      setOferta(await generateOfertaComercial(jornada.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGeneratingOferta(false);
    }
  }

  async function adicionarContato(input: JornadaClienteContatoInput) {
    setAddingContato(true);
    setError(null);
    try {
      await addJornadaClienteContato(jornada.id, input);
      await refreshContatos();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAddingContato(false);
    }
  }

  async function atualizarStatusContato(id: string, status: ClienteContatoStatus) {
    setUpdatingContatoId(id);
    setError(null);
    try {
      await updateJornadaClienteContatoStatus(id, status);
      await refreshContatos();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdatingContatoId(null);
    }
  }

  async function removerContato(id: string) {
    setRemovingContatoId(id);
    setError(null);
    try {
      await removeJornadaClienteContato(id);
      await refreshContatos();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemovingContatoId(null);
    }
  }

  const criterios = calcularCriteriosConclusao(
    metaDefinida,
    oferta !== null,
    contatos,
    resultado.contatosNecessarios,
    metaInputs.metaClientes
  );

  /** Diferente de toda fase desde Financeiro: só disponível quando `criterios.todosAtendidos`. */
  async function advance() {
    if (!criterios.todosAtendidos) return false;
    setAdvancing(true);
    setError(null);
    try {
      await advanceFase(jornada.id, "primeira_venda");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAdvancing(false);
    }
  }

  return {
    loading,
    metaInputs,
    updateMetaInput,
    resultado,
    salvarMeta,
    savingMeta,
    metaDefinida,
    oferta,
    generatingOferta,
    gerarOferta,
    contatos,
    addingContato,
    adicionarContato,
    updatingContatoId,
    atualizarStatusContato,
    removingContatoId,
    removerContato,
    criterios,
    advancing,
    advance,
    error,
  };
}
