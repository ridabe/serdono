import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { color } from "@serdono/ui";
import { gerarClausulas, labelTipoContrato, type CamposContrato, type TipoContrato } from "@serdono/core";

/**
 * Export do Assistente de Contrato — cópia estrutural de
 * `jornada/formalizacaoPdf.ts` (documento com várias seções numeradas, não
 * um relatório curto tipo `reuniaoPdf.ts`). Recebe `campos` já salvos e
 * chama `gerarClausulas` local (nunca rechama IA — não existe IA aqui, mas
 * mesmo princípio de nunca regerar conteúdo ao reabrir um contrato antigo).
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildDocumentHtml(titulo: string, tipo: TipoContrato, campos: CamposContrato): string {
  const clausulas = gerarClausulas(tipo, campos);
  const clausulasHtml = clausulas
    .map(
      (c, i) => `
    <section>
      <h2>${i + 1}. ${escapeHtml(c.titulo)}</h2>
      ${c.paragrafos.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
    </section>`
    )
    .join("");

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; padding: 32px; }
          h1 { color: ${color.bg.brand}; font-size: 22px; margin-bottom: 4px; }
          .subtitulo { color: #6B7280; font-size: 13px; margin-bottom: 24px; }
          section { margin-bottom: 20px; page-break-inside: avoid; }
          h2 { color: ${color.bg.brand}; font-size: 15px; margin-bottom: 6px; }
          p { font-size: 14px; line-height: 1.5; margin: 4px 0; }
          .assinaturas { margin-top: 48px; display: flex; justify-content: space-between; }
          .linha-assinatura { width: 45%; border-top: 1px solid #111827; padding-top: 6px; font-size: 12px; text-align: center; color: #374151; }
          .rodape { margin-top: 32px; font-size: 11px; color: #9CA3AF; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(titulo)}</h1>
        <p class="subtitulo">${escapeHtml(labelTipoContrato(tipo))} — gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        ${clausulasHtml}
        <div class="assinaturas">
          <div class="linha-assinatura">Assinatura</div>
          <div class="linha-assinatura">Assinatura</div>
        </div>
        <p class="rodape">Documento gerado pelo Ser Dono — modelo de orientação geral, não substitui revisão de advogado.</p>
      </body>
    </html>`;
}

async function shareOrDownload(uri: string, filename: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: filename });
  }
}

/** Mesma técnica de `formalizacaoPdf.ts`: `expo-print` na web não renderiza o `html` recebido — usa iframe oculto + `print()` do navegador. */
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

/** Gera e baixa/compartilha o PDF do contrato. */
export async function exportContratoPdf(titulo: string, tipo: TipoContrato, campos: CamposContrato): Promise<void> {
  const html = buildDocumentHtml(titulo, tipo, campos);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareOrDownload(uri, `${titulo.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
}
