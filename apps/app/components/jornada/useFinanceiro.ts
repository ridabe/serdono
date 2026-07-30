import { useEffect, useMemo, useState } from "react";
import {
  calcularPlanejamentoFinanceiro,
  estimarCapitalDaFaixa,
  sugerirPlanejamentoFinanceiro,
  type FinanceiroInputs,
  type FinanceiroResultado,
} from "@serdono/core";
import {
  advanceFase,
  markEtapaDone,
  saveFinanceiroDados,
  supabase,
  unmarkEtapaDone,
  type JornadaEtapa,
  type JornadaInstance,
} from "@serdono/supabase";

const SLUG_FINANCEIRO_PLANEJAMENTO = "financeiro_planejamento";
const CAPITAL_PADRAO_SEM_DIAGNOSTICO = 10_000;

/**
 * Fase Financeiro — Planejamento Financeiro (SDD-39). Nenhuma chamada de
 * IA: os 6 blocos (investimento, capital de giro, reserva, ponto de
 * equilíbrio, fluxo de caixa, lucro esperado) são recalculados localmente a
 * cada mudança de input, via `packages/core/financeiro.ts` — é o que dá a
 * "resposta imediata" pedida, e permite o usuário testar quantos valores
 * quiser sem gastar nada.
 */
export function useFinanceiro(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const etapa = etapas.find((e) => e.template.slug === SLUG_FINANCEIRO_PLANEJAMENTO);

  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<FinanceiroInputs | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const dadosSalvos = etapa?.dados_usuario as unknown as Partial<FinanceiroInputs> | undefined;
        if (dadosSalvos && dadosSalvos.capitalDisponivel != null) {
          if (!cancelado) setInputs(dadosSalvos as FinanceiroInputs);
          return;
        }

        let nicho: Parameters<typeof sugerirPlanejamentoFinanceiro>[1] = null;
        if (jornada.niche_id) {
          const { data } = await supabase
            .from("niches")
            .select("investimento_min, investimento_max, tempo_ate_equilibrio_meses, margem_tipica_pct")
            .eq("id", jornada.niche_id)
            .maybeSingle();
          if (data) {
            nicho = {
              investimentoMin: data.investimento_min,
              investimentoMax: data.investimento_max,
              tempoAteEquilibrioMeses: data.tempo_ate_equilibrio_meses,
              margemTipicaPct: data.margem_tipica_pct,
            };
          }
        }

        const { data: diagnostico } = await supabase
          .from("diagnostic_responses")
          .select("capital_disponivel")
          .eq("user_id", jornada.user_id)
          .maybeSingle();

        const capitalEstimado = estimarCapitalDaFaixa(diagnostico?.capital_disponivel ?? null) ?? CAPITAL_PADRAO_SEM_DIAGNOSTICO;
        if (!cancelado) setInputs(sugerirPlanejamentoFinanceiro(capitalEstimado, nicho));
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

  // Recálculo 100% local — nenhuma rede envolvida, é o que garante resposta
  // instantânea a cada valor que o usuário testar.
  const resultado: FinanceiroResultado | null = useMemo(
    () => (inputs ? calcularPlanejamentoFinanceiro(inputs) : null),
    [inputs]
  );

  function updateInput<K extends keyof FinanceiroInputs>(campo: K, valor: number) {
    setInputs((prev) => (prev ? { ...prev, [campo]: Number.isFinite(valor) ? valor : 0 } : prev));
  }

  async function salvar() {
    if (!inputs) return;
    setSaving(true);
    setError(null);
    try {
      await saveFinanceiroDados(jornada.id, inputs);
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleConcluido() {
    if (!inputs) return;
    setToggling(true);
    setError(null);
    try {
      await saveFinanceiroDados(jornada.id, inputs);
      if (etapa?.status === "concluida") {
        await unmarkEtapaDone(jornada.id, SLUG_FINANCEIRO_PLANEJAMENTO);
      } else {
        await markEtapaDone(jornada.id, SLUG_FINANCEIRO_PLANEJAMENTO);
      }
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setToggling(false);
    }
  }

  /**
   * Sempre disponível quando `etapa` está concluída — nada trava aqui.
   * Antes essa chamada vivia direto em `FinanceiroScreen.tsx` com um
   * `catch` que engolia o erro sem avisar ninguém: uma falha (mesmo
   * transitória, ex.: blip de rede) deixava o usuário "travado" na tela sem
   * nenhum feedback (bug real de produção, 30/07/2026). Centralizando aqui,
   * o erro cai em `error` igual a toda outra ação da tela.
   */
  async function advance() {
    setAdvancing(true);
    setError(null);
    try {
      await advanceFase(jornada.id, "estrutura");
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
    inputs,
    updateInput,
    resultado,
    salvar,
    saving,
    etapa,
    toggleConcluido,
    toggling,
    advance,
    advancing,
    error,
  };
}
