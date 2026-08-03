import { describe, expect, it } from "vitest";
import {
  classificarStatusObrigacao,
  filtrarObrigacoesAplicaveis,
  ordenarPorUrgencia,
  proximaOcorrencia,
  type ObrigacaoCatalogo,
  type RegraVencimento,
} from "./obrigacoes";

describe("proximaOcorrencia — mensal_dia_fixo", () => {
  const regra: RegraVencimento = { tipo: "mensal_dia_fixo", dia: 20 };

  it("antes do dia 20, vence no mesmo mês", () => {
    const r = proximaOcorrencia(regra, "2026-08-05");
    expect(r).toEqual({ dataVencimento: "2026-08-20", periodoReferencia: "2026-08" });
  });

  it("no dia exato, ainda conta como deste mês (o corte é 'passou de', não 'chegou em')", () => {
    const r = proximaOcorrencia(regra, "2026-08-20");
    expect(r.dataVencimento).toBe("2026-08-20");
  });

  it("depois do dia 20, rola pro mês seguinte", () => {
    const r = proximaOcorrencia(regra, "2026-08-21");
    expect(r).toEqual({ dataVencimento: "2026-09-20", periodoReferencia: "2026-09" });
  });

  it("rola de dezembro pra janeiro do ano seguinte", () => {
    const r = proximaOcorrencia(regra, "2026-12-21");
    expect(r).toEqual({ dataVencimento: "2027-01-20", periodoReferencia: "2027-01" });
  });

  it("dia 31 num mês de 30 dias cai no último dia do mês, nunca em data inexistente", () => {
    const r = proximaOcorrencia({ tipo: "mensal_dia_fixo", dia: 31 }, "2026-04-15");
    expect(r.dataVencimento).toBe("2026-04-30");
  });
});

describe("proximaOcorrencia — anual_dia_mes", () => {
  it("DASN-SIMEI: antes de 31/05 vence neste ano", () => {
    const r = proximaOcorrencia({ tipo: "anual_dia_mes", dia: 31, mes: 5 }, "2026-03-01");
    expect(r).toEqual({ dataVencimento: "2026-05-31", periodoReferencia: "2026" });
  });

  it("no dia exato (31/05) ainda conta como deste ano", () => {
    const r = proximaOcorrencia({ tipo: "anual_dia_mes", dia: 31, mes: 5 }, "2026-05-31");
    expect(r.dataVencimento).toBe("2026-05-31");
  });

  it("DEFIS: depois de 31/03 rola pro ano seguinte", () => {
    const r = proximaOcorrencia({ tipo: "anual_dia_mes", dia: 31, mes: 3 }, "2026-04-01");
    expect(r).toEqual({ dataVencimento: "2027-03-31", periodoReferencia: "2027" });
  });
});

describe("proximaOcorrencia — trimestral_ultimo_dia_mes_seguinte", () => {
  const regra: RegraVencimento = { tipo: "trimestral_ultimo_dia_mes_seguinte" };

  it("dentro do 1º trimestre, vence no último dia útil de abril (30)", () => {
    const r = proximaOcorrencia(regra, "2026-02-10");
    expect(r).toEqual({ dataVencimento: "2026-04-30", periodoReferencia: "2026-Q1" });
  });

  it("logo após vencer o 1º trimestre, já mira o 2º (último dia de julho, 31)", () => {
    const r = proximaOcorrencia(regra, "2026-05-01");
    expect(r).toEqual({ dataVencimento: "2026-07-31", periodoReferencia: "2026-Q2" });
  });

  it("fechamento de dezembro vence em janeiro do ano seguinte", () => {
    const r = proximaOcorrencia(regra, "2026-12-15");
    expect(r).toEqual({ dataVencimento: "2027-01-31", periodoReferencia: "2026-Q4" });
  });
});

describe("proximaOcorrencia — variavel", () => {
  it("nunca tem data de vencimento", () => {
    const r = proximaOcorrencia({ tipo: "variavel" }, "2026-08-05");
    expect(r.dataVencimento).toBeNull();
  });
});

describe("classificarStatusObrigacao", () => {
  it("marcado como concluído vence o que a data diz — RN-35", () => {
    expect(classificarStatusObrigacao("2020-01-01", "2026-08-01T10:00:00Z", "2026-08-05")).toBe("concluido");
  });

  it("sem prazo fixo, sem marcação: sem_prazo_fixo", () => {
    expect(classificarStatusObrigacao(null, null, "2026-08-05")).toBe("sem_prazo_fixo");
  });

  it("data futura distante: no_prazo", () => {
    expect(classificarStatusObrigacao("2026-09-20", null, "2026-08-05")).toBe("no_prazo");
  });

  it("dentro da janela de 7 dias: proximo", () => {
    expect(classificarStatusObrigacao("2026-08-10", null, "2026-08-05")).toBe("proximo");
  });

  it("data passada, nunca marcada: atrasado — nunca afirma 'não pago'", () => {
    expect(classificarStatusObrigacao("2026-08-01", null, "2026-08-05")).toBe("atrasado");
  });
});

function obrigacao(over: Partial<ObrigacaoCatalogo> = {}): ObrigacaoCatalogo {
  return {
    id: "1",
    slug: "das-mei",
    regime: ["mei"],
    requerFuncionarios: false,
    nome: "DAS",
    descricao: "",
    comoFazer: "",
    regraVencimento: { tipo: "mensal_dia_fixo", dia: 20 },
    fonteUrl: "https://gov.br",
    fonteData: "2026-08-03",
    ordem: 1,
    ...over,
  };
}

describe("filtrarObrigacoesAplicaveis", () => {
  const catalogo = [
    obrigacao({ id: "das-mei", regime: ["mei"] }),
    obrigacao({ id: "das-simples", regime: ["simples"] }),
    obrigacao({ id: "trabalhista", regime: ["simples", "presumido_real"], requerFuncionarios: true }),
  ];

  it("filtra por regime", () => {
    const r = filtrarObrigacoesAplicaveis(catalogo, "mei", false);
    expect(r.map((o) => o.id)).toEqual(["das-mei"]);
  });

  it("obrigação que requer funcionários só aparece se a config disser que tem", () => {
    const semFuncionarios = filtrarObrigacoesAplicaveis(catalogo, "simples", false);
    expect(semFuncionarios.map((o) => o.id)).toEqual(["das-simples"]);

    const comFuncionarios = filtrarObrigacoesAplicaveis(catalogo, "simples", true);
    expect(comFuncionarios.map((o) => o.id)).toEqual(["das-simples", "trabalhista"]);
  });
});

describe("ordenarPorUrgencia", () => {
  it("atrasado > próximo > no prazo > sem prazo fixo > concluído, sem mutar o array recebido", () => {
    const original = [
      { status: "concluido" as const, dataVencimento: "2026-08-01" },
      { status: "no_prazo" as const, dataVencimento: "2026-09-01" },
      { status: "atrasado" as const, dataVencimento: "2026-07-01" },
      { status: "sem_prazo_fixo" as const, dataVencimento: null },
      { status: "proximo" as const, dataVencimento: "2026-08-10" },
    ];
    const copia = [...original];
    const ordenado = ordenarPorUrgencia(original);

    expect(ordenado.map((o) => o.status)).toEqual(["atrasado", "proximo", "no_prazo", "sem_prazo_fixo", "concluido"]);
    expect(original).toEqual(copia);
  });
});
