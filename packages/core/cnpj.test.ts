import { describe, expect, it } from "vitest";
import { isValidCnpj, maskCnpj, unmaskCnpj } from "./cnpj";

describe("maskCnpj", () => {
  it("aplica a máscara progressivamente conforme digita", () => {
    expect(maskCnpj("11")).toBe("11");
    expect(maskCnpj("11222")).toBe("11.222");
    expect(maskCnpj("11222333")).toBe("11.222.333");
    expect(maskCnpj("11222333000")).toBe("11.222.333/000");
    expect(maskCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("ignora caracteres não numéricos e limita a 14 dígitos", () => {
    expect(maskCnpj("11.222.333/0001-81extra")).toBe("11.222.333/0001-81");
  });
});

describe("unmaskCnpj", () => {
  it("remove tudo que não for dígito", () => {
    expect(unmaskCnpj("11.222.333/0001-81")).toBe("11222333000181");
  });
});

describe("isValidCnpj", () => {
  it("aceita um CNPJ com dígitos verificadores corretos", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(isValidCnpj("11.222.333/0001-80")).toBe(false);
  });

  it("rejeita sequência de dígitos repetidos", () => {
    expect(isValidCnpj("11.111.111/1111-11")).toBe(false);
  });

  it("rejeita tamanho incorreto", () => {
    expect(isValidCnpj("123")).toBe(false);
  });
});
