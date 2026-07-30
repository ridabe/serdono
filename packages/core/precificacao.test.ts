import { describe, expect, it } from "vitest";
import { calcularPrecificacao } from "./precificacao";

describe("calcularPrecificacao", () => {
  it("calcula preço de venda cobrindo custo, despesas, impostos e margem", () => {
    const resultado = calcularPrecificacao({
      custo: 50,
      despesasVariaveisPct: 10,
      impostosPct: 6,
      margemDesejadaPct: 34,
    });
    // 50 / (1 - 0.5) = 100
    expect(resultado.valido).toBe(true);
    expect(resultado.precoVenda).toBe(100);
    expect(resultado.valorDespesas).toBe(10);
    expect(resultado.valorImpostos).toBe(6);
    expect(resultado.lucroLiquido).toBe(34);
  });

  it("markup equivalente reflete o quanto o preço final ficou acima do custo", () => {
    const resultado = calcularPrecificacao({ custo: 50, despesasVariaveisPct: 10, impostosPct: 6, margemDesejadaPct: 34 });
    // (100 / 50 - 1) * 100 = 100%
    expect(resultado.markupEquivalentePct).toBe(100);
  });

  it("é inválido quando a soma das porcentagens chega a 100% (preço impossível)", () => {
    const resultado = calcularPrecificacao({ custo: 50, despesasVariaveisPct: 40, impostosPct: 30, margemDesejadaPct: 30 });
    expect(resultado.valido).toBe(false);
    expect(resultado.precoVenda).toBe(0);
  });

  it("é inválido quando a soma das porcentagens passa de 100%", () => {
    const resultado = calcularPrecificacao({ custo: 50, despesasVariaveisPct: 50, impostosPct: 30, margemDesejadaPct: 30 });
    expect(resultado.valido).toBe(false);
  });

  it("é inválido com custo zero ou negativo", () => {
    expect(calcularPrecificacao({ custo: 0, despesasVariaveisPct: 10, impostosPct: 6, margemDesejadaPct: 20 }).valido).toBe(false);
    expect(calcularPrecificacao({ custo: -10, despesasVariaveisPct: 10, impostosPct: 6, margemDesejadaPct: 20 }).valido).toBe(false);
  });

  it("funciona com margem 0% (só cobre custo, despesas e imposto, sem lucro)", () => {
    const resultado = calcularPrecificacao({ custo: 90, despesasVariaveisPct: 0, impostosPct: 10, margemDesejadaPct: 0 });
    // 90 / 0.9 = 100
    expect(resultado.valido).toBe(true);
    expect(resultado.precoVenda).toBe(100);
    expect(resultado.lucroLiquido).toBe(0);
  });
});
