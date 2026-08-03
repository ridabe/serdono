import { describe, expect, it } from "vitest";
import {
  aliquotaIrPorMeses,
  simularAplicacoes,
  taxaMensalDeAnual,
  taxaMensalPoupanca,
  type SimulacaoInputs,
} from "./investimentos";

// CDI/Selic reais lidos da HG Brasil em 02/08/2026 — usados aqui como valor
// de teste, nunca como constante do produto.
const TAXAS = { cdiAnualPct: 14.25, selicAnualPct: 14.25 };

function inputs(over: Partial<SimulacaoInputs> = {}): SimulacaoInputs {
  return {
    valorInicial: 10_000,
    meses: 12,
    taxas: TAXAS,
    percentualCdi: 100,
    cenarioRendaVariavelPct: 0,
    ...over,
  };
}

describe("aliquotaIrPorMeses", () => {
  it("segue a tabela regressiva da Lei 11.033", () => {
    expect(aliquotaIrPorMeses(6)).toBe(22.5); // 180 dias
    expect(aliquotaIrPorMeses(7)).toBe(20);
    expect(aliquotaIrPorMeses(12)).toBe(20); // 360 dias
    expect(aliquotaIrPorMeses(13)).toBe(17.5);
    expect(aliquotaIrPorMeses(24)).toBe(17.5); // 720 dias
    expect(aliquotaIrPorMeses(36)).toBe(15);
  });
});

describe("taxaMensalDeAnual", () => {
  it("usa juro composto, não divisão por 12", () => {
    const mensal = taxaMensalDeAnual(12);
    // (1+i)^12 = 1.12 -> i ≈ 0.9489% a.m., bem abaixo de 1% (12/12)
    expect(mensal).toBeCloseTo(0.009489, 5);
    expect(Math.pow(1 + mensal, 12) - 1).toBeCloseTo(0.12, 10);
  });
});

describe("taxaMensalPoupanca", () => {
  it("com Selic acima de 8,5% rende 0,5% ao mês", () => {
    expect(taxaMensalPoupanca(14.25)).toBe(0.005);
  });

  it("com Selic baixa passa a render 70% da Selic", () => {
    expect(taxaMensalPoupanca(7)).toBeCloseTo(taxaMensalDeAnual(4.9), 10);
  });
});

describe("simularAplicacoes", () => {
  it("projeta o CDB com o CDI real informado, com IR da faixa do prazo", () => {
    const r = simularAplicacoes(inputs());
    // 10.000 a 14,25% a.a. por 12 meses = 11.425 bruto
    expect(r.cdb.valorFinalBruto).toBeCloseTo(11_425, 0);
    expect(r.cdb.aliquotaIrPct).toBe(20);
    expect(r.cdb.impostoRenda).toBeCloseTo(285, 0); // 20% de 1.425
    expect(r.cdb.valorFinalLiquido).toBeCloseTo(11_140, 0);
  });

  it("um CDB a 110% do CDI rende mais que a 100%", () => {
    const cem = simularAplicacoes(inputs({ percentualCdi: 100 }));
    const centoEDez = simularAplicacoes(inputs({ percentualCdi: 110 }));
    expect(centoEDez.cdb.valorFinalLiquido).toBeGreaterThan(cem.cdb.valorFinalLiquido);
  });

  it("poupança é isenta de IR — por isso pode ganhar de um CDB fraco", () => {
    const r = simularAplicacoes(inputs({ percentualCdi: 40 }));
    expect(r.poupanca.aliquotaIrPct).toBe(0);
    expect(r.poupanca.impostoRenda).toBe(0);
    // CDB a 40% do CDI (5,7% a.a.) perde da poupança (0,5% a.m. ≈ 6,17% a.a.)
    expect(r.poupanca.valorFinalLiquido).toBeGreaterThan(r.cdb.valorFinalLiquido);
  });

  it("o cenário de renda variável usa o número do usuário, e nada mais", () => {
    const r = simularAplicacoes(inputs({ cenarioRendaVariavelPct: 20 }));
    expect(r.cenarioUsuario.valorFinalBruto).toBeCloseTo(12_000, 0);
    // Sem cenário informado (0%), o dinheiro fica parado — o produto não
    // preenche com nenhuma expectativa de mercado.
    const semCenario = simularAplicacoes(inputs({ cenarioRendaVariavelPct: 0 }));
    expect(semCenario.cenarioUsuario.valorFinalBruto).toBe(10_000);
  });

  it("aceita cenário negativo — testar prejuízo é parte da comparação", () => {
    const r = simularAplicacoes(inputs({ cenarioRendaVariavelPct: -30 }));
    expect(r.cenarioUsuario.valorFinalBruto).toBeCloseTo(7_000, 0);
    expect(r.cenarioUsuario.rendimentoLiquido).toBeLessThan(0);
    // Prejuízo não gera IR a pagar nesta conta.
    expect(r.cenarioUsuario.impostoRenda).toBe(0);
  });

  it("a série do gráfico começa no valor aplicado e tem um ponto por mês", () => {
    const r = simularAplicacoes(inputs({ meses: 24 }));
    expect(r.pontos).toHaveLength(25); // mês 0 até 24
    expect(r.pontos[0]).toMatchObject({ mes: 0, cdb: 10_000, selic: 10_000, poupanca: 10_000 });
    expect(r.pontos[24].cdb).toBeCloseTo(r.cdb.valorFinalBruto, 6);
  });

  it("prazo maior cai numa faixa de IR menor", () => {
    expect(simularAplicacoes(inputs({ meses: 6 })).cdb.aliquotaIrPct).toBe(22.5);
    expect(simularAplicacoes(inputs({ meses: 36 })).cdb.aliquotaIrPct).toBe(15);
  });

  it("as taxas vêm sempre de fora — mudar o CDI muda o resultado", () => {
    const alto = simularAplicacoes(inputs({ taxas: { cdiAnualPct: 14.25, selicAnualPct: 14.25 } }));
    const baixo = simularAplicacoes(inputs({ taxas: { cdiAnualPct: 6, selicAnualPct: 6 } }));
    expect(baixo.cdb.valorFinalLiquido).toBeLessThan(alto.cdb.valorFinalLiquido);
  });
});
