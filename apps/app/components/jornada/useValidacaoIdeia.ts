import { useEffect, useState } from "react";
import {
  advanceFase,
  generateDeliverables,
  getDeliverables,
  markEtapaDone,
  unmarkEtapaDone,
  updateValidacaoInputs,
  type JornadaDeliverable,
  type JornadaEtapa,
  type JornadaInstance,
} from "@serdono/supabase";

const SLUG_CLIENTES_REAIS = "validacao_clientes_reais";

/**
 * Fase 2 — Validação da Ideia (SDD-32/33). O checklist não é mais derivado
 * no client — vem de `jornada_etapas`, a fonte única de verdade de
 * progresso, persistida por etapa (RN-9: nunca só um clique manual pra
 * itens automáticos; para o item manual — conversar com clientes reais — o
 * clique É a própria ação de confirmar que ela foi feita no mundo real).
 */
export function useValidacaoIdeia(
  jornada: JornadaInstance,
  etapas: JornadaEtapa[],
  onEtapasChanged: () => Promise<void>
) {
  const [publicoAlvo, setPublicoAlvo] = useState(jornada.publico_alvo ?? "");
  const [concorrentes, setConcorrentes] = useState(jornada.concorrentes ?? "");
  const [diferenciais, setDiferenciais] = useState(jornada.diferenciais ?? "");
  const [deliverables, setDeliverables] = useState<JornadaDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [togglingClientes, setTogglingClientes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeliverables(jornada.id)
      .then(setDeliverables)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [jornada.id]);

  async function saveInputs() {
    setError(null);
    try {
      await updateValidacaoInputs(jornada.id, {
        publico_alvo: publicoAlvo.trim() || null,
        concorrentes: concorrentes.trim() || null,
        diferenciais: diferenciais.trim() || null,
      });
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      await saveInputs();
      const docs = await generateDeliverables(jornada.id);
      setDeliverables(docs);
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const etapaClientesReais = etapas.find((e) => e.template.slug === SLUG_CLIENTES_REAIS);

  async function toggleClientesReais() {
    if (!etapaClientesReais) return;
    setTogglingClientes(true);
    setError(null);
    try {
      if (etapaClientesReais.status === "concluida") {
        await unmarkEtapaDone(jornada.id, SLUG_CLIENTES_REAIS);
      } else {
        await markEtapaDone(jornada.id, SLUG_CLIENTES_REAIS);
      }
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTogglingClientes(false);
    }
  }

  const checklist = etapas.map((e) => ({
    slug: e.template.slug,
    label: e.template.titulo,
    done: e.status === "concluida",
  }));
  const checklistComplete = etapas.length > 0 && etapas.every((e) => e.status === "concluida");

  async function advance() {
    setAdvancing(true);
    setError(null);
    try {
      await advanceFase(jornada.id, "planejamento");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAdvancing(false);
    }
  }

  return {
    publicoAlvo,
    setPublicoAlvo,
    concorrentes,
    setConcorrentes,
    diferenciais,
    setDiferenciais,
    saveInputs,
    deliverables,
    loading,
    generating,
    generate,
    checklist,
    checklistComplete,
    advancing,
    advance,
    error,
    canGenerate: publicoAlvo.trim().length > 0 && concorrentes.trim().length > 0 && diferenciais.trim().length > 0,
    etapaClientesReais,
    togglingClientes,
    toggleClientesReais,
  };
}
