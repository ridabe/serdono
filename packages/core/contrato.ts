/**
 * Assistente de Contrato (pedido do dono do produto, 17/08/2026) — lógica
 * pura (SDD-3). Diferente de todo módulo de IA do produto (Reunião, Plano
 * de Ação, Check-up): o texto do contrato é **modelo fixo + substituição de
 * campos**, nunca gerado por IA (RN-60) — cláusula jurídica inventada é o
 * tipo de erro que este módulo existe pra evitar. Toda cláusula vive aqui,
 * versionada no git, não numa tabela editável pelo admin.
 *
 * `gerarClausulas` é determinística: mesmo `tipo`+`campos` sempre produz o
 * mesmo texto — usada tanto na tela de revisão quanto no PDF quanto no
 * e-mail, sem persistir o texto renderizado (RN-62, contrato imutável só
 * quanto aos CAMPOS salvos, o texto é sempre recalculado).
 */

import { isValidCnpj } from "./cnpj";
import { isValidCpf } from "./cpf";

export type TipoContrato = "prestacao_servicos" | "compra_venda" | "sociedade" | "fornecimento_recorrente";

export const TIPOS_CONTRATO: { valor: TipoContrato; label: string; descricao: string }[] = [
  {
    valor: "prestacao_servicos",
    label: "Prestação de Serviços",
    descricao: "Você contratando ou sendo contratado como prestador de um serviço.",
  },
  {
    valor: "compra_venda",
    label: "Compra e Venda",
    descricao: "Venda de um produto/mercadoria pro seu cliente, ou compra de um fornecedor.",
  },
  {
    valor: "sociedade",
    label: "Sociedade",
    descricao: "Contrato social simplificado — divisão de cotas e responsabilidades entre sócios.",
  },
  {
    valor: "fornecimento_recorrente",
    label: "Fornecimento Recorrente",
    descricao: "Um fornecedor entregando produto ou serviço de forma continuada, não uma venda avulsa.",
  },
];

export function labelTipoContrato(tipo: TipoContrato): string {
  return TIPOS_CONTRATO.find((t) => t.valor === tipo)?.label ?? tipo;
}

export interface ParteContrato {
  nome: string;
  documento: string;
  endereco: string;
}

export interface CamposComuns {
  contratante: ParteContrato;
  contratada: ParteContrato;
  cidade: string;
}

export interface CamposPrestacaoServicos extends CamposComuns {
  descricaoServico: string;
  valor: string;
  formaPagamento: string;
  prazoExecucao: string;
  localPrestacao: string;
  multaPorAtraso: boolean;
}

export interface CamposCompraVenda extends CamposComuns {
  descricaoMercadoria: string;
  quantidade: string;
  valorTotal: string;
  formaPagamento: string;
  prazoEntrega: string;
  garantia?: string;
}

export interface SocioContrato {
  nome: string;
  documento: string;
  cotaPercentual: number;
}

export interface CamposSociedade {
  nomeSociedade: string;
  objetoSocial: string;
  capitalSocial: string;
  socios: SocioContrato[];
  administrador: string;
  cidade: string;
}

export interface CamposFornecimento extends CamposComuns {
  descricaoFornecimento: string;
  periodicidade: string;
  valorPorPeriodo: string;
  vigenciaMeses: string;
  indiceReajuste?: string;
  avisoPrevioCancelamentoDias: string;
}

export type CamposContrato = CamposPrestacaoServicos | CamposCompraVenda | CamposSociedade | CamposFornecimento;

export interface ClausulaContrato {
  titulo: string;
  paragrafos: string[];
}

