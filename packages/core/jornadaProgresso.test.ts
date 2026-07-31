import { describe, expect, it } from "vitest";
import { calcularProgressoJornada, FASES_JORNADA, type EtapaParaProgresso } from "./jornadaProgresso";

function etapas(fase: string, total: number, concluidas: number): EtapaParaProgresso[] {
  return Array.from({ length: total }, (_, i) => ({ fase, concluida: i < concluidas }));
}

describe("calcularProgressoJornada", () => {
  it("jornada concluída é sempre 100% e reporta organizacao como fase efetiva", () => {
    const r = calcularProgressoJornada("concluida", []);
    expect(r.percentual).toBe(100);
    expect(r.concluida).toBe(true);
    expect(r.faseEfetiva).toBe("organizacao");
  });

  it("conta a Descoberta como fase já concluída na primeira fase real", () => {
    // Descoberta (1) sobre 12 fases totais = 8%, com a fase atual zerada.
    const r = calcularProgressoJornada("validacao_ideia", etapas("validacao_ideia", 5, 0));
    expect(r.percentual).toBe(8);
    expect(r.concluida).toBe(false);
  });

  it("soma a fração da fase atual", () => {
    // Descoberta + validacao_ideia inteira = 2, mais metade de planejamento.
    const r = calcularProgressoJornada("planejamento", etapas("planejamento", 4, 2));
    expect(r.percentual).toBe(Math.round((2.5 / 12) * 100));
  });

  it("fase sem etapa semeada conta 0 de fração, sem inflar o total", () => {
    const r = calcularProgressoJornada("marketing", []);
    const fasesAntes = 1 + FASES_JORNADA.indexOf("marketing");
    expect(r.percentual).toBe(Math.round((fasesAntes / 12) * 100));
  });

  it("ignora etapas de outras fases no cálculo da fração", () => {
    const mistura = [...etapas("clientes", 2, 0), ...etapas("formalizacao", 10, 10)];
    const r = calcularProgressoJornada("clientes", mistura);
    const fasesAntes = 1 + FASES_JORNADA.indexOf("clientes");
    expect(r.percentual).toBe(Math.round((fasesAntes / 12) * 100));
  });

  it("fase desconhecida cai na primeira fase em vez de quebrar a conta", () => {
    const r = calcularProgressoJornada("retencao", []);
    expect(r.faseEfetiva).toBe("validacao_ideia");
  });
});
