import { useEffect, useState } from "react";
import {
  advanceFase,
  generateDeliverables,
  getDeliverables,
  updateValidacaoInputs,
  type JornadaDeliverable,
  type JornadaDeliverableTipo,
  type JornadaInstance,
} from "@serdono/supabase";

const DOC_TIPOS: JornadaDeliverableTipo[] = ["persona", "swot", "canvas", "proposta_valor"];

/**
 * Fase 2 — Validação da Ideia (SDD-32). Checklist é sempre derivado de dado
 * real (RN-9), nunca um toggle manual: público/concorrentes/diferenciais
 * viram ✓ quando o campo está preenchido; persona/produto validado viram ✓
 * quando os documentos de IA correspondentes existem.
 */
export function useValidacaoIdeia(jornada: JornadaInstance) {
  const [publicoAlvo, setPublicoAlvo] = useState(jornada.publico_alvo ?? "");
  const [concorrentes, setConcorrentes] = useState(jornada.concorrentes ?? "");
  const [diferenciais, setDiferenciais] = useState(jornada.diferenciais ?? "");
  const [deliverables, setDeliverables] = useState<JornadaDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [advancing, setAdvancing] = useState(false);
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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const hasDoc = (tipo: JornadaDeliverableTipo) => deliverables.some((d) => d.tipo === tipo);
  const allDocsReady = DOC_TIPOS.every(hasDoc);

  const checklist = [
    { label: "Público definido", done: publicoAlvo.trim().length > 0 },
    { label: "Persona criada", done: hasDoc("persona") },
    { label: "Concorrentes pesquisados", done: concorrentes.trim().length > 0 },
    { label: "Diferenciais definidos", done: diferenciais.trim().length > 0 },
    { label: "Produto validado", done: allDocsReady },
  ];
  const checklistComplete = checklist.every((item) => item.done);

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
  };
}
