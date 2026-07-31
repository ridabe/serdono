import { useEffect, useState } from "react";
import {
  advanceFase,
  getContatosCliente,
  getMetaCaptacaoSalva,
  savePrimeiraVenda,
  SLUG_PRIMEIRA_VENDA_REGISTRO,
  type JornadaClienteContato,
  type JornadaEtapa,
  type JornadaInstance,
  type MetaCaptacaoDados,
  type PrimeiraVendaDados,
} from "@serdono/supabase";

/**
 * Fase Primeira Venda (SDD-47). Reaproveita os contatos já marcados
 * `cliente` na Fase Clientes (sempre não-vazio aqui, SDD-45) em vez de pedir
 * pra cadastrar do zero — o sistema nunca pode "saber" que uma venda
 * aconteceu, então o registro é sempre uma ação manual do empreendedor.
 * Diferente de Financeiro/Produto, salvar o registro já marca a etapa como
 * concluída (mesmo espírito de `saveMetaCaptacao`).
 */
export function usePrimeiraVenda(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const etapa = etapas.find((e) => e.template.slug === SLUG_PRIMEIRA_VENDA_REGISTRO);
  const concluida = etapa?.status === "concluida";

  const [contatosCliente, setContatosCliente] = useState<JornadaClienteContato[]>([]);
  const [metaSalva, setMetaSalva] = useState<MetaCaptacaoDados | null>(null);
  const [contatoId, setContatoId] = useState<string | null>(null);
  const [valor, setValor] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dadosSalvos = etapa?.dados_usuario as unknown as Partial<PrimeiraVendaDados> | undefined;
    if (dadosSalvos) {
      setContatoId(dadosSalvos.contatoId ?? null);
      setValor(dadosSalvos.valor ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa?.id]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [contatos, meta] = await Promise.all([getContatosCliente(jornada.id), getMetaCaptacaoSalva(jornada.id)]);
        if (cancelado) return;
        setContatosCliente(contatos);
        setMetaSalva(meta);
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

  function selecionarContato(id: string) {
    setContatoId((atual) => (atual === id ? null : id));
  }

  async function registrar() {
    setSaving(true);
    setError(null);
    try {
      await savePrimeiraVenda(jornada.id, { contatoId, valor: valor > 0 ? valor : null });
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  /** Diferente do padrão "nada trava" das fases mais recentes (RN-24) — só disponível depois do registro (RN-27). */
  async function advance() {
    if (!concluida) return false;
    setAdvancing(true);
    setError(null);
    try {
      await advanceFase(jornada.id, "organizacao");
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
    concluida,
    contatosCliente,
    metaSalva,
    contatoId,
    selecionarContato,
    valor,
    setValor,
    loading,
    saving,
    registrar,
    advancing,
    advance,
    error,
  };
}
