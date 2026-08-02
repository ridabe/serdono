import { useEffect, useMemo, useState } from "react";
import { calcularPrecificacao, type PrecificacaoInputs, type PrecificacaoResultado } from "@serdono/core";
import {
  avancarParaProximaFasePendente,
  getParceirosDesenvolvimento,
  markEtapaDone,
  saveProdutoDados,
  unmarkEtapaDone,
  type FornecedorParceiro,
  type JornadaEtapa,
  type JornadaInstance,
} from "@serdono/supabase";
import { baixarModeloPlanilhaProduto } from "./produtoTemplateCsv";

const SLUG_PRODUTO_CADASTRO = "produto_cadastro";

const INPUTS_PADRAO: PrecificacaoInputs = {
  custo: 0,
  despesasVariaveisPct: 10,
  impostosPct: 6,
  margemDesejadaPct: 20,
};

/**
 * Fase 9 — Produto (SDD-42). Sem chamada de IA — calculadora 100% local
 * (mesmo espírito de `useFinanceiro.ts`: resposta instantânea a cada valor
 * testado) + download de planilha-modelo + sugestão do parceiro
 * desenvolvedor (se algum estiver marcado `indicado_desenvolvimento` na
 * base de parceiros, SDD-41).
 */
export function useProduto(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const etapa = etapas.find((e) => e.template.slug === SLUG_PRODUTO_CADASTRO);
  const dadosSalvos = etapa?.dados_usuario as unknown as Partial<PrecificacaoInputs> | undefined;

  const [inputs, setInputs] = useState<PrecificacaoInputs>({
    custo: dadosSalvos?.custo ?? INPUTS_PADRAO.custo,
    despesasVariaveisPct: dadosSalvos?.despesasVariaveisPct ?? INPUTS_PADRAO.despesasVariaveisPct,
    impostosPct: dadosSalvos?.impostosPct ?? INPUTS_PADRAO.impostosPct,
    margemDesejadaPct: dadosSalvos?.margemDesejadaPct ?? INPUTS_PADRAO.margemDesejadaPct,
  });
  const [parceirosDev, setParceirosDev] = useState<FornecedorParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const parceiros = await getParceirosDesenvolvimento();
        if (!cancelado) setParceirosDev(parceiros);
      } catch (e) {
        if (!cancelado) setError((e as Error).message);
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const resultado: PrecificacaoResultado = useMemo(() => calcularPrecificacao(inputs), [inputs]);

  function updateInput<K extends keyof PrecificacaoInputs>(campo: K, valor: number) {
    setInputs((prev) => ({ ...prev, [campo]: Number.isFinite(valor) ? valor : 0 }));
  }

  async function salvar() {
    setSaving(true);
    setError(null);
    try {
      await saveProdutoDados(jornada.id, inputs);
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function baixarModelo() {
    setBaixando(true);
    setError(null);
    try {
      await baixarModeloPlanilhaProduto();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBaixando(false);
    }
  }

  async function toggleConcluido() {
    setToggling(true);
    setError(null);
    try {
      await saveProdutoDados(jornada.id, inputs);
      if (etapa?.status === "concluida") {
        await unmarkEtapaDone(jornada.id, SLUG_PRODUTO_CADASTRO);
      } else {
        await markEtapaDone(jornada.id, SLUG_PRODUTO_CADASTRO);
      }
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setToggling(false);
    }
  }

  /** Sempre disponível — nada trava o avanço de fase aqui. */
  async function advance() {
    setAdvancing(true);
    setError(null);
    try {
      await avancarParaProximaFasePendente(jornada.id);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAdvancing(false);
    }
  }

  return {
    etapa,
    inputs,
    updateInput,
    resultado,
    salvar,
    saving,
    baixarModelo,
    baixando,
    parceirosDev,
    loading,
    toggling,
    toggleConcluido,
    advancing,
    advance,
    error,
  };
}
