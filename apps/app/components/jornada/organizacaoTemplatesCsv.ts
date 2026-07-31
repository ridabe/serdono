// Kit de Modelos da Fase Organização (SDD-48) — mesmo padrão de
// `produtoTemplateCsv.ts`: ";" como delimitador (Excel BR usa vírgula como
// separador decimal) + BOM UTF-8 (senão acentuação quebra no Excel/Windows).
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type ModeloOrganizacao = "fluxo_caixa" | "contas_pagar" | "contas_receber" | "estoque" | "pedidos";

interface ModeloDefinicao {
  arquivo: string;
  cabecalho: string[];
  linhasExemplo: string[][];
}

const MODELOS: Record<ModeloOrganizacao, ModeloDefinicao> = {
  fluxo_caixa: {
    arquivo: "modelo-fluxo-de-caixa-ser-dono.csv",
    cabecalho: ["Data", "Descrição", "Tipo (Entrada/Saída)", "Categoria", "Valor (R$)", "Saldo do dia"],
    linhasExemplo: [
      ["01/08/2026", "Saldo inicial", "Entrada", "—", "500,00", "500,00"],
      ["02/08/2026", "Venda balcão", "Entrada", "Vendas", "180,00", "680,00"],
      ["03/08/2026", "Aluguel", "Saída", "Fixas", "600,00", "80,00"],
    ],
  },
  contas_pagar: {
    arquivo: "modelo-contas-a-pagar-ser-dono.csv",
    cabecalho: ["Fornecedor", "Categoria", "Valor (R$)", "Vencimento", "Forma de pagamento", "Status"],
    linhasExemplo: [
      ["Distribuidora Bom Preço", "Mercadoria", "320,00", "10/08/2026", "Boleto", "Pendente"],
      ["Energia elétrica", "Fixas", "145,00", "15/08/2026", "Débito automático", "Pago"],
    ],
  },
  contas_receber: {
    arquivo: "modelo-contas-a-receber-ser-dono.csv",
    cabecalho: ["Cliente", "Origem", "Valor (R$)", "Vencimento", "Forma de recebimento", "Status"],
    linhasExemplo: [
      ["Ana Silva", "Pedido #12", "250,00", "05/08/2026", "Pix", "Recebido"],
      ["Buffet Alegria", "Orçamento aprovado", "600,00", "20/08/2026", "Boleto", "Pendente"],
    ],
  },
  estoque: {
    arquivo: "modelo-controle-de-estoque-ser-dono.csv",
    cabecalho: ["Item", "Categoria", "Quantidade atual", "Estoque mínimo", "Custo unitário (R$)", "Fornecedor", "Última compra"],
    linhasExemplo: [
      ["Embalagem 500ml", "Embalagem", "120", "50", "0,80", "Distribuidora Bom Preço", "20/07/2026"],
      ["Matéria-prima X", "Insumo", "8", "15", "12,50", "Fornecedor Central", "18/07/2026"],
    ],
  },
  pedidos: {
    arquivo: "modelo-controle-de-pedidos-ser-dono.csv",
    cabecalho: ["Nº do pedido", "Cliente", "Produto/Serviço", "Prazo", "Valor (R$)", "Status", "Observações"],
    linhasExemplo: [
      ["001", "Ana Silva", "Bolo personalizado", "10/08/2026", "250,00", "Em produção", "Retirada às 14h"],
      ["002", "Buffet Alegria", "50 docinhos", "15/08/2026", "300,00", "Confirmado", "Entrega no local"],
    ],
  },
};

function buildCsvContent(modelo: ModeloDefinicao): string {
  const linhas = [modelo.cabecalho.join(";"), ...modelo.linhasExemplo.map((linha) => linha.join(";"))];
  // BOM (﻿) no início — sem isso o Excel no Windows não detecta UTF-8 sozinho.
  return "﻿" + linhas.join("\r\n");
}

export async function baixarModeloOrganizacao(tipo: ModeloOrganizacao): Promise<void> {
  const modelo = MODELOS[tipo];
  const content = buildCsvContent(modelo);

  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = modelo.arquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const path = `${FileSystem.cacheDirectory}${modelo.arquivo}`;
  await FileSystem.writeAsStringAsync(path, content, { encoding: "utf8" });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: modelo.arquivo });
  }
}
