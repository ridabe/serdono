import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addCliente,
  addInteracao,
  generateRoteiroReaproximacao,
  getCicloRecompra,
  getMyJornada,
  getCurrentSession,
  getRoteiroReaproximacao,
  importarClientesDaJornada,
  listClientesComHistorico,
  removeCliente,
  saveCicloRecompra,
  type ClienteComHistorico,
  type RetencaoClienteInput,
  type RetencaoInteracaoInput,
  type RoteiroReaproximacao,
} from "@serdono/supabase";
import {
  calcularResumoRetencao,
  classificarCliente,
  hojeISO,
  ordenarPorAtencao,
  type ClienteClassificado,
  type ResumoRetencao,
} from "@serdono/core";

export interface ClienteNaTela extends ClienteComHistorico {
  situacao: ClienteClassificado["situacao"];
  diasSemContato: number | null;
}

/**
 * Estado do módulo Retenção de Clientes (SDD-54).
 *
 * Mesma divisão de responsabilidade das telas de fase da Jornada: aqui só
 * orquestração (carregar, salvar, recarregar); toda a conta de "quem sumiu"
 * vem de `packages/core/retencao.ts` (SDD-3).
 */
export function useRetencao() {
  const [userId, setUserId] = useState<string | null>(null);
  const [jornadaInstanceId, setJornadaInstanceId] = useState<string | null>(null);
  const [ciclo, setCiclo] = useState<number | null>(null);
  const [clientes, setClientes] = useState<ClienteComHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async (uid: string) => {
    const [cicloSalvo, carteira] = await Promise.all([getCicloRecompra(uid), listClientesComHistorico(uid)]);
    setCiclo(cicloSalvo);
    setClientes(carteira);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setUserId(session.user.id);
        const jornada = await getMyJornada(session.user.id);
        setJornadaInstanceId(jornada?.id ?? null);
        await carregar(session.user.id);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [carregar]);

  async function recarregar() {
    if (!userId) return;
    try {
      await carregar(userId);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /**
   * A classificação só existe depois que o empreendedor informa o ciclo do
   * negócio dele — sem esse número o módulo não afirma que ninguém sumiu
   * (PRD §4). Até lá a tela mostra a carteira crua e pede o ciclo.
   */
  const { classificados, resumo } = useMemo(() => {
    if (ciclo == null) {
      return { classificados: [] as ClienteClassificado[], resumo: null as ResumoRetencao | null };
    }
    const hoje = hojeISO();
    const lista = clientes.map((c) =>
      classificarCliente({ id: c.id, ultimaInteracaoEm: c.ultimaInteracaoEm, totalCompras: c.totalCompras }, ciclo, hoje)
    );
    return {
      classificados: lista,
      resumo: calcularResumoRetencao(
        lista,
        clientes.map((c) => ({ id: c.id, ultimaInteracaoEm: c.ultimaInteracaoEm, totalCompras: c.totalCompras }))
      ),
    };
  }, [clientes, ciclo]);

  /** Carteira já na ordem de atenção, com a situação embutida em cada cliente. */
  const clientesNaTela: ClienteNaTela[] = useMemo(() => {
    const porId = new Map(clientes.map((c) => [c.id, c]));
    if (ciclo == null) {
      return clientes.map((c) => ({ ...c, situacao: "sem_historico" as const, diasSemContato: null }));
    }
    return ordenarPorAtencao(classificados).flatMap((cl) => {
      const cliente = porId.get(cl.id);
      return cliente ? [{ ...cliente, situacao: cl.situacao, diasSemContato: cl.diasSemContato }] : [];
    });
  }, [classificados, clientes, ciclo]);

  async function definirCiclo(dias: number) {
    if (!userId) return;
    setSalvando(true);
    setError(null);
    try {
      await saveCicloRecompra(userId, dias);
      setCiclo(dias);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function cadastrarCliente(input: RetencaoClienteInput) {
    if (!userId) return;
    setSalvando(true);
    setError(null);
    try {
      await addCliente(userId, input);
      await carregar(userId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCliente(id: string) {
    setSalvando(true);
    setError(null);
    try {
      await removeCliente(id);
      await recarregar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function registrarInteracao(clienteId: string, input: RetencaoInteracaoInput) {
    setSalvando(true);
    setError(null);
    try {
      await addInteracao(clienteId, input);
      await recarregar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function importarDaJornada(): Promise<{ importados: number; jaExistiam: number } | null> {
    if (!userId || !jornadaInstanceId) return null;
    setSalvando(true);
    setError(null);
    try {
      const resultado = await importarClientesDaJornada(userId, jornadaInstanceId);
      await carregar(userId);
      return resultado;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setSalvando(false);
    }
  }

  async function carregarRoteiro(clienteId: string): Promise<RoteiroReaproximacao | null> {
    try {
      return await getRoteiroReaproximacao(clienteId);
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }

  async function gerarRoteiro(clienteId: string): Promise<RoteiroReaproximacao | null> {
    setError(null);
    try {
      return await generateRoteiroReaproximacao(clienteId);
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }

  return {
    loading,
    salvando,
    error,
    ciclo,
    /** Só existe quando a pessoa fez a Jornada — habilita o botão de importar. */
    podeImportar: jornadaInstanceId != null,
    clientes: clientesNaTela,
    resumo,
    definirCiclo,
    cadastrarCliente,
    excluirCliente,
    registrarInteracao,
    importarDaJornada,
    carregarRoteiro,
    gerarRoteiro,
  };
}
