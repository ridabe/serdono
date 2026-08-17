import { describe, expect, it } from "vitest";
import { FASES_JORNADA_GRATUITAS, faseJornadaLiberada, labelPlano, planoAtende, PLANOS_CATALOGO } from "./planos";

describe("planoAtende", () => {
  it("gratuito não atende gate de essencial ou master", () => {
    expect(planoAtende("essencial", "gratuito")).toBe(false);
    expect(planoAtende("master", "gratuito")).toBe(false);
  });

  it("essencial atende gate de gratuito e essencial, mas não master", () => {
    expect(planoAtende("gratuito", "essencial")).toBe(true);
    expect(planoAtende("essencial", "essencial")).toBe(true);
    expect(planoAtende("master", "essencial")).toBe(false);
  });

  it("master atende qualquer gate", () => {
    expect(planoAtende("gratuito", "master")).toBe(true);
    expect(planoAtende("essencial", "master")).toBe(true);
    expect(planoAtende("master", "master")).toBe(true);
  });
});

describe("faseJornadaLiberada", () => {
  it("validacao_ideia é sempre liberada, mesmo no gratuito", () => {
    expect(faseJornadaLiberada("validacao_ideia", "gratuito")).toBe(true);
    expect(faseJornadaLiberada("validacao_ideia", "essencial")).toBe(true);
  });

  it("demais fases exigem essencial ou superior", () => {
    expect(faseJornadaLiberada("planejamento", "gratuito")).toBe(false);
    expect(faseJornadaLiberada("planejamento", "essencial")).toBe(true);
    expect(faseJornadaLiberada("formalizacao", "master")).toBe(true);
  });

  it("FASES_JORNADA_GRATUITAS contém só validacao_ideia", () => {
    expect(FASES_JORNADA_GRATUITAS).toEqual(["validacao_ideia"]);
  });
});

describe("labelPlano", () => {
  it("devolve o nome de exibição de cada plano", () => {
    expect(labelPlano("gratuito")).toBe("Gratuito");
    expect(labelPlano("essencial")).toBe("Essencial");
    expect(labelPlano("master")).toBe("Master");
  });
});

describe("PLANOS_CATALOGO", () => {
  it("tem os 3 planos com preço de lançamento do documento de custos", () => {
    expect(PLANOS_CATALOGO.map((p) => p.valor)).toEqual(["gratuito", "essencial", "master"]);
    expect(PLANOS_CATALOGO.find((p) => p.valor === "essencial")?.precoLancamentoCentavos).toBe(1990);
    expect(PLANOS_CATALOGO.find((p) => p.valor === "master")?.precoLancamentoCentavos).toBe(3990);
  });
});
