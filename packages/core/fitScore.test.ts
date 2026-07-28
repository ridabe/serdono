import { describe, expect, it } from "vitest";
import { calculateFitScore, type DiagnosticoParaScore, type NichoParaScore } from "./fitScore";

const diagnosticoBase: DiagnosticoParaScore = {
  capital_disponivel: "5k_15k",
  meses_de_folego: 6,
  apetite_risco: 3,
  tempo_disponivel: "parcial",
  formacao: ["serviços"],
  experiencia: ["atendimento ao cliente"],
};

const nichoServicosDomiciliares: NichoParaScore = {
  categoria: "serviços",
  investimento_min: 300,
  investimento_max: 3000,
  tempo_ate_equilibrio_meses: 2,
  complexidade_regulatoria: 2,
  intensidade_mao_de_obra: 5,
  nivel_concorrencia: 3,
};

const nichoComercioBairro: NichoParaScore = {
  categoria: "varejo",
  investimento_min: 15000,
  investimento_max: 50000,
  tempo_ate_equilibrio_meses: 10,
  complexidade_regulatoria: 3,
  intensidade_mao_de_obra: 3,
  nivel_concorrencia: 4,
};

describe("calculateFitScore", () => {
  it("retorna nota entre 0 e 100 em todos os componentes", () => {
    const result = calculateFitScore(diagnosticoBase, nichoServicosDomiciliares);
    for (const value of Object.values(result)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("penaliza nicho fora da faixa de capital do usuário", () => {
    const dentroDaFaixa = calculateFitScore(diagnosticoBase, nichoServicosDomiciliares);
    const foraDaFaixa = calculateFitScore(diagnosticoBase, nichoComercioBairro);
    expect(dentroDaFaixa.score_financeiro).toBeGreaterThan(foraDaFaixa.score_financeiro);
  });

  it("é determinístico — mesma entrada gera sempre a mesma nota", () => {
    const a = calculateFitScore(diagnosticoBase, nichoServicosDomiciliares);
    const b = calculateFitScore(diagnosticoBase, nichoServicosDomiciliares);
    expect(a).toEqual(b);
  });

  it("sem capital informado, o score financeiro é zero (nunca positivo por omissão)", () => {
    const semCapital = calculateFitScore({ ...diagnosticoBase, capital_disponivel: null }, nichoServicosDomiciliares);
    expect(semCapital.score_financeiro).toBe(0);
  });
});
