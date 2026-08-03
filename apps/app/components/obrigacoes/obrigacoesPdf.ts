import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { color } from "@serdono/ui";
import { REGIME_LABEL, type RegimeEmpresa } from "@serdono/core";
import type { ObrigacaoNaTela } from "./useObrigacoes";

/**
 * Export do checklist de obrigações (SDD-61) — mesmo mecanismo de
 * `formalizacaoPdf.ts::exportChecklistPdf` (HTML inline + `expo-print`/print
 * na web via iframe oculto), com o aviso da RN-36 no lugar do RN-21.
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatarData(iso: string | null): string {
  if (!iso) return "Sem prazo fixo — consulte o órgão responsável";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function obrigacaoHtml(o: ObrigacaoNaTela): string {
  return `
    <section>
      <h2>${escapeHtml(o.nome)}</h2>
      <p class="explicacao">${escapeHtml(o.descricao)}</p>
      <p class="prazo"><strong>Vencimento:</strong> ${escapeHtml(formatarData(o.dataVencimento))}</p>
      <h3>Como fazer</h3>
      <p>${escapeHtml(o.comoFazer)}</p>
      <p class="fonte">Fonte: <a href="${escapeHtml(o.fonteUrl)}">${escapeHtml(o.fonteUrl)}</a> (consultada em ${escapeHtml(formatarData(o.fonteData))})</p>
    </section>`;
}

function buildDocumentHtml(regime: RegimeEmpresa, obrigacoes: ObrigacaoNaTela[]): string {
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; padding: 32px; }
          h1 { color: ${color.bg.brand}; font-size: 22px; margin-bottom: 4px; }
          .subtitulo { color: #6B7280; font-size: 13px; margin-bottom: 24px; }
          .aviso { background: #FCE9C2; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 24px; }
          section { margin-bottom: 28px; page-break-inside: avoid; }
          h2 { color: ${color.bg.brand}; font-size: 17px; margin-bottom: 6px; }
          h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.4px; color: #6B7280; margin: 14px 0 6px; }
          p { font-size: 14px; line-height: 1.5; margin: 4px 0; }
          .prazo { color: #374151; }
          .fonte { color: #9CA3AF; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Ser Dono — Meu Negócio em Dia (${escapeHtml(REGIME_LABEL[regime])})</h1>
        <p class="subtitulo">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        <p class="aviso">
          Este conteúdo é orientação geral sobre prazos e procedimentos — não calcula imposto devido e não substitui
          um contador. Itens que variam por estado/cidade (ICMS, ISS, alvará) não têm data única: confirme sempre com
          o órgão responsável.
        </p>
        ${obrigacoes.map(obrigacaoHtml).join("")}
      </body>
    </html>`;
}

async function shareOrDownload(uri: string, filename: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: filename });
  }
}

/** Mesma técnica de `formalizacaoPdf.ts::printHtmlOnWeb` — `expo-print` não renderiza HTML próprio na web. */
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

/** Gera e baixa/compartilha o checklist completo de obrigações do regime escolhido. */
export async function exportObrigacoesPdf(regime: RegimeEmpresa, obrigacoes: ObrigacaoNaTela[]): Promise<void> {
  const html = buildDocumentHtml(regime, obrigacoes);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareOrDownload(uri, "meu-negocio-em-dia.pdf");
}
