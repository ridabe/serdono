import { useState } from "react";
import {
  advanceFase,
  chooseRegimeFormalizacao,
  markEtapaDone,
  unmarkEtapaDone,
  type JornadaEtapa,
  type JornadaInstance,
  type RegimeFormalizacao,
} from "@serdono/supabase";

const SLUG_REGIME = "formalizacao_regime";

/**
 * Fase 5 — Formalização (SDD-38). Diferente das fases anteriores, nenhuma
 * etapa aqui trava outra: o empreendedor precisa poder ir e voltar,
 * inclusive desmarcar uma etapa já concluída pra refazer — o progresso
 * (razão simples concluídas/total) já reflete isso sozinho, sem lógica extra.
 */
export function useFormalizacao(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const [choosingRegime, setChoosingRegime] = useState<RegimeFormalizacao | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const etapaRegime = etapas.find((e) => e.template.slug === SLUG_REGIME);
  const regime = (jornada.regime_formalizacao as RegimeFormalizacao | null) ?? null;

  const etapasCaminho = etapas
    .filter((e) => e.template.slug !== SLUG_REGIME && e.template.aplica_se === regime)
    .sort((a, b) => a.template.ordem - b.template.ordem);

  async function chooseRegime(novoRegime: RegimeFormalizacao) {
    setChoosingRegime(novoRegime);
    setError(null);
    try {
      await chooseRegimeFormalizacao(jornada.id, novoRegime);
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChoosingRegime(null);
    }
  }

  async function toggleEtapa(etapa: JornadaEtapa) {
    setTogglingSlug(etapa.template.slug);
    setError(null);
    try {
      if (etapa.status === "concluida") {
        await unmarkEtapaDone(jornada.id, etapa.template.slug);
      } else {
        await markEtapaDone(jornada.id, etapa.template.slug);
      }
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTogglingSlug(null);
    }
  }

  const checklistComplete = etapasCaminho.length > 0 && etapasCaminho.every((e) => e.status === "concluida");

  async function advance() {
    setAdvancing(true);
    setError(null);
    try {
      await advanceFase(jornada.id, "financeiro");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAdvancing(false);
    }
  }

  return {
    etapaRegime,
    regime,
    etapasCaminho,
    choosingRegime,
    chooseRegime,
    togglingSlug,
    toggleEtapa,
    checklistComplete,
    advancing,
    advance,
    error,
  };
}
