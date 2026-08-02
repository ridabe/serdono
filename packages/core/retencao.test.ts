import { describe, expect, it } from "vitest";
import {
  calcularResumoRetencao,
  classificarCliente,
  hojeISO,
  ordenarPorAtencao,
  type ClienteClassificado,
  type ClienteParaClassificar,
} from "./retencao";

const HOJE = "2026-08-02";

function cliente(id: string, ultimaInteracaoEm: string | null, totalCompras = 1): ClienteParaClassificar {
  return { id, ultimaInteracaoEm, totalCompras };
}

describe("classificarCliente", () => {
  it("dentro do ciclo informado, o cliente está em dia", () => {
    // ciclo 30, última interação há 10 dias
    const r = classificarCliente(cliente("a", "2026-07-23"), 30, HOJE);
    expect(r.situacao).toBe("em_dia");
    expect(r.diasSemContato).toBe(10);
  });

  it("no limite exato do ciclo ainda está em dia (o corte é 'passou de', não 'chegou em')", () => {
    const r = classificarCliente(cliente("a", "2026-07-03"), 30, HOJE);
    expect(r.diasSemContato).toBe(30);
    expect(r.situacao).toBe("em_dia");
  });

  it("passou do ciclo mas não de 1,5x dele: esfriando", () => {
    // 40 dias, ciclo 30 -> entre 30 e 45
    const r = classificarCliente(cliente("a", "2026-06-23"), 30, HOJE);
    expect(r.diasSemContato).toBe(40);
    expect(r.situacao).toBe("esfriando");
  });

  it("passou de 1,5x o ciclo: sumido", () => {
    // 50 dias, ciclo 30 -> acima de 45
    const r = classificarCliente(cliente("a", "2026-06-13"), 30, HOJE);
    expect(r.diasSemContato).toBe(50);
    expect(r.situacao).toBe("sumido");
  });

  it("as faixas acompanham o ciclo do negócio — os mesmos 50 dias não são 'sumido' num ciclo longo", () => {
    // Consultoria: ciclo 180 dias. O mesmo cliente do teste anterior está em dia.
    const r = classificarCliente(cliente("a", "2026-06-13"), 180, HOJE);
    expect(r.situacao).toBe("em_dia");
  });

  it("sem interação registrada é 'sem histórico', nunca 'sumido'", () => {
    const r = classificarCliente(cliente("a", null, 0), 30, HOJE);
    expect(r.situacao).toBe("sem_historico");
    expect(r.diasSemContato).toBeNull();
  });

  it("data futura não vira dias negativos", () => {
    const r = classificarCliente(cliente("a", "2026-09-01"), 30, HOJE);
    expect(r.diasSemContato).toBe(0);
    expect(r.situacao).toBe("em_dia");
  });
});

describe("calcularResumoRetencao", () => {
  it("conta cada situação e calcula a taxa de retorno sobre quem já comprou", () => {
    const clientes = [
      cliente("a", "2026-07-30", 3), // em dia, recomprou
      cliente("b", "2026-06-20", 1), // esfriando, compra única
      cliente("c", "2026-05-01", 2), // sumido, recomprou
      cliente("d", null, 0), // sem histórico, nunca comprou
    ];
    const classificados = clientes.map((c) => classificarCliente(c, 30, HOJE));
    const resumo = calcularResumoRetencao(classificados, clientes);

    expect(resumo).toMatchObject({ total: 4, emDia: 1, esfriando: 1, sumidos: 1, semHistorico: 1 });
    // 2 recompraram de 3 que compraram = 67%; quem nunca comprou fica fora da base
    expect(resumo.taxaRetornoPct).toBe(67);
  });

  it("sem ninguém que tenha comprado, a taxa de retorno é nula — não 0%", () => {
    const clientes = [cliente("a", null, 0), cliente("b", null, 0)];
    const classificados = clientes.map((c) => classificarCliente(c, 30, HOJE));
    expect(calcularResumoRetencao(classificados, clientes).taxaRetornoPct).toBeNull();
  });
});

describe("ordenarPorAtencao", () => {
  it("sumidos primeiro, depois esfriando, e sem histórico por último", () => {
    const entrada: ClienteClassificado[] = [
      { id: "emDia", situacao: "em_dia", diasSemContato: 5 },
      { id: "semHistorico", situacao: "sem_historico", diasSemContato: null },
      { id: "sumidoRecente", situacao: "sumido", diasSemContato: 50 },
      { id: "esfriando", situacao: "esfriando", diasSemContato: 40 },
      { id: "sumidoAntigo", situacao: "sumido", diasSemContato: 200 },
    ];
    expect(ordenarPorAtencao(entrada).map((c) => c.id)).toEqual([
      "sumidoAntigo",
      "sumidoRecente",
      "esfriando",
      "emDia",
      "semHistorico",
    ]);
  });

  it("não altera o array recebido", () => {
    const entrada: ClienteClassificado[] = [
      { id: "a", situacao: "em_dia", diasSemContato: 1 },
      { id: "b", situacao: "sumido", diasSemContato: 90 },
    ];
    ordenarPorAtencao(entrada);
    expect(entrada.map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("hojeISO", () => {
  it("devolve só a parte de data, no formato das interações", () => {
    expect(hojeISO(new Date("2026-08-02T22:31:00Z"))).toBe("2026-08-02");
  });
});
