import { useCallback, useEffect, useMemo, useState } from "react";
import {
  desmarcarConcluido,
  getCurrentSession,
  getMyJornada,
  getObrigacoesConfig,
  listObrigacoesCatalogo,
  listStatusDoUsuario,
  marcarConcluido,
  saveObrigacoesConfig,
  type ObrigacaoCatalogoRow,
} from "@serdono/supabase";
import {
  classificarStatusObrigacao,
  filtrarObrigacoesAplicaveis,
  hojeISO,
  ordenarPorUrgencia,
  proximaOcorrencia,
  type ObrigacaoCatalogo,
  type RegimeEmpresa,
  type RegraVencimento,
  type StatusObrigacao,
} from "@serdono/core";

export interface ObrigacaoNaTela extends ObrigacaoCatalogo {
  dataVencimento: string | null;
  periodoReferencia: string;
  status: StatusObrigacao;
}

export interface ObrigacoesConfigNaTela {
  regime: RegimeEmpresa;
  temFuncionarios: boolean;
}

/** Converte a linha crua do banco (`packages/supabase`) pro tipo de domínio de `packages/core`. */
function toObrigacaoCatalogo(row: ObrigacaoCatalogoRow): ObrigacaoCatalogo {
  return {
    id: row.id,
    slug: row.slug,
    regime: row.regime as RegimeEmpresa[],
    requerFuncionarios: row.requer_funcionarios,
    nome: row.nome,
    descricao: row.descricao,
    comoFazer: row.como_fazer,
    regraVencimento: row.regra_vencimento as unknown as RegraVencimento,
    fonteUrl: row.fonte_url,
    fonteData: row.fonte_data,
    ordem: row.ordem,
  };
}

/**
 * Estado do módulo Meu Negócio em Dia (SDD-61). Mesma divisão de
 * responsabilidade das demais telas de módulo: aqui só orquestração e a
 * conversão de tipo entre a camada de dados (`packages/supabase`) e a
 * camada de domínio (`packages/core`); toda a conta de data/urgência vem
 * de `packages/core/obrigacoes.ts`.
 */
export function useObrigacoes() {
  const [userId, setUserId] = useState<string | null>(null);
  const [config, setConfig] = useState<ObrigacoesConfigNaTela | null>(null);
  const [sugestaoRegime, setSugestaoRegime] = useState<RegimeEmpresa | null>(null);
  const [catalogo, setCatalogo] = useState<ObrigacaoCatalogo[]>([]);
  const [statusPorChave, setStatusPorChave] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async (uid: string) => {
    const [configSalva, catalogoCompleto, status] = await Promise.all([
      getObrigacoesConfig(uid),
      listObrigacoesCatalogo(),
      listStatusDoUsuario(uid),
    ]);
    setConfig(configSalva ? { regime: configSalva.regime as RegimeEmpresa, temFuncionarios: configSalva.temFuncionarios } : null);
    setCatalogo(catalogoCompleto.map(toObrigacaoCatalogo));
    setStatusPorChave(new Map(status.map((s) => [`${s.obrigacaoId}:${s.periodoReferencia}`, s.concluidoEm])));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setUserId(session.user.id);

        // Best-effort: só sugere MEI (nunca "formal", ambíguo entre simples e
        // presumido/real) quando a Jornada já tiver essa resposta.
        const jornada = await getMyJornada(session.user.id);
        if (jornada?.regime_formalizacao === "mei") setSugestaoRegime("mei");

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

  const obrigacoes: ObrigacaoNaTela[] = useMemo(() => {
    if (!config) return [];
    const hoje = hojeISO();
    const aplicaveis = filtrarObrigacoesAplicaveis(catalogo, config.regime, config.temFuncionarios);
    const comStatus = aplicaveis.map((o) => {
      const { dataVencimento, periodoReferencia } = proximaOcorrencia(o.regraVencimento, hoje);
      const concluidoEm = statusPorChave.get(`${o.id}:${periodoReferencia}`) ?? null;
      return {
        ...o,
        dataVencimento,
        periodoReferencia,
        status: classificarStatusObrigacao(dataVencimento, concluidoEm, hoje),
      };
    });
    return ordenarPorUrgencia(comStatus);
  }, [catalogo, config, statusPorChave]);

  async function definirConfig(regime: RegimeEmpresa, temFuncionarios: boolean) {
    if (!userId) return;
    setSalvando(true);
    setError(null);
    try {
      await saveObrigacoesConfig(userId, { regime, temFuncionarios });
      setConfig({ regime, temFuncionarios });
      await recarregar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function concluirPeriodo(obrigacaoId: string, periodoReferencia: string) {
    if (!userId) return;
    setSalvando(true);
    setError(null);
    try {
      await marcarConcluido(userId, obrigacaoId, periodoReferencia);
      await recarregar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function desfazerConclusao(obrigacaoId: string, periodoReferencia: string) {
    if (!userId) return;
    setSalvando(true);
    setError(null);
    try {
      await desmarcarConcluido(userId, obrigacaoId, periodoReferencia);
      await recarregar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return {
    loading,
    salvando,
    error,
    config,
    sugestaoRegime,
    obrigacoes,
    definirConfig,
    concluirPeriodo,
    desfazerConclusao,
  };
}
