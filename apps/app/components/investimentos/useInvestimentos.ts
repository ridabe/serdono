import { useEffect, useMemo, useState } from "react";
import {
  getCotacoes,
  getCurrentSession,
  getJornadaEtapas,
  getMyJornada,
  type Cotacoes,
} from "@serdono/supabase";
import {
  calcularPlanejamentoFinanceiro,
  simularAplicacoes,
  type FinanceiroInputs,
  type SimulacaoInputs,
} from "@serdono/core";

const SLUG_FINANCEIRO_PLANEJAMENTO = "financeiro_planejamento";

const CAMPOS_FINANCEIRO: (keyof FinanceiroInputs)[] = [
  "capitalDisponivel",
  "investimentoInicial",
  "custosFixosMensais",
  "receitaMensalEsperada",
  "margemContribuicaoPct",
  "mesesCapitalGiro",
  "mesesReserva",
];

/**
 * Estado do módulo Mentoria em Investimentos (SDD-56/SDD-57).
 *
 * Duas fontes, ambas reais:
 *  - cotação de mercado, via Edge Function `cotacoes` (HG Brasil);
 *  - o planejamento financeiro que a Jornada já coletou, pra dizer **quanto**
 *    o negócio precisa ter guardado. Sem esse planejamento preenchido o
 *    módulo não estima nada (RN-30) — convida a preencher.
 */
export function useInvestimentos() {
  const [cotacoes, setCotacoes] = useState<Cotacoes | null>(null);
  const [reserva, setReserva] = useState<{ reservaEmergencia: number; capitalGiro: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controles do comparador — o cenário começa vazio de propósito: o produto
  // não sugere quanto uma ação "deve" render (RN-33).
  const [valorInicial, setValorInicial] = useState("5000");
  const [meses, setMeses] = useState(12);
  const [percentualCdi, setPercentualCdi] = useState("100");
  const [cenarioPct, setCenarioPct] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;

        // A cotação é o que importa; o dado da Jornada é bônus e não pode
        // derrubar a tela se a pessoa não tiver jornada.
        const [resultadoCotacoes, jornada] = await Promise.all([
          getCotacoes(),
          getMyJornada(session.user.id).catch(() => null),
        ]);
        setCotacoes(resultadoCotacoes);

        if (jornada) {
          const etapas = await getJornadaEtapas(jornada.id).catch(() => []);
          const dados = etapas.find((e) => e.template.slug === SLUG_FINANCEIRO_PLANEJAMENTO)?.dados_usuario as
            | Partial<FinanceiroInputs>
            | undefined;
          const completo =
            dados && CAMPOS_FINANCEIRO.every((campo) => typeof (dados as Record<string, unknown>)[campo] === "number");
          if (completo) {
            const financeiro = calcularPlanejamentoFinanceiro(dados as FinanceiroInputs);
            setReserva({
              reservaEmergencia: financeiro.reservaEmergencia,
              capitalGiro: financeiro.capitalGiro,
            });
          }
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const numero = (texto: string, padrao: number) => {
    const n = Number(texto.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : padrao;
  };

  const cenarioInformado = cenarioPct.trim() !== "";

  const simulacao = useMemo(() => {
    if (!cotacoes) return null;
    const inputs: SimulacaoInputs = {
      valorInicial: Math.max(0, numero(valorInicial, 0)),
      meses,
      taxas: cotacoes.taxas,
      percentualCdi: Math.max(0, numero(percentualCdi, 100)),
      cenarioRendaVariavelPct: cenarioInformado ? numero(cenarioPct, 0) : 0,
    };
    return simularAplicacoes(inputs);
  }, [cotacoes, valorInicial, meses, percentualCdi, cenarioPct, cenarioInformado]);

  return {
    loading,
    error,
    cotacoes,
    reserva,
    simulacao,
    cenarioInformado,
    valorInicial,
    setValorInicial,
    meses,
    setMeses,
    percentualCdi,
    setPercentualCdi,
    cenarioPct,
    setCenarioPct,
  };
}
