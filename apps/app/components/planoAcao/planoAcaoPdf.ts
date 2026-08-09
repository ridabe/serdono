import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { color } from "@serdono/ui";
import { agruparItensPorSemana, formatarMesReferencia, type PlanoAcaoItemCore } from "@serdono/core";

/**
 * Export do Plano de Ação Mensal em PDF — mesmo mecanismo de
 * `obrigacoesPdf.ts`/`formalizacaoPdf.ts` (HTML inline + `expo-print`,
 * print via iframe oculto na web). Recebe itens já no formato de domínio
 * (`PlanoAcaoItemCore`) pra servir tanto o plano do mês corrente quanto
 * qualquer plano do histórico/comparação, sem depender do hook da tela.
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function semanaHtml(numero: number, itens: PlanoAcaoItemCore[]): string {
  return `
    <section>
      <h2>Semana ${numero}</h2>
      <ul>
        ${itens
          .map((item) => `<li class="${item.concluido ? "feito" : ""}">${item.concluido ? "☑" : "☐"} ${escapeHtml(item.titulo)}</li>`)
          .join("")}
      </ul>
    </section>`;
}

function buildDocumentHtml(mesReferenciaISO: string, objetivo: string, itens: PlanoAcaoItemCore[]): string {
  const porSemana = agruparItensPorSemana(itens);
  const total = itens.length;
  const concluidos = itens.filter((i) => i.concluido).length;
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; padding: 32px; }
          h1 { color: ${color.bg.brand}; font-size: 22px; margin-bottom: 4px; }
          .subtitulo { color: #6B7280; font-size: 13px; margin-bottom: 8px; }
          .progresso { color: #374151; font-size: 13px; margin-bottom: 24px; }
          .objetivo { background: #FCE9C2; border-radius: 8px; padding: 12px 16px; font-size: 14px; margin-bottom: 24px; }
          section { margin-bottom: 20px; page-break-inside: avoid; }
          h2 { color: ${color.bg.brand}; font-size: 15px; margin-bottom: 6px; }
          ul { list-style: none; padding: 0; margin: 0; }
          li { font-size: 14px; line-height: 1.8; }
          li.feito { color: #9CA3AF; text-decoration: line-through; }
        </style>
      </head>
      <body>
        <h1>Ser Dono — Plano de Ação de ${escapeHtml(formatarMesReferencia(mesReferenciaISO))}</h1>
        <p class="subtitulo">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        <p class="progresso">${concluidos} de ${total} atividades concluídas</p>
        <p class="objetivo"><strong>Objetivo do mês:</strong> ${escapeHtml(objetivo)}</p>
        ${[1, 2, 3, 4].map((numero) => semanaHtml(numero, porSemana[numero])).join("")}
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

export async function exportPlanoAcaoPdf(mesReferenciaISO: string, objetivo: string, itens: PlanoAcaoItemCore[]): Promise<void> {
  const html = buildDocumentHtml(mesReferenciaISO, objetivo, itens);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareOrDownload(uri, `plano-de-acao-${mesReferenciaISO}.pdf`);
}
