import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { color } from "@serdono/ui";
import type { GuiaReuniao } from "@serdono/core";

/**
 * Export do guia do Assistente de Reunião em PDF — mesmo mecanismo de
 * `planoAcaoPdf.ts`/`obrigacoesPdf.ts` (HTML inline + `expo-print`, print
 * via iframe oculto na web). Recebe o guia já salvo — nunca rechama a IA,
 * inclusive pra reabrir uma reunião antiga do histórico.
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function secaoHtml(titulo: string, itens: string[]): string {
  return `
    <section>
      <h2>${escapeHtml(titulo)}</h2>
      <ul>
        ${itens.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>`;
}

function buildDocumentHtml(tipoLabel: string, comQuem: string, guia: GuiaReuniao): string {
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; padding: 32px; }
          h1 { color: ${color.bg.brand}; font-size: 22px; margin-bottom: 4px; }
          .subtitulo { color: #6B7280; font-size: 13px; margin-bottom: 8px; }
          .resumo { background: #FCE9C2; border-radius: 8px; padding: 12px 16px; font-size: 14px; margin-bottom: 24px; }
          section { margin-bottom: 20px; page-break-inside: avoid; }
          h2 { color: ${color.bg.brand}; font-size: 15px; margin-bottom: 6px; }
          ul { list-style: none; padding: 0; margin: 0; }
          li { font-size: 14px; line-height: 1.8; }
          li:before { content: "• "; color: ${color.bg.brand}; }
        </style>
      </head>
      <body>
        <h1>Ser Dono — Guia de Reunião</h1>
        <p class="subtitulo">${escapeHtml(tipoLabel)} · ${escapeHtml(comQuem)} · gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        <p class="resumo">${escapeHtml(guia.resumo)}</p>
        ${secaoHtml("Pauta sugerida", guia.pauta)}
        ${secaoHtml("Perguntas a fazer", guia.perguntas_a_fazer)}
        ${secaoHtml("Dicas de comportamento", guia.dicas_comportamento)}
        ${secaoHtml("Erros a evitar", guia.erros_a_evitar)}
        ${secaoHtml("Checklist de preparação", guia.checklist_preparacao)}
      </body>
    </html>`;
}

async function shareOrDownload(uri: string, filename: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: filename });
  }
}

/** Mesma técnica de `obrigacoesPdf.ts::printHtmlOnWeb` — `expo-print` não renderiza HTML próprio na web. */
function printHtmlOnWeb(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(cleanup, 1000);
  };

  doc.open();
  doc.write(html);
  doc.close();
}

export async function exportReuniaoPdf(tipoLabel: string, comQuem: string, guia: GuiaReuniao): Promise<void> {
  const html = buildDocumentHtml(tipoLabel, comQuem, guia);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareOrDownload(uri, `guia-de-reuniao.pdf`);
}
