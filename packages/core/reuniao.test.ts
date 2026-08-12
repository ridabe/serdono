import { describe, expect, it } from "vitest";
import { detalheObrigatorio, elegivelAssistenteReuniao, TIPOS_REUNIAO } from "./reuniao";

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
