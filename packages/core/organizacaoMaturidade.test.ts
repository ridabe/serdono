import { describe, expect, it } from "vitest";
import { calcularMaturidadeOrganizacional, PERGUNTAS_DIAGNOSTICO } from "./organizacaoMaturidade";

function responder(respostasPositivas: Record<string, boolean>) {
  return PERGUNTAS_DIAGNOSTICO.map((p) => ({ id: p.id, resposta: respostasPositivas[p.id] ?? false }));
}

describe("calcularMaturidadeOrganizacional", () => {
  it("nível 1 quando quase tudo é 'não'", () => {
    const resultado = calcularMaturidadeOrganizacional(responder({ esquece_compromissos: true }));
    expect(resultado.pontuacaoPct).toBe(0);
    expect(resultado.nivel).toBe(1);
    expect(resultado.riscos.length).toBe(PERGUNTAS_DIAGNOSTICO.length);
  });

  it("nível 4 quando quase tudo é 'sim' (e a pergunta inversa é 'não')", () => {
    const todasBoas = Object.fromEntries(PERGUNTAS_DIAGNOSTICO.map((p) => [p.id, !p.inverso]));
    const resultado = calcularMaturidadeOrganizacional(responder(todasBoas));
    expect(resultado.pontuacaoPct).toBe(100);
    expect(resultado.nivel).toBe(4);
    expect(resultado.riscos).toHaveLength(0);
  });

  it("pergunta inversa (esquece_compromissos) conta como risco quando respondida 'sim'", () => {
    const resultado = calcularMaturidadeOrganizacional([{ id: "esquece_compromissos", resposta: true }]);
    expect(resultado.riscos).toHaveLength(1);
    expect(resultado.pontuacaoPct).toBe(0);
  });

  it("prioridades trazem as perguntas críticas primeiro, no máximo 3", () => {
    const resultado = calcularMaturidadeOrganizacional(responder({ registra_despesas: true, sabe_a_pagar: true }));
    expect(resultado.prioridades).toHaveLength(3);
    expect(resultado.prioridades[0]).toContain("Misturar dinheiro pessoal");
  });

  it("perguntas não respondidas não entram na conta", () => {
    const resultado = calcularMaturidadeOrganizacional([{ id: "separa_dinheiro", resposta: true }]);
    expect(resultado.pontuacaoPct).toBe(100);
    expect(resultado.riscos).toHaveLength(0);
  });
});
