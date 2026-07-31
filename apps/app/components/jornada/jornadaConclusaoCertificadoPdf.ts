// Certificado de Conclusão da Jornada Empreendedora (SDD-49) — mesmo padrão
// de `organizacaoPlanoPdf.ts` (expo-print + fallback de iframe oculto na
// web, porque expo-print não renderiza HTML arbitrário no navegador).
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { color } from "@serdono/ui";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildCertificadoHtml(nomeEmpresa: string, nicheName: string | null): string {
  const dataConclusao = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; padding: 0; margin: 0; }
          .moldura { border: 3px solid ${color.action.primary}; margin: 24px; padding: 48px 40px; text-align: center; }
          .overline { color: ${color.action.primary}; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin-bottom: 24px; }
          h1 { color: ${color.bg.brand}; font-size: 28px; margin: 0 0 8px; }
          .subtitulo { color: #6B7280; font-size: 14px; margin-bottom: 32px; }
          .empresa { font-size: 24px; font-weight: 700; color: ${color.bg.brand}; margin: 24px 0 8px; }
          .nicho { color: #6B7280; font-size: 14px; margin-bottom: 32px; }
          .texto { font-size: 14px; color: #374151; max-width: 480px; margin: 0 auto 32px; line-height: 1.6; }
          .data { font-size: 13px; color: #6B7280; margin-top: 24px; }
          .marca { font-size: 13px; color: ${color.bg.brand}; font-weight: 700; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="moldura">
          <p class="overline">Certificado de Conclusão</p>
          <h1>Jornada Empreendedora</h1>
          <p class="subtitulo">Ser Dono</p>
          <p class="texto">
            Certificamos que o negócio abaixo percorreu toda a Jornada Empreendedora — da escolha do nicho à
            primeira venda e à organização da rotina — e está de pé, pronto para crescer.
          </p>
          <p class="empresa">${escapeHtml(nomeEmpresa)}</p>
          ${nicheName ? `<p class="nicho">${escapeHtml(nicheName)}</p>` : ""}
          <p class="data">Concluído em ${dataConclusao}</p>
          <p class="marca">SER DONO</p>
        </div>
      </body>
    </html>`;
}

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

export async function exportCertificadoConclusaoPdf(nomeEmpresa: string, nicheName: string | null): Promise<void> {
  const html = buildCertificadoHtml(nomeEmpresa, nicheName);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "certificado-jornada-empreendedora.pdf" });
  }
}
