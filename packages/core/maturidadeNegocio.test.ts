import { describe, expect, it } from "vitest";
import { calcularPontuacaoTotal, elegivelMaturidadeNegocio, nivelDaPontuacao, type CategoriaScore } from "./maturidadeNegocio";

function categorias(valor: number): Record<CategoriaScore, number> {
  return { financeiro: valor, marketing: valor, clientes: valor, organizacao: valor, crescimento: valor };
}

describe("calcularPontuacaoTotal", () => {
  it("média das 5 categorias × 10", () => {
    expect(calcularPontuacaoTotal({ financeiro: 78, marketing: 65, clientes: 81, organizacao: 92, crescimento: 55 })).toBe(742);
  });

  it("todas zero → 0", () => {
    expect(calcularPontuacaoTotal(categorias(0))).toBe(0);
  });

  it("todas cem → 1000", () => {
    expect(calcularPontuacaoTotal(categorias(100))).toBe(1000);
  });
});

describe("nivelDaPontuacao", () => {
  it("limites das faixas de 200 pontos", () => {
    expect(nivelDaPontuacao(0)).toBe("iniciante");
    expect(nivelDaPontuacao(199)).toBe("iniciante");
    expect(nivelDaPontuacao(200)).toBe("em_operacao");
    expect(nivelDaPontuacao(399)).toBe("em_operacao");
    expect(nivelDaPontuacao(400)).toBe("em_crescimento");
    expect(nivelDaPontuacao(599)).toBe("em_crescimento");
    expect(nivelDaPontuacao(600)).toBe("estruturado");
    expect(nivelDaPontuacao(799)).toBe("estruturado");
    expect(nivelDaPontuacao(800)).toBe("preparado_escalar");
    expect(nivelDaPontuacao(1000)).toBe("preparado_escalar");
  });

  it("742 cai em 'estruturado'", () => {
    expect(nivelDaPontuacao(742)).toBe("estruturado");
  });
});

describe("elegivelMaturidadeNegocio", () => {
  it("só elegível com jornada existente", () => {
    expect(elegivelMaturidadeNegocio(true)).toBe(true);
    expect(elegivelMaturidadeNegocio(false)).toBe(false);
  });
});
