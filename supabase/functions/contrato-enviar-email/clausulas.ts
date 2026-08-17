// Ser Dono — geração das cláusulas do contrato (Edge Function
// contrato-enviar-email, 17/08/2026).
//
// Duplicata deliberada de `packages/core/contrato.ts::gerarClausulas` —
// Edge Functions deste projeto não importam pacotes do workspace (nenhuma
// function em `supabase/functions` importa `@serdono/core`, mesmo padrão já
// usado por `reuniao-gerar`/`checkup-gerar`/etc.), então a lógica pura de
// geração de texto é replicada aqui. Se uma cláusula for corrigida em
// `packages/core/contrato.ts`, replicar a mudança aqui também.
//
// Aqui não há validação de campos obrigatórios/documento — os dados já
// foram validados no cliente antes do insert em `contratos`; esta function
// só formata o que já está salvo.

export type TipoContrato = "prestacao_servicos" | "compra_venda" | "sociedade" | "fornecimento_recorrente";

export interface ClausulaContrato {
  titulo: string;
  paragrafos: string[];
}

const LABEL_TIPO: Record<TipoContrato, string> = {
  prestacao_servicos: "Prestação de Serviços",
  compra_venda: "Compra e Venda",
  sociedade: "Sociedade",
  fornecimento_recorrente: "Fornecimento Recorrente",
};

export function labelTipoContrato(tipo: TipoContrato): string {
  return LABEL_TIPO[tipo] ?? tipo;
}

