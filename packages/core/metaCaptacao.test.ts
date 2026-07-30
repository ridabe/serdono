import { describe, expect, it } from "vitest";
import { calcularMetaCaptacao } from "./metaCaptacao";

describe("calcularMetaCaptacao", () => {
  it("calcula faturamento estimado e contatos necessários com a taxa de conversão padrão", () => {
    const resultado = calcularMetaCaptacao({
      metaClientes: 10,
      periodoDias: 30,
      ticketMedio: 250,
      taxaConversaoPct: 20,
    });
    expect(resultado.faturamentoEstimado).toBe(2500);
    // 10 / 0.2 = 50
    expect(resultado.contatosNecessarios).toBe(50);
  });

  it("arredonda contatos necessários para cima (nunca promete menos abordagem do que precisa)", () => {
    const resultado = calcularMetaCaptacao({
      metaClientes: 5,
      periodoDias: 30,
      ticketMedio: 100,
      taxaConversaoPct: 30,
    });
    // 5 / 0.3 = 16.67 -> 17
    expect(resultado.contatosNecessarios).toBe(17);
  });

  it("contatos necessários é 0 quando a taxa de conversão é 0 (evita divisão por zero)", () => {
    const resultado = calcularMetaCaptacao({ metaClientes: 10, periodoDias: 30, ticketMedio: 100, taxaConversaoPct: 0 });
    expect(resultado.contatosNecessarios).toBe(0);
  });

  it("faturamento estimado é 0 quando o ticket médio ainda não foi preenchido", () => {
    const resultado = calcularMetaCaptacao({ metaClientes: 10, periodoDias: 30, ticketMedio: 0, taxaConversaoPct: 20 });
    expect(resultado.faturamentoEstimado).toBe(0);
  });
});
