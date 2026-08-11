import { useEffect, useState } from "react";
import {
  FASE_LABEL,
  FASE_ORDER,
  getDashboardStats,
  getDicasRanking,
  getFornecedoresByCategoria,
  getIaUsagePorDia,
  getIaUsagePorFuncao,
  getIaUsageTotals,
  getJornadaFunnel,
  getModuleAdoption,
  getUserGrowth,
  type AdocaoModulo,
  type CrescimentoDia,
  type DashboardStats,
  type DicaRanking,
  type FornecedorPorCategoria,
  type FunilFase,
  type IaUsageDia,
  type IaUsagePorFuncao,
  type IaUsageTotals,
} from "@serdono/supabase";

export type AlertaSeveridade = "info" | "warning" | "danger";

export interface Alerta {
  severidade: AlertaSeveridade;
  texto: string;
  /** Rota da tela dona do dado por trás do alerta — some o link "Ver →" quando ausente. */
  href?: string;
}

/**
 * Alertas derivados de dado real já buscado pra outros cards — nenhuma fila
 * de aprovação ou log de erro existe hoje no sistema (levantado antes de
 * construir esta tela), então nada aqui é inventado: é leitura de sinal que
 * já está sendo mostrado em algum outro widget da mesma tela.
 */
function derivarAlertas(stats: DashboardStats | null, funil: FunilFase[], modulos: AdocaoModulo[]): Alerta[] {
  const alertas: Alerta[] = [];

  if (stats && stats.usuarios_bloqueados > 0) {
    alertas.push({
      severidade: "danger",
      texto: `${stats.usuarios_bloqueados} usuário${stats.usuarios_bloqueados > 1 ? "s" : ""} bloqueado${stats.usuarios_bloqueados > 1 ? "s" : ""} no sistema.`,
      href: "/admin/usuarios",
    });
  }

  if (funil.length > 1) {
    const porFase = new Map(funil.map((f) => [f.fase, f]));
    const ordenado = FASE_ORDER.map((f) => porFase.get(f)).filter((f): f is FunilFase => !!f && f.total_jornadas > 0);
    let maiorQueda: { de: string; para: string; quedaPP: number } | null = null;
    for (let i = 1; i < ordenado.length; i++) {
      const anterior = ordenado[i - 1];
      const atual = ordenado[i];
      const pctAnterior = (anterior.alcancaram / anterior.total_jornadas) * 100;
      const pctAtual = (atual.alcancaram / atual.total_jornadas) * 100;
      const queda = pctAnterior - pctAtual;
      if (queda > 0 && (!maiorQueda || queda > maiorQueda.quedaPP)) {
        maiorQueda = { de: anterior.fase, para: atual.fase, quedaPP: queda };
      }
    }
    if (maiorQueda && maiorQueda.quedaPP >= 10) {
      alertas.push({
        severidade: "warning",
        texto: `Maior queda da Jornada: ${FASE_LABEL[maiorQueda.de] ?? maiorQueda.de} → ${FASE_LABEL[maiorQueda.para] ?? maiorQueda.para} (-${Math.round(maiorQueda.quedaPP)} p.p.).`,
      });
    }
  }

  if (stats && stats.total_usuarios > 0 && modulos.length > 0) {
    const menorAdocao = [...modulos].sort((a, b) => a.habilitados - b.habilitados)[0];
    const pct = (menorAdocao.habilitados / stats.total_usuarios) * 100;
    if (pct < 30) {
      alertas.push({
        severidade: "info",
        texto: `Módulo "${menorAdocao.modulo}" com baixa adoção — só ${Math.round(pct)}% dos usuários.`,
        href: "/admin/modulos",
      });
    }
  }

  return alertas;
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [crescimento, setCrescimento] = useState<CrescimentoDia[]>([]);
  const [modulos, setModulos] = useState<AdocaoModulo[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorPorCategoria[]>([]);
  const [funil, setFunil] = useState<FunilFase[]>([]);
  const [dicas, setDicas] = useState<DicaRanking[]>([]);
  const [iaTotais, setIaTotais] = useState<IaUsageTotals | null>(null);
  const [iaPorDia, setIaPorDia] = useState<IaUsageDia[]>([]);
  const [iaPorFuncao, setIaPorFuncao] = useState<IaUsagePorFuncao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [
          statsRes,
          crescimentoRes,
          modulosRes,
          fornecedoresRes,
          funilRes,
          dicasRes,
          iaTotaisRes,
          iaPorDiaRes,
          iaPorFuncaoRes,
        ] = await Promise.all([
          getDashboardStats(),
          getUserGrowth(30),
          getModuleAdoption(),
          getFornecedoresByCategoria(),
          getJornadaFunnel(),
          getDicasRanking(5),
          getIaUsageTotals(),
          getIaUsagePorDia(14),
          getIaUsagePorFuncao(),
        ]);
        setStats(statsRes);
        setCrescimento(crescimentoRes);
        setModulos(modulosRes);
        setFornecedores(fornecedoresRes);
        setFunil(funilRes);
        setDicas(dicasRes);
        setIaTotais(iaTotaisRes);
        setIaPorDia(iaPorDiaRes);
        setIaPorFuncao(iaPorFuncaoRes);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const alertas = derivarAlertas(stats, funil, modulos);

  return { stats, crescimento, modulos, fornecedores, funil, dicas, iaTotais, iaPorDia, iaPorFuncao, alertas, loading, error };
}