function formatarMoeda(valor: string | number): string {
  const numero = typeof valor === "number" ? valor : Number(String(valor).replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(numero)) return String(valor);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function qualificacaoParte(rotulo: string, parte: { nome: string; documento: string; endereco: string }): string {
  const tipoDoc = parte.documento.replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ";
  return `${rotulo}: ${parte.nome}, ${tipoDoc} nº ${parte.documento}, com endereço em ${parte.endereco}.`;
}

const AVISO_LEGAL: ClausulaContrato = {
  titulo: "Aviso",
  paragrafos: [
    "Este documento é um modelo de orientação geral, gerado a partir de cláusulas padrão. Ele não substitui a revisão de um advogado antes de ser assinado — principalmente em contratos de maior valor ou complexidade.",
  ],
};

// deno-lint-ignore no-explicit-any
export function gerarClausulas(tipo: TipoContrato, campos: any): ClausulaContrato[] {
  if (tipo === "prestacao_servicos") {
    const c = campos;
    const clausulas: ClausulaContrato[] = [
      { titulo: "Das Partes", paragrafos: [qualificacaoParte("Contratante", c.contratante), qualificacaoParte("Contratado(a)", c.contratada)] },
      { titulo: "Do Objeto", paragrafos: [`O presente contrato tem por objeto a prestação do seguinte serviço: ${c.descricaoServico}.`] },
      {
        titulo: "Das Obrigações",
        paragrafos: [
          "O Contratado se compromete a executar o serviço descrito com zelo, diligência e dentro do prazo combinado.",
          "O Contratante se compromete a fornecer as informações e o acesso necessários à boa execução do serviço, e a efetuar o pagamento nas condições combinadas.",
        ],
      },
      { titulo: "Do Valor e Forma de Pagamento", paragrafos: [`Pelo serviço prestado, o Contratante pagará ao Contratado o valor de ${formatarMoeda(c.valor)}, na forma: ${c.formaPagamento}.`] },
      { titulo: "Do Prazo e Local", paragrafos: [`O serviço será executado no prazo de ${c.prazoExecucao}, em ${c.localPrestacao}.`] },
    ];
    if (c.multaPorAtraso) {
      clausulas.push({
        titulo: "Da Multa por Atraso",
        paragrafos: [
          "Em caso de atraso no pagamento por parte do Contratante, incidirá multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 1% (um por cento) ao mês, além de correção monetária.",
        ],
      });
    }
    clausulas.push(
      {
        titulo: "Da Rescisão",
        paragrafos: [
          "Qualquer das partes poderá rescindir este contrato mediante aviso prévio por escrito à outra parte, com antecedência mínima de 15 (quinze) dias, sem prejuízo do pagamento pelos serviços já executados até a data da rescisão.",
        ],
      },
      { titulo: "Da Confidencialidade", paragrafos: ["As partes se comprometem a manter sigilo sobre informações confidenciais trocadas em razão deste contrato, mesmo após seu término."] },
      { titulo: "Do Foro", paragrafos: [`Fica eleito o foro da comarca de ${c.cidade} para dirimir quaisquer dúvidas oriundas deste contrato.`] },
      { titulo: "Das Assinaturas", paragrafos: ["E por estarem assim justas e contratadas, as partes assinam o presente instrumento."] },
      AVISO_LEGAL
    );
    return clausulas;
  }

  if (tipo === "compra_venda") {
    const c = campos;
    const clausulas: ClausulaContrato[] = [
      { titulo: "Das Partes", paragrafos: [qualificacaoParte("Vendedor(a)", c.contratante), qualificacaoParte("Comprador(a)", c.contratada)] },
      { titulo: "Do Objeto", paragrafos: [`O presente contrato tem por objeto a venda de: ${c.descricaoMercadoria}, na quantidade de ${c.quantidade}.`] },
      {
        titulo: "Do Valor e Forma de Pagamento",
        paragrafos: [`Pela mercadoria descrita, o Comprador pagará ao Vendedor o valor total de ${formatarMoeda(c.valorTotal)}, na forma: ${c.formaPagamento}.`],
      },
      { titulo: "Da Entrega", paragrafos: [`A entrega será feita no prazo/condição de: ${c.prazoEntrega}.`] },
    ];
    if (c.garantia?.trim?.()) {
      clausulas.push({ titulo: "Da Garantia", paragrafos: [c.garantia] });
    }
    clausulas.push(
      {
        titulo: "Das Penalidades",
        paragrafos: [
          "Em caso de inadimplemento do pagamento, incidirá multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 1% (um por cento) ao mês, além de correção monetária.",
        ],
      },
      { titulo: "Do Foro", paragrafos: [`Fica eleito o foro da comarca de ${c.cidade} para dirimir quaisquer dúvidas oriundas deste contrato.`] },
      { titulo: "Das Assinaturas", paragrafos: ["E por estarem assim justos e contratados, as partes assinam o presente instrumento."] },
      AVISO_LEGAL
    );
    return clausulas;
  }

  if (tipo === "sociedade") {
    const c = campos;
    // deno-lint-ignore no-explicit-any
    const listaSocios = (c.socios as any[]).map((s) => `${s.nome}, CPF/CNPJ nº ${s.documento}, titular de ${s.cotaPercentual}% das cotas`).join("; ");
    return [
      { titulo: "Das Partes (Sócios)", paragrafos: [`Fazem parte desta sociedade: ${listaSocios}.`] },
      { titulo: "Da Razão Social", paragrafos: [`A sociedade girará sob a razão social "${c.nomeSociedade} Ltda".`] },
      { titulo: "Do Objeto Social", paragrafos: [`A sociedade tem por objeto social: ${c.objetoSocial}.`] },
      {
        titulo: "Do Capital Social e das Cotas",
        paragrafos: [
          `O capital social é de ${formatarMoeda(c.capitalSocial)}, dividido em cotas conforme a participação de cada sócio descrita acima, já integralizado neste ato, em moeda corrente do país.`,
        ],
      },
      {
        titulo: "Da Administração",
        paragrafos: [`A administração da sociedade caberá a ${c.administrador}, com poderes para representar a sociedade ativa e passivamente, em juízo ou fora dele.`],
      },
      { titulo: "Da Responsabilidade dos Sócios", paragrafos: ["A responsabilidade de cada sócio é restrita ao valor de suas cotas, respondendo todos solidariamente pela integralização do capital social."] },
      {
        titulo: "Da Distribuição de Lucros",
        paragrafos: ["Os lucros e prejuízos apurados serão distribuídos entre os sócios na proporção de suas respectivas cotas, salvo deliberação em contrário aprovada por todos os sócios."],
      },
      { titulo: "Do Foro", paragrafos: [`Fica eleito o foro da comarca de ${c.cidade} para dirimir quaisquer dúvidas oriundas deste contrato.`] },
      { titulo: "Das Assinaturas", paragrafos: ["E por estarem assim justos e contratados, os sócios assinam o presente instrumento."] },
      AVISO_LEGAL,
    ];
  }

  // fornecimento_recorrente
  const c = campos;
  const clausulas: ClausulaContrato[] = [
    { titulo: "Das Partes", paragrafos: [qualificacaoParte("Contratante", c.contratante), qualificacaoParte("Fornecedor(a)", c.contratada)] },
    {
      titulo: "Do Objeto e da Periodicidade",
      paragrafos: [`O presente contrato tem por objeto o fornecimento de: ${c.descricaoFornecimento}, de forma recorrente, com periodicidade ${c.periodicidade}.`],
    },
    { titulo: "Do Valor", paragrafos: [`Por cada período de fornecimento, o Contratante pagará ao Fornecedor o valor de ${formatarMoeda(c.valorPorPeriodo)}.`] },
    { titulo: "Da Vigência", paragrafos: [`Este contrato vigorará pelo prazo de ${c.vigenciaMeses} meses, renovável automaticamente por igual período, salvo manifestação em contrário de qualquer das partes.`] },
  ];
  if (c.indiceReajuste?.trim?.()) {
    clausulas.push({ titulo: "Do Reajuste", paragrafos: [`Os valores deste contrato serão reajustados anualmente com base no índice ${c.indiceReajuste}, ou outro que vier a substituí-lo.`] });
  }
  clausulas.push(
    { titulo: "Do Cancelamento", paragrafos: [`Qualquer das partes poderá cancelar este contrato mediante aviso prévio por escrito com antecedência mínima de ${c.avisoPrevioCancelamentoDias} dias.`] },
    { titulo: "Do Foro", paragrafos: [`Fica eleito o foro da comarca de ${c.cidade} para dirimir quaisquer dúvidas oriundas deste contrato.`] },
    { titulo: "Das Assinaturas", paragrafos: ["E por estarem assim justas e contratadas, as partes assinam o presente instrumento."] },
    AVISO_LEGAL
  );
  return clausulas;
}
