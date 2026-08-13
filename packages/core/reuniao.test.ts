import { describe, expect, it } from "vitest";
import { agendamentoValido, detalheObrigatorio, elegivelAssistenteReuniao, formatarDataHoraReuniao, TIPOS_REUNIAO } from "./reuniao";

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
