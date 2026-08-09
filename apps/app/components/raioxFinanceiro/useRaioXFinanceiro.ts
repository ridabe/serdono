import { useEffect, useMemo, useState } from "react";
import { elegivelRaioXFinanceiro, primeiroDiaMesAtualISO, somaDespesas } from "@serdono/core";
import {
  addDespesaDiaria,
  criarFechamentoMensal,
  getCurrentSession,
  getFechamentoDoMes,
  getMyJornada,
  listDespesasDoMes,
  listUltimosFechamentos,
  removerDespesaDiaria,
  type DespesaDiariaRow,
  type FechamentoMensalRow,
} from "@serdono/supabase";

/** Estado da tela do Raio-X Financeiro — elegibilidade, despesas do mês corrente, fechamento (se já feito) e histórico pro comparativo. */
export function useRaioXFinanceiro() {
  const [userId, setUserId] = useState<string | null>(null);
  const [elegivel, setElegivel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [despesas, setDespesas] = useState<DespesaDiariaRow[]>([]);
  const [fechamento, setFechamento] = useState<FechamentoMensalRow | null>(null);
  const [historico, setHistorico] = useState<FechamentoMensalRow[]>([]);

  const [salvandoDespesa, setSalvandoDespesa] = useState(false);
  const [fechandoMes, setFechandoMes] = useState(false);

  const mesAtual = useMemo(() => primeiroDiaMesAtualISO(), []);

  async function carregarDespesasEHistorico(uid: string) {
    const [despesasCarregadas, fechamentoAtual, ultimosFechamentos] = await Promise.all([
      listDespesasDoMes(uid, mesAtual),
      getFechamentoDoMes(uid, mesAtual),
      listUltimosFechamentos(uid),
    ]);
    setDespesas(despesasCarregadas);
    setFechamento(fechamentoAtual);
    setHistorico(ultimosFechamentos);
  }

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setUserId(session.user.id);
        const jornada = await getMyJornada(session.user.id);
        const podeUsar = elegivelRaioXFinanceiro(!!jornada);
        setElegivel(podeUsar);
        if (podeUsar) await carregarDespesasEHistorico(session.user.id);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesAtual]);

  /** Soma de todas as despesas lançadas neste mês — usada como sugestão inicial do campo "Quanto gastou?" no fechamento. */
  const somaDespesasDoMes = somaDespesas(despesas);

  async function adicionarDespesa(params: { data: string; tipo: string; descricao?: string; valor: number }): Promise<boolean> {
    if (!userId) return false;
    setSalvandoDespesa(true);
    setError(null);
    try {
      const nova = await addDespesaDiaria({ userId, ...params });
      setDespesas((atual) => [nova, ...atual]);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSalvandoDespesa(false);
    }
  }

  async function removerDespesa(id: string) {
    setError(null);
    try {
      await removerDespesaDiaria(id);
      setDespesas((atual) => atual.filter((d) => d.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function fecharMes(params: { faturamento: number; despesas: number; retiradaSocio: number }): Promise<boolean> {
    if (!userId) return false;
    setFechandoMes(true);
    setError(null);
    try {
      const novo = await criarFechamentoMensal({ userId, mesReferencia: mesAtual, ...params });
      setFechamento(novo);
      setHistorico((atual) => [novo, ...atual]);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setFechandoMes(false);
    }
  }

  return {
    loading,
    error,
    elegivel,
    mesAtual,
    despesas,
    somaDespesasDoMes,
    fechamento,
    historico,
    salvandoDespesa,
    fechandoMes,
    adicionarDespesa,
    removerDespesa,
    fecharMes,
  };
}
