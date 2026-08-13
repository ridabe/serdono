import { describe, expect, it } from "vitest";
import {
  agendamentoValido,
  detalheObrigatorio,
  elegivelAssistenteReuniao,
  fimJanelaLembreteInicioISO,
  formatarDataHoraReuniao,
  rotuloQuandoReuniao,
  TIPOS_REUNIAO,
} from "./reuniao";

describe("elegivelAssistenteReuniao", () => {
  it("só elegível com jornada existente", () => {
    expect(elegivelAssistenteReuniao(true)).toBe(true);
    expect(elegivelAssistenteReuniao(false)).toBe(false);
  });
});

describe("detalheObrigatorio", () => {
  it("só exige detalhe quando tipo é 'outro'", () => {
    expect(detalheObrigatorio("outro")).toBe(true);
    expect(detalheObrigatorio("fornecedor")).toBe(false);
    expect(detalheObrigatorio("investidor")).toBe(false);
  });
});

describe("TIPOS_REUNIAO", () => {
  it("tem 6 tipos, 'outro' por último", () => {
    expect(TIPOS_REUNIAO).toHaveLength(6);
    expect(TIPOS_REUNIAO[TIPOS_REUNIAO.length - 1].valor).toBe("outro");
  });
});

describe("agendamentoValido", () => {
  const agora = new Date("2026-08-12T12:00:00Z");

  it("data futura é válida", () => {
    expect(agendamentoValido("2026-08-15T14:00:00Z", agora)).toBe(true);
  });

  it("data passada é inválida", () => {
    expect(agendamentoValido("2026-08-01T14:00:00Z", agora)).toBe(false);
  });

  it("data exatamente igual a agora é inválida (precisa ser estritamente futura)", () => {
    expect(agendamentoValido("2026-08-12T12:00:00Z", agora)).toBe(false);
  });

  it("data inválida (string não parseável) é inválida", () => {
    expect(agendamentoValido("não é uma data", agora)).toBe(false);
  });
});

describe("formatarDataHoraReuniao", () => {
  it("formata em pt-BR, dd/mm/aaaa às HH:mm", () => {
    expect(formatarDataHoraReuniao("2026-08-15T14:00:00Z")).toMatch(/^\d{2}\/\d{2}\/2026 às \d{2}:\d{2}$/);
  });
});

describe("rotuloQuandoReuniao", () => {
  it("'hoje' quando cai no mesmo dia civil em SP", () => {
    const agora = new Date("2026-08-12T14:00:00-03:00");
    expect(rotuloQuandoReuniao("2026-08-12T20:00:00-03:00", agora)).toBe("hoje");
  });

  it("'amanha' quando cai no dia civil seguinte em SP", () => {
    const agora = new Date("2026-08-12T14:00:00-03:00");
    expect(rotuloQuandoReuniao("2026-08-13T09:00:00-03:00", agora)).toBe("amanha");
  });

  it("'hoje' perto da meia-noite em SP não vira 'amanha' por causa de fuso (UTC vs SP)", () => {
    // 23h em SP ainda é dia 12; em UTC já seria dia 13 (armadilha clássica de fuso).
    const agora = new Date("2026-08-12T23:30:00-03:00");
    expect(rotuloQuandoReuniao("2026-08-12T23:50:00-03:00", agora)).toBe("hoje");
  });
});

describe("fimJanelaLembreteInicioISO", () => {
  it("depois de amanhã 00:00 em SP (03:00 UTC), pra 'agora' no início do dia em SP", () => {
    const agora = new Date("2026-08-12T02:00:00-03:00");
    expect(fimJanelaLembreteInicioISO(agora)).toBe("2026-08-14T03:00:00.000Z");
  });

  it("mesmo resultado pra 'agora' no fim do dia em SP (ainda o mesmo dia civil)", () => {
    const agora = new Date("2026-08-12T23:59:00-03:00");
    expect(fimJanelaLembreteInicioISO(agora)).toBe("2026-08-14T03:00:00.000Z");
  });

  it("avança um dia assim que passa da meia-noite em SP", () => {
    const agora = new Date("2026-08-13T00:01:00-03:00");
    expect(fimJanelaLembreteInicioISO(agora)).toBe("2026-08-15T03:00:00.000Z");
  });
});
