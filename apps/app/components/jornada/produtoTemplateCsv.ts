// SDK 54 do expo-file-system reescreveu a API principal (File/Directory) —
// a API "clássica" (writeAsStringAsync/cacheDirectory) que a gente usa aqui
// só existe mais em "expo-file-system/legacy".
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

const NOME_ARQUIVO = "modelo-cadastro-produtos-ser-dono.csv";

// Excel no Brasil usa vírgula como separador decimal — por isso ";" como
// delimitador de coluna (não ","), senão qualquer valor "15,00" quebraria a
// planilha em duas colunas ao abrir.
const CABECALHO = [
  "Nome do produto/serviço",
  "Categoria",
  "Custo unitário (R$)",
  "Despesas variáveis (%)",
  "Impostos (%)",
  "Margem de lucro (%)",
  "Preço de venda (R$)",
  "Estoque atual",
  "Fornecedor",
  "Observações",
].join(";");

// Duas linhas de exemplo — uma de produto físico, uma de serviço — pra
// mostrar o preenchimento funcionando nos dois casos mais comuns.
const LINHAS_EXEMPLO = [
  ["Sabonete artesanal 100g", "Higiene e beleza", "8,50", "10", "6", "30", "16,30", "42", "Distribuidora Bom Preço", "Lote de 50 un."].join(";"),
  ["Limpeza residencial (2h)", "Serviço", "35,00", "8", "6", "35", "68,60", "—", "—", "Preço por visita"].join(";"),
];

function buildCsvContent(): string {
  // BOM (﻿) no início — sem isso, o Excel no Windows abre acento
  // quebrado ("produto/serviço" virando lixo) por não detectar UTF-8 sozinho.
  return "﻿" + [CABECALHO, ...LINHAS_EXEMPLO].join("\r\n");
}

export async function baixarModeloPlanilhaProduto(): Promise<void> {
  const content = buildCsvContent();

  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = NOME_ARQUIVO;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const path = `${FileSystem.cacheDirectory}${NOME_ARQUIVO}`;
  await FileSystem.writeAsStringAsync(path, content, { encoding: "utf8" });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: NOME_ARQUIVO });
  }
}
