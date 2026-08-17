import { describe, expect, it } from "vitest";
import {
  camposValidos,
  documentoValido,
  formatarMoeda,
  gerarClausulas,
  tituloResumo,
  type CamposCompraVenda,
  type CamposFornecimento,
  type CamposPrestacaoServicos,
  type CamposSociedade,
} from "./contrato";

const contratanteValido = { nome: "Maria Empreendedora", documento: "111.444.777-35", endereco: "Rua A, 100" };
const contratadaValida = { nome: "João Fornecedor", documento: "11.222.333/0001-81", endereco: "Rua B, 200" };

const camposServicos: CamposPrestacaoServicos = {
  contratante: contratanteValido,
  contratada: contratadaValida,
  cidade: "São Paulo",
  descricaoServico: "Manutenção de site",
  valor: "1500",
  formaPagamento: "PIX em até 5 dias após a entrega",
  prazoExecucao: "10 dias",
  localPrestacao: "remoto",
  multaPorAtraso: true,
};

const camposVenda: CamposCompraVenda = {
  contratante: contratanteValido,
  contratada: contratadaValida,
  cidade: "São Paulo",
  descricaoMercadoria: "10 caixas de embalagem",
  quantidade: "10",
  valorTotal: "500",
  formaPagamento: "à vista",
  prazoEntrega: "5 dias úteis",
};

const camposSociedade: CamposSociedade = {
  nomeSociedade: "Casa Limpa",
  objetoSocial: "Prestação de serviços de limpeza",
  capitalSocial: "10000",
  socios: [
    { nome: "Maria Empreendedora", documento: "111.444.777-35", cotaPercentual: 60 },
    { nome: "José Sócio", documento: "11.222.333/0001-81", cotaPercentual: 40 },
  ],
  administrador: "Maria Empreendedora",
  cidade: "São Paulo",
};

const camposFornecimento: CamposFornecimento = {
  contratante: contratanteValido,
  contratada: contratadaValida,
  cidade: "São Paulo",
  descricaoFornecimento: "Embalagens personalizadas",
  periodicidade: "mensal",
  valorPorPeriodo: "800",
  vigenciaMeses: "12",
  avisoPrevioCancelamentoDias: "30",
};

describe("documentoValido", () => {
  it("aceita CPF e CNPJ válidos", () => {
    expect(documentoValido("111.444.777-35")).toBe(true);
    expect(documentoValido("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita documento inválido ou de tamanho errado", () => {
    expect(documentoValido("123")).toBe(false);
    expect(documentoValido("111.444.777-34")).toBe(false);
  });
});

describe("formatarMoeda", () => {
  it("formata número em BRL", () => {
    expect(formatarMoeda(1500)).toContain("1.500,00");
    expect(formatarMoeda("1500")).toContain("1.500,00");
  });
});

describe("camposValidos", () => {
  it("aceita prestação de serviços com todos os campos preenchidos", () => {
    expect(camposValidos("prestacao_servicos", camposServicos)).toBe(true);
  });

  it("rejeita prestação de serviços com documento da contraparte inválido", () => {
    expect(
      camposValidos("prestacao_servicos", { ...camposServicos, contratada: { ...contratadaValida, documento: "123" } })
    ).toBe(false);
  });

  it("rejeita prestação de serviços com campo obrigatório vazio", () => {
    expect(camposValidos("prestacao_servicos", { ...camposServicos, descricaoServico: "" })).toBe(false);
  });

  it("aceita compra e venda válida", () => {
    expect(camposValidos("compra_venda", camposVenda)).toBe(true);
  });

  it("aceita fornecimento recorrente válido", () => {
    expect(camposValidos("fornecimento_recorrente", camposFornecimento)).toBe(true);
  });

  it("aceita sociedade com cotas somando 100%", () => {
    expect(camposValidos("sociedade", camposSociedade)).toBe(true);
  });

  it("rejeita sociedade com cotas que não somam 100%", () => {
    const invalido = { ...camposSociedade, socios: [{ ...camposSociedade.socios[0], cotaPercentual: 50 }, camposSociedade.socios[1]] };
    expect(camposValidos("sociedade", invalido)).toBe(false);
  });

  it("rejeita sociedade com menos de 2 sócios", () => {
    expect(camposValidos("sociedade", { ...camposSociedade, socios: [camposSociedade.socios[0]] })).toBe(false);
  });
});

describe("gerarClausulas", () => {
  it("gera cláusulas de prestação de serviços incluindo multa por atraso quando marcada", () => {
    const clausulas = gerarClausulas("prestacao_servicos", camposServicos);
    expect(clausulas.some((c) => c.titulo === "Da Multa por Atraso")).toBe(true);
    expect(clausulas[clausulas.length - 1].titulo).toBe("Aviso");
  });

  it("não gera cláusula de multa quando não marcada", () => {
    const clausulas = gerarClausulas("prestacao_servicos", { ...camposServicos, multaPorAtraso: false });
    expect(clausulas.some((c) => c.titulo === "Da Multa por Atraso")).toBe(false);
  });

  it("gera cláusulas de compra e venda", () => {
    const clausulas = gerarClausulas("compra_venda", camposVenda);
    expect(clausulas.some((c) => c.titulo === "Do Objeto")).toBe(true);
  });

  it("gera cláusulas de sociedade com todos os sócios listados", () => {
    const clausulas = gerarClausulas("sociedade", camposSociedade);
    const partes = clausulas.find((c) => c.titulo === "Das Partes (Sócios)");
    expect(partes?.paragrafos[0]).toContain("Maria Empreendedora");
    expect(partes?.paragrafos[0]).toContain("José Sócio");
  });

  it("gera cláusula de reajuste em fornecimento só quando o índice é informado", () => {
    const semReajuste = gerarClausulas("fornecimento_recorrente", camposFornecimento);
    expect(semReajuste.some((c) => c.titulo === "Do Reajuste")).toBe(false);

    const comReajuste = gerarClausulas("fornecimento_recorrente", { ...camposFornecimento, indiceReajuste: "IPCA" });
    expect(comReajuste.some((c) => c.titulo === "Do Reajuste")).toBe(true);
  });

  it("é determinística: mesma entrada gera a mesma saída", () => {
    const a = gerarClausulas("prestacao_servicos", camposServicos);
    const b = gerarClausulas("prestacao_servicos", camposServicos);
    expect(a).toEqual(b);
  });
});

describe("tituloResumo", () => {
  it("monta o resumo pra lista/histórico", () => {
    expect(tituloResumo("prestacao_servicos", camposServicos)).toBe("Prestação de Serviços — João Fornecedor");
    expect(tituloResumo("sociedade", camposSociedade)).toBe("Sociedade — Casa Limpa");
  });
});
