import { useEffect, useState } from "react";
import {
  advanceFase,
  getNicheEstruturaInfo,
  isEtapaEstruturaRelevante,
  markEtapaDone,
  unmarkEtapaDone,
  type JornadaEtapa,
  type JornadaInstance,
  type NicheEstruturaInfo,
} from "@serdono/supabase";

/**
 * Fase 7 — Estrutura (SDD-40). Duas diferenças em relação às fases
 * anteriores: (1) o avanço para Marketing nunca fica bloqueado pelo
 * checklist — o empreendedor pode voltar aqui a qualquer momento, mesmo já
 * estando em outra fase, pra marcar o que resolveu; (2) os itens são
 * divididos em essenciais/opcionais conforme o nicho escolhido
 * (`isEtapaEstruturaRelevante`), pra não cobrar do usuário algo que não se
 * aplica ao próprio tipo de negócio.
 */
export function useEstrutura(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const [niche, setNiche] = useState<NicheEstruturaInfo | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!jornada.niche_id) return;
      try {
        const data = await getNicheEstruturaInfo(jornada.niche_id);
        if (!cancelado) setNiche(data);
      } catch (e) {
        if (!cancelado) setError((e as Error).message);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [jornada.niche_id]);

  const etapasOrdenadas = [...etapas].sort((a, b) => a.template.ordem - b.template.ordem);
  const itensEssenciais = etapasOrdenadas.filter((e) => isEtapaEstruturaRelevante(e.template, niche));
  const itensOpcionais = etapasOrdenadas.filter((e) => !isEtapaEstruturaRelevante(e.template, niche));

  const concluidos = itensEssenciais.filter((e) => e.status === "concluida").length;
  const checklistComplete = itensEssenciais.length > 0 && concluidos === itensEssenciais.length;

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

  /** Sempre disponível, independente do checklist — nada trava o avanço de fase aqui. */
  async function advance() {
    setAdvancing(true);
    setError(null);
    try {
      await advanceFase(jornada.id, "fornecedores");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAdvancing(false);
    }
  }

  return {
    itensEssenciais,
    itensOpcionais,
    concluidos,
    checklistComplete,
    togglingSlug,
    toggleEtapa,
    advancing,
    advance,
    error,
  };
}
