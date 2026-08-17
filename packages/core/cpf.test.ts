import { describe, expect, it } from "vitest";
import { isValidCpf, maskCpf, unmaskCpf } from "./cpf";

describe("maskCpf", () => {
  it("aplica a máscara progressivamente conforme digita", () => {
    expect(maskCpf("111")).toBe("111");
    expect(maskCpf("111444")).toBe("111.444");
    expect(maskCpf("111444777")).toBe("111.444.777");
    expect(maskCpf("11144477735")).toBe("111.444.777-35");
  });

  it("ignora caracteres não numéricos e limita a 11 dígitos", () => {
    expect(maskCpf("111.444.777-35extra")).toBe("111.444.777-35");
  });
});

describe("unmaskCpf", () => {
  it("remove tudo que não for dígito", () => {
    expect(unmaskCpf("111.444.777-35")).toBe("11144477735");
  });
});

describe("isValidCpf", () => {
  it("aceita um CPF com dígitos verificadores corretos", () => {
    expect(isValidCpf("111.444.777-35")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(isValidCpf("111.444.777-34")).toBe(false);
  });

  it("rejeita sequência de dígitos repetidos", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("rejeita tamanho incorreto", () => {
    expect(isValidCpf("123")).toBe(false);
  });
});
