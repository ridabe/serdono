import { useEffect, useMemo, useState } from "react";
import { calcularMaturidadeOrganizacional, PERGUNTAS_DIAGNOSTICO, type MaturidadeResultado } from "@serdono/core";
import {
  CATALOGO_INDICADORES,
  concludeJornada,
  generateRoteiroFerramentas,
  getRoteiroFerramentas,
  saveOrganizacaoChecklistFinal,
  saveOrganizacaoDiagnostico,
  SLUG_ORGANIZACAO_CHECKLIST_FINAL,
  SLUG_ORGANIZACAO_DIAGNOSTICO,
  type CategoriaFerramenta,
  type JornadaEtapa,
  type JornadaInstance,
  type OrganizacaoChecklistFinalDados,
  type OrganizacaoDiagnosticoDados,
} from "@serdono/supabase";
import { baixarModeloOrganizacao, type ModeloOrganizacao } from "./organizacaoTemplatesCsv";
import { exportPlanoOrganizacaoPdf } from "./organizacaoPlanoPdf";

const MAX_INDICADORES = 5;

/**
 * Fase Organização do Negócio (SDD-48). Guia de gestão pós-primeira-venda —
 * sem virar ERP: nenhuma operação real é armazenada, só o diagnóstico, as
 * escolhas do empreendedor e o plano gerado a partir delas.
 */
export function useOrganizacao(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const etapaDiagnostico = etapas.find((e) => e.template.slug === SLUG_ORGANIZACAO_DIAGNOSTICO);
  const etapaChecklistFinal = etapas.find((e) => e.template.slug === SLUG_ORGANIZACAO_CHECKLIST_FINAL);
  const diagnosticoConcluido = etapaDiagnostico?.status === "concluida";
  const checklistFinalConcluido = etapaChecklistFinal?.status === "concluida";

  const [respostas, setRespostas] = useState<Record<string, boolean>>({});
  const [savingDiagnostico, setSavingDiagnostico] = useState(false);

  const [roteiroFerramentas, setRoteiroFerramentas] = useState<CategoriaFerramenta[] | null>(null);
  const [generatingFerramentas, setGeneratingFerramentas] = useState(false);

  const [indicadoresSelecionados, setIndicadoresSelecionados] = useState<string[]>([]);
  const [savingChecklist, setSavingChecklist] = useState(false);

  const [baixandoModelo, setBaixandoModelo] = useState<ModeloOrganizacao | null>(null);
  const [baixandoPlano, setBaixandoPlano] = useState(false);

  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dadosSalvos = etapaDiagnostico?.dados_usuario as unknown as OrganizacaoDiagnosticoDados | undefined;
    if (dadosSalvos?.respostas) {
      setRespostas(Object.fromEntries(dadosSalvos.respostas.map((r) => [r.id, r.resposta])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaDiagnostico?.id]);

  useEffect(() => {
    const dadosSalvos = etapaChecklistFinal?.dados_usuario as unknown as OrganizacaoChecklistFinalDados | undefined;
    if (dadosSalvos?.indicadoresSelecionados) {
      setIndicadoresSelecionados(dadosSalvos.indicadoresSelecionados);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaChecklistFinal?.id]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const roteiro = await getRoteiroFerramentas(jornada.id);
        if (!cancelado) setRoteiroFerramentas(roteiro);
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

  const todasRespondidas = PERGUNTAS_DIAGNOSTICO.every((p) => respostas[p.id] != null);

  const maturidade: MaturidadeResultado | null = useMemo(() => {
    if (!todasRespondidas) return null;
    return calcularMaturidadeOrganizacional(PERGUNTAS_DIAGNOSTICO.map((p) => ({ id: p.id, resposta: respostas[p.id] })));
  }, [respostas, todasRespondidas]);

  function responderPergunta(id: string, resposta: boolean) {
    setRespostas((prev) => ({ ...prev, [id]: resposta }));
  }

  async function salvarDiagnostico() {
    if (!todasRespondidas) return;
    setSavingDiagnostico(true);
    setError(null);
    try {
      await saveOrganizacaoDiagnostico(jornada.id, {
        respostas: PERGUNTAS_DIAGNOSTICO.map((p) => ({ id: p.id, resposta: respostas[p.id] })),
      });
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingDiagnostico(false);
    }
  }

  async function gerarFerramentas() {
    setGeneratingFerramentas(true);
    setError(null);
    try {
      setRoteiroFerramentas(await generateRoteiroFerramentas(jornada.id, maturidade?.nivel ?? 1));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGeneratingFerramentas(false);
    }
  }

  function toggleIndicador(id: string) {
    setIndicadoresSelecionados((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_INDICADORES) return prev;
      return [...prev, id];
    });
  }

  async function salvarChecklistFinal() {
    setSavingChecklist(true);
    setError(null);
    try {
      await saveOrganizacaoChecklistFinal(jornada.id, { indicadoresSelecionados });
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingChecklist(false);
    }
  }

  async function baixarModelo(tipo: ModeloOrganizacao) {
    setBaixandoModelo(tipo);
    setError(null);
    try {
      await baixarModeloOrganizacao(tipo);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBaixandoModelo(null);
    }
  }

  async function baixarPlano() {
    setBaixandoPlano(true);
    setError(null);
    try {
      await exportPlanoOrganizacaoPdf(
        jornada.nome_empresa_escolhido ?? "Meu negócio",
        maturidade?.nivelLabel ?? "Não avaliado",
        maturidade?.prioridades ?? []
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBaixandoPlano(false);
    }
  }

  /**
   * Diferente do padrão "nada trava" das fases mais recentes — precisa do
   * diagnóstico e da confirmação final (mesmo espírito de RN-27, Primeira
   * Venda). Organização é a última fase real do motor (SDD-49) — concluir
   * aqui fecha a jornada inteira, não avança pra outra fase.
   */
  async function advance() {
    if (!diagnosticoConcluido || !checklistFinalConcluido) return false;
    setAdvancing(true);
    setError(null);
    try {
      await concludeJornada(jornada.id);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAdvancing(false);
    }
  }

  return {
    respostas,
    responderPergunta,
    todasRespondidas,
    maturidade,
    diagnosticoConcluido,
    salvarDiagnostico,
    savingDiagnostico,
    roteiroFerramentas,
    gerarFerramentas,
    generatingFerramentas,
    catalogoIndicadores: CATALOGO_INDICADORES,
    indicadoresSelecionados,
    toggleIndicador,
    maxIndicadores: MAX_INDICADORES,
    checklistFinalConcluido,
    salvarChecklistFinal,
    savingChecklist,
    baixarModelo,
    baixandoModelo,
    baixarPlano,
    baixandoPlano,
    loading,
    advancing,
    advance,
    error,
  };
}