/** Checagem leve de formato: aceita CPF (11 dígitos) ou CNPJ (14 dígitos) com dígito verificador válido — nunca consulta API externa (mesmo princípio de `cnpj.ts`). */
export function documentoValido(documento: string): boolean {
  const digits = documento.replace(/\D/g, "");
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

export function formatarMoeda(valor: string | number): string {
  const numero = typeof valor === "number" ? valor : Number(valor.replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(numero)) return String(valor);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parteValida(parte: ParteContrato | undefined): boolean {
  return !!parte && parte.nome.trim().length > 0 && parte.endereco.trim().length > 0 && documentoValido(parte.documento);
}

/** Valida os campos obrigatórios de cada tipo antes de liberar a geração — nunca deixa gerar contrato com campo essencial vazio ou documento inválido. */
export function camposValidos(tipo: TipoContrato, campos: Partial<CamposContrato>): boolean {
  if (tipo === "sociedade") {
    const c = campos as Partial<CamposSociedade>;
    if (!c.nomeSociedade?.trim() || !c.objetoSocial?.trim() || !c.capitalSocial?.trim() || !c.administrador?.trim() || !c.cidade?.trim()) {
      return false;
    }
    if (!c.socios || c.socios.length < 2) return false;
    if (c.socios.some((s) => !s.nome.trim() || !documentoValido(s.documento) || !(s.cotaPercentual > 0))) return false;
    const somaCotas = c.socios.reduce((acc, s) => acc + s.cotaPercentual, 0);
    return Math.abs(somaCotas - 100) < 0.01;
  }

  const c = campos as Partial<CamposComuns>;
  if (!parteValida(c.contratante) || !parteValida(c.contratada) || !c.cidade?.trim()) return false;

  if (tipo === "prestacao_servicos") {
    const p = campos as Partial<CamposPrestacaoServicos>;
    return !!(p.descricaoServico?.trim() && p.valor?.trim() && p.formaPagamento?.trim() && p.prazoExecucao?.trim() && p.localPrestacao?.trim());
  }
  if (tipo === "compra_venda") {
    const p = campos as Partial<CamposCompraVenda>;
    return !!(p.descricaoMercadoria?.trim() && p.quantidade?.trim() && p.valorTotal?.trim() && p.formaPagamento?.trim() && p.prazoEntrega?.trim());
  }
  const p = campos as Partial<CamposFornecimento>;
  return !!(
    p.descricaoFornecimento?.trim() &&
    p.periodicidade?.trim() &&
    p.valorPorPeriodo?.trim() &&
    p.vigenciaMeses?.trim() &&
    p.avisoPrevioCancelamentoDias?.trim()
  );
}

const AVISO_LEGAL: ClausulaContrato = {
  titulo: "Aviso",
  paragrafos: [
    "Este documento é um modelo de orientação geral, gerado a partir de cláusulas padrão. Ele não substitui a revisão de um advogado antes de ser assinado — principalmente em contratos de maior valor ou complexidade.",
  ],
};

function qualificacaoParte(rotulo: string, parte: ParteContrato): string {
  const tipoDoc = parte.documento.replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ";
  return `${rotulo}: ${parte.nome}, ${tipoDoc} nº ${parte.documento}, com endereço em ${parte.endereco}.`;
}

function clausulasPrestacaoServicos(c: CamposPrestacaoServicos): ClausulaContrato[] {
  const clausulas: ClausulaContrato[] = [
    {
      titulo: "Das Partes",
      paragrafos: [qualificacaoParte("Contratante", c.contratante), qualificacaoParte("Contratado(a)", c.contratada)],
    },
    { titulo: "Do Objeto", paragrafos: [`O presente contrato tem por objeto a prestação do seguinte serviço: ${c.descricaoServico}.`] },
    {
      titulo: "Das Obrigações",
      paragrafos: [
        "O Contratado se compromete a executar o serviço descrito com zelo, diligência e dentro do prazo combinado.",
        "O Contratante se compromete a fornecer as informações e o acesso necessários à boa execução do serviço, e a efetuar o pagamento nas condições combinadas.",
      ],
    },
    {
      titulo: "Do Valor e Forma de Pagamento",
      paragrafos: [`Pelo serviço prestado, o Contratante pagará ao Contratado o valor de ${formatarMoeda(c.valor)}, na forma: ${c.formaPagamento}.`],
    },
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
    {
      titulo: "Da Confidencialidade",
      paragrafos: ["As partes se comprometem a manter sigilo sobre informações confidenciais trocadas em razão deste contrato, mesmo após seu término."],
    },
    { titulo: "Do Foro", paragrafos: [`Fica eleito o foro da comarca de ${c.cidade} para dirimir quaisquer dúvidas oriundas deste contrato.`] },
    { titulo: "Das Assinaturas", paragrafos: ["E por estarem assim justas e contratadas, as partes assinam o presente instrumento."] },
    AVISO_LEGAL
  );

  return clausulas;
}

function clausulasCompraVenda(c: CamposCompraVenda): ClausulaContrato[] {
  const clausulas: ClausulaContrato[] = [
    {
      titulo: "Das Partes",
      paragrafos: [qualificacaoParte("Vendedor(a)", c.contratante), qualificacaoParte("Comprador(a)", c.contratada)],
    },
    {
      titulo: "Do Objeto",
      paragrafos: [`O presente contrato tem por objeto a venda de: ${c.descricaoMercadoria}, na quantidade de ${c.quantidade}.`],
    },
    {
      titulo: "Do Valor e Forma de Pagamento",
      paragrafos: [`Pela mercadoria descrita, o Comprador pagará ao Vendedor o valor total de ${formatarMoeda(c.valorTotal)}, na forma: ${c.formaPagamento}.`],
    },
    { titulo: "Da Entrega", paragrafos: [`A entrega será feita no prazo/condição de: ${c.prazoEntrega}.`] },
  ];

  if (c.garantia?.trim()) {
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

function clausulasSociedade(c: CamposSociedade): ClausulaContrato[] {
  const listaSocios = c.socios.map((s) => `${s.nome}, CPF/CNPJ nº ${s.documento}, titular de ${s.cotaPercentual}% das cotas`).join("; ");

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
    {
      titulo: "Da Responsabilidade dos Sócios",
      paragrafos: ["A responsabilidade de cada sócio é restrita ao valor de suas cotas, respondendo todos solidariamente pela integralização do capital social."],
    },
    {
      titulo: "Da Distribuição de Lucros",
      paragrafos: ["Os lucros e prejuízos apurados serão distribuídos entre os sócios na proporção de suas respectivas cotas, salvo deliberação em contrário aprovada por todos os sócios."],
    },
    { titulo: "Do Foro", paragrafos: [`Fica eleito o foro da comarca de ${c.cidade} para dirimir quaisquer dúvidas oriundas deste contrato.`] },
    { titulo: "Das Assinaturas", paragrafos: ["E por estarem assim justos e contratados, os sócios assinam o presente instrumento."] },
    AVISO_LEGAL,
  ];
}

function clausulasFornecimento(c: CamposFornecimento): ClausulaContrato[] {
  const clausulas: ClausulaContrato[] = [
    {
      titulo: "Das Partes",
      paragrafos: [qualificacaoParte("Contratante", c.contratante), qualificacaoParte("Fornecedor(a)", c.contratada)],
    },
    {
      titulo: "Do Objeto e da Periodicidade",
      paragrafos: [`O presente contrato tem por objeto o fornecimento de: ${c.descricaoFornecimento}, de forma recorrente, com periodicidade ${c.periodicidade}.`],
    },
    {
      titulo: "Do Valor",
      paragrafos: [`Por cada período de fornecimento, o Contratante pagará ao Fornecedor o valor de ${formatarMoeda(c.valorPorPeriodo)}.`],
    },
    { titulo: "Da Vigência", paragrafos: [`Este contrato vigorará pelo prazo de ${c.vigenciaMeses} meses, renovável automaticamente por igual período, salvo manifestação em contrário de qualquer das partes.`] },
  ];

  if (c.indiceReajuste?.trim()) {
    clausulas.push({
      titulo: "Do Reajuste",
      paragrafos: [`Os valores deste contrato serão reajustados anualmente com base no índice ${c.indiceReajuste}, ou outro que vier a substituí-lo.`],
    });
  }

  clausulas.push(
    {
      titulo: "Do Cancelamento",
      paragrafos: [`Qualquer das partes poderá cancelar este contrato mediante aviso prévio por escrito com antecedência mínima de ${c.avisoPrevioCancelamentoDias} dias.`],
    },
    { titulo: "Do Foro", paragrafos: [`Fica eleito o foro da comarca de ${c.cidade} para dirimir quaisquer dúvidas oriundas deste contrato.`] },
    { titulo: "Das Assinaturas", paragrafos: ["E por estarem assim justas e contratadas, as partes assinam o presente instrumento."] },
    AVISO_LEGAL
  );

  return clausulas;
}

/** Função pura e determinística: mesmo tipo+campos sempre produz o mesmo texto (RN-60/RN-62). Nunca chama IA nem serviço externo. */
export function gerarClausulas(tipo: TipoContrato, campos: CamposContrato): ClausulaContrato[] {
  if (tipo === "prestacao_servicos") return clausulasPrestacaoServicos(campos as CamposPrestacaoServicos);
  if (tipo === "compra_venda") return clausulasCompraVenda(campos as CamposCompraVenda);
  if (tipo === "sociedade") return clausulasSociedade(campos as CamposSociedade);
  return clausulasFornecimento(campos as CamposFornecimento);
}

/** Resumo curto pra lista/histórico, ex.: "Prestação de Serviços — João da Silva". */
export function tituloResumo(tipo: TipoContrato, campos: CamposContrato): string {
  const label = labelTipoContrato(tipo);
  if (tipo === "sociedade") {
    const c = campos as CamposSociedade;
    return `${label} — ${c.nomeSociedade}`;
  }
  const c = campos as CamposComuns;
  return `${label} — ${c.contratada?.nome ?? ""}`.trim();
}
