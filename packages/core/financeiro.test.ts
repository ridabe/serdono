import { describe, expect, it } from "vitest";
import { calcularPlanejamentoFinanceiro, estimarCapitalDaFaixa, sugerirPlanejamentoFinanceiro, type FinanceiroInputs } from "./financeiro";

describe("estimarCapitalDaFaixa", () => {
  it("converte faixa conhecida em número", () => {
    expect(estimarCapitalDaFaixa("5k_15k")).toBe(10_000);
  });

  it("retorna null pra faixa desconhecida ou ausente", () => {
    expect(estimarCapitalDaFaixa(null)).toBeNull();
    expect(estimarCapitalDaFaixa("faixa_invalida")).toBeNull();
  });
});

describe("sugerirPlanejamentoFinanceiro", () => {
  it("usa a média de investimento do nicho quando disponível", () => {
    const sugestao = sugerirPlanejamentoFinanceiro(10_000, {
      investimentoMin: 300,
      investimentoMax: 3_000,
      tempoAteEquilibrioMeses: 2,
      margemTipicaPct: 55,
    });
    expect(sugestao.investimentoInicial).toBe(1_650);
    expect(sugestao.mesesCapitalGiro).toBe(2);
    expect(sugestao.margemContribuicaoPct).toBe(55);
  });

  it("nunca sugere receita esperada abaixo do ponto de equilíbrio (ponto de partida neutro)", () => {
    const sugestao = sugerirPlanejamentoFinanceiro(10_000, {
      investimentoMin: 1_000,
      investimentoMax: 3_000,
      tempoAteEquilibrioMeses: 3,
      margemTipicaPct: 40,
    });
    const resultado = calcularPlanejamentoFinanceiro(sugestao);
    expect(resultado.lucroEsperadoMensal).toBe(0);
  });

  it("funciona sem nicho (fallback proporcional ao capital)", () => {
    const sugestao = sugerirPlanejamentoFinanceiro(20_000, null);
    expect(sugestao.investimentoInicial).toBe(10_000);
    expect(sugestao.mesesCapitalGiro).toBe(3);
  });
});

describe("calcularPlanejamentoFinanceiro", () => {
  const base: FinanceiroInputs = {
    capitalDisponivel: 15_000,
    investimentoInicial: 3_000,
    custosFixosMensais: 1_000,
    receitaMensalEsperada: 4_000,
    margemContribuicaoPct: 50,
    mesesCapitalGiro: 3,
    mesesReserva: 3,
  };

  it("calcula capital de giro e reserva como custo fixo × meses", () => {
    const r = calcularPlanejamentoFinanceiro(base);
    expect(r.capitalGiro).toBe(3_000);
    expect(r.reservaEmergencia).toBe(3_000);
  });

  it("ponto de equilíbrio = custos fixos ÷ margem de contribuição", () => {
    const r = calcularPlanejamentoFinanceiro(base);
    // 1000 / 0.5 = 2000
    expect(r.pontoEquilibrioMensal).toBe(2_000);
  });

  it("lucro esperado = receita × margem - custos fixos", () => {
    const r = calcularPlanejamentoFinanceiro(base);
    // 4000*0.5 - 1000 = 1000
    expect(r.lucroEsperadoMensal).toBe(1_000);
  });

  it("total necessário soma investimento, giro e reserva", () => {
    const r = calcularPlanejamentoFinanceiro(base);
    expect(r.totalNecessario).toBe(3_000 + 3_000 + 3_000);
    expect(r.faltaOuSobra).toBe(15_000 - 9_000);
  });

  it("projeta 12 meses de fluxo de caixa crescendo pelo lucro mensal", () => {
    const r = calcularPlanejamentoFinanceiro(base);
    expect(r.fluxoCaixa12Meses).toHaveLength(12);
    expect(r.fluxoCaixa12Meses[0].saldo).toBe(r.saldoAposInvestimento + r.lucroEsperadoMensal);
    expect(r.fluxoCaixa12Meses[11].saldo).toBe(r.saldoAposInvestimento + r.lucroEsperadoMensal * 12);
  });

  it("nunca fica negativo quando o lucro mensal é positivo", () => {
    const r = calcularPlanejamentoFinanceiro(base);
    expect(r.mesEmQueSaldoFicaNegativo).toBeNull();
  });

  it("aponta o mês em que o saldo fica negativo quando o lucro mensal é negativo", () => {
    const r = calcularPlanejamentoFinanceiro({
      ...base,
      capitalDisponivel: 4_000,
      investimentoInicial: 3_000,
      receitaMensalEsperada: 1_000, // 1000*0.5 - 1000 = -500/mês, saldo inicial 1000
    });
    // saldoAposInvestimento = 1000, cai 500/mês -> negativo no mês 3 (1000 - 500*3 = -500)
    expect(r.mesEmQueSaldoFicaNegativo).toBe(3);
  });

  it("sinaliza saldo já negativo (mês 0) quando o investimento sozinho já estoura o capital", () => {
    const r = calcularPlanejamentoFinanceiro({ ...base, capitalDisponivel: 1_000, investimentoInicial: 3_000 });
    expect(r.mesEmQueSaldoFicaNegativo).toBe(0);
  });

  it("nunca divide por zero quando a margem de contribuição é 0", () => {
    const r = calcularPlanejamentoFinanceiro({ ...base, margemContribuicaoPct: 0 });
    expect(r.pontoEquilibrioMensal).toBe(0);
    expect(Number.isFinite(r.lucroEsperadoMensal)).toBe(true);
  });
});
