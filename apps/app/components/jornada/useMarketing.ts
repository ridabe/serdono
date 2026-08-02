import { useEffect, useState } from "react";
import {
  avancarParaProximaFasePendente,
  generateMarketingConteudo,
  getMarketingConteudo,
  markEtapaDone,
  unmarkEtapaDone,
  type JornadaEtapa,
  type JornadaInstance,
  type MarketingConteudo,
} from "@serdono/supabase";

/**
 * Fase 10 — Marketing (SDD-43). Checklist de 5 canais (mesmo padrão
 * não-bloqueante da Estrutura, SDD-40 — nenhuma etapa trava outra nem trava
 * o avanço) + geração de bio/posts/anúncios, que o usuário pode disparar de
 * novo sempre que quiser (não é uma etapa, é um entregável regenerável).
 */
export function useMarketing(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const etapasOrdenadas = [...etapas].sort((a, b) => a.template.ordem - b.template.ordem);

  const [conteudo, setConteudo] = useState<MarketingConteudo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const salvo = await getMarketingConteudo(jornada.id);
        if (!cancelado) setConteudo(salvo);
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

  async function gerarConteudo() {
    setGenerating(true);
    setError(null);
    try {
      setConteudo(await generateMarketingConteudo(jornada.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
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

  const concluidos = etapasOrdenadas.filter((e) => e.status === "concluida").length;

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
    etapasOrdenadas,
    concluidos,
    togglingSlug,
    toggleEtapa,
    conteudo,
    loading,
    generating,
    gerarConteudo,
    advancing,
    advance,
    error,
  };
}
