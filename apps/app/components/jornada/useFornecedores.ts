import { useEffect, useState } from "react";
import {
  addJornadaFornecedor,
  advanceFase,
  generateRoteiroFornecedores,
  getParceirosSugeridos,
  getRoteiroFornecedores,
  markEtapaDone,
  removeJornadaFornecedor,
  unmarkEtapaDone,
  listJornadaFornecedores,
  type FornecedorParceiro,
  type JornadaEtapa,
  type JornadaFornecedor,
  type JornadaFornecedorInput,
  type JornadaInstance,
  type RoteiroFornecedoresCategoria,
} from "@serdono/supabase";

const SLUG_FORNECEDORES_LISTA = "fornecedores_lista";

/**
 * Fase 8 — Fornecedores (SDD-41). Três blocos independentes: (1) roteiro de
 * busca gerado por IA — só categorias e critério, nunca nome de empresa
 * inventado; (2) parceiros sugeridos da base curada pelo admin (filtro por
 * nicho, sem embedding — RAG fica pra quando a base tiver conteúdo); (3) a
 * lista pessoal que o empreendedor monta. Mesmo espírito "nada trava" das
 * fases anteriores (RN-23/RN-24) — concluir é manual, avançar nunca é
 * bloqueado pela lista estar vazia ou incompleta.
 */
export function useFornecedores(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const etapa = etapas.find((e) => e.template.slug === SLUG_FORNECEDORES_LISTA);

  const [roteiro, setRoteiro] = useState<RoteiroFornecedoresCategoria[] | null>(null);
  const [parceiros, setParceiros] = useState<FornecedorParceiro[]>([]);
  const [lista, setLista] = useState<JornadaFornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingRoteiro, setGeneratingRoteiro] = useState(false);
  const [addingFornecedor, setAddingFornecedor] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshLista() {
    setLista(await listJornadaFornecedores(jornada.id));
  }

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [roteiroSalvo, parceirosSugeridos, listaAtual] = await Promise.all([
          getRoteiroFornecedores(jornada.id),
          getParceirosSugeridos(jornada.niche_id),
          listJornadaFornecedores(jornada.id),
        ]);
        if (cancelado) return;
        setRoteiro(roteiroSalvo);
        setParceiros(parceirosSugeridos);
        setLista(listaAtual);
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

  async function gerarRoteiro() {
    setGeneratingRoteiro(true);
    setError(null);
    try {
      setRoteiro(await generateRoteiroFornecedores(jornada.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGeneratingRoteiro(false);
    }
  }

  async function adicionarFornecedor(input: JornadaFornecedorInput) {
    setAddingFornecedor(true);
    setError(null);
    try {
      await addJornadaFornecedor(jornada.id, input);
      await refreshLista();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setAddingFornecedor(false);
    }
  }

  /** Atalho pra transformar um parceiro sugerido direto num item da lista pessoal, já com os dados preenchidos. */
  async function adicionarParceiro(parceiro: FornecedorParceiro) {
    return adicionarFornecedor({
      categoria: parceiro.categoria,
      nome_fornecedor: parceiro.nome,
      contato: parceiro.contato ?? undefined,
      parceiro_id: parceiro.id,
      origem: "parceiro",
    });
  }

  async function removerFornecedor(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await removeJornadaFornecedor(id);
      await refreshLista();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemovingId(null);
    }
  }

  async function toggleConcluido() {
    setToggling(true);
    setError(null);
    try {
      if (etapa?.status === "concluida") {
        await unmarkEtapaDone(jornada.id, SLUG_FORNECEDORES_LISTA);
      } else {
        await markEtapaDone(jornada.id, SLUG_FORNECEDORES_LISTA);
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
      await advanceFase(jornada.id, "produto");
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
    roteiro,
    parceiros,
    lista,
    loading,
    generatingRoteiro,
    gerarRoteiro,
    addingFornecedor,
    adicionarFornecedor,
    adicionarParceiro,
    removingId,
    removerFornecedor,
    toggling,
    toggleConcluido,
    advancing,
    advance,
    error,
  };
}
