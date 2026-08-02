import { describe, expect, it } from "vitest";
import {
  calcularProgressoJornada,
  proximaFasePendente,
  type EtapaParaProgresso,
  type FaseComEtapas,
} from "./jornadaProgresso";

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

  it("soma a fração real de cada fase, não assume que as anteriores estão prontas", () => {
    // validacao_ideia 3/5 concluída + planejamento 2/4 concluída, mais Descoberta (1).
    const mistura = [...etapas("validacao_ideia", 5, 3), ...etapas("planejamento", 4, 2)];
    const r = calcularProgressoJornada("planejamento", mistura);
    expect(r.percentual).toBe(Math.round(((1 + 0.6 + 0.5) / 12) * 100));
  });

  it("fase 'nada trava' atravessada sem terminar conta a fração real, não 100% por suposição", () => {
    // Estrutura ficou em 3/12 mas o usuário já avançou pra Marketing (RN-24) — o
    // progresso não deve fingir que Estrutura terminou só porque não trava mais.
    const r = calcularProgressoJornada("marketing", etapas("estrutura", 12, 3));
    expect(r.percentual).toBe(Math.round(((1 + 3 / 12) / 12) * 100));
  });

  it("fase sem etapa semeada conta 0 de fração, sem inflar o total", () => {
    const r = calcularProgressoJornada("marketing", []);
    expect(r.percentual).toBe(Math.round((1 / 12) * 100));
  });

  it("ignora etapas de outras fases no cálculo da fração", () => {
    const mistura = [...etapas("clientes", 2, 0), ...etapas("formalizacao", 10, 10)];
    const r = calcularProgressoJornada("clientes", mistura);
    expect(r.percentual).toBe(Math.round(((1 + 1) / 12) * 100));
  });

  it("fase desconhecida cai na primeira fase em vez de quebrar a conta", () => {
    const r = calcularProgressoJornada("retencao", []);
    expect(r.faseEfetiva).toBe("validacao_ideia");
  });
});

describe("proximaFasePendente", () => {
  function fase(fase: FaseComEtapas["fase"], semeada: boolean, concluidas: boolean[]): FaseComEtapas {
    return { fase, semeada, concluidas };
  }

  it("retorna a primeira fase ainda não semeada", () => {
    const r = proximaFasePendente([
      fase("validacao_ideia", true, [true, true]),
      fase("planejamento", false, []),
      fase("formalizacao", false, []),
    ]);
    expect(r).toBe("planejamento");
  });

  it("permite lacuna: uma fase depois já concluída não impede a de antes ainda pendente", () => {
    // Formalização concluída (marcada pelo intake de negócio existente) mas
    // Estrutura, que vem antes na ordem, ainda tem item pendente.
    const r = proximaFasePendente([
      fase("validacao_ideia", true, [true]),
      fase("planejamento", true, [true]),
      fase("formalizacao", true, [true, true]),
      fase("financeiro", true, [true]),
      fase("estrutura", true, [true, false, true]),
    ]);
    expect(r).toBe("estrutura");
  });

  it("fase semeada sem etapa relevante conta como trivialmente completa", () => {
    const r = proximaFasePendente([
      fase("validacao_ideia", true, [true]),
      fase("estrutura", true, []), // todo item dispensável pro nicho
      fase("fornecedores", true, [false]),
    ]);
    expect(r).toBe("fornecedores");
  });

  it("todas concluídas retorna 'concluida'", () => {
    const r = proximaFasePendente([fase("validacao_ideia", true, [true]), fase("organizacao", true, [true, true])]);
    expect(r).toBe("concluida");
  });
});
