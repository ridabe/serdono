import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { color } from "@serdono/ui";
import type { JornadaEtapa } from "@serdono/supabase";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function etapaHtml(etapa: JornadaEtapa): string {
  const documentos = (etapa.template.documentos as unknown as { nome: string; como_obter: string }[]) ?? [];
  const docsHtml = documentos
    .map(
      (doc) => `
        <li>
          <strong>${escapeHtml(doc.nome)}</strong>
          <p>${escapeHtml(doc.como_obter)}</p>
        </li>`
    )
    .join("");

  return `
    <section>
      <h2>${escapeHtml(etapa.template.titulo)}</h2>
      <p class="explicacao">${escapeHtml(etapa.template.descricao ?? "")}</p>
      ${etapa.template.prazo ? `<p class="prazo"><strong>Prazo esperado:</strong> ${escapeHtml(etapa.template.prazo)}</p>` : ""}
      ${documentos.length > 0 ? `<h3>Documentos</h3><ul>${docsHtml}</ul>` : ""}
      ${etapa.template.dica ? `<p class="dica"><strong>Dica:</strong> ${escapeHtml(etapa.template.dica)}</p>` : ""}
    </section>`;
}

/**
 * Monta o HTML de uma ou mais etapas de Formalização para impressão/PDF —
 * mesmo aviso do RN-21 (não substitui contador/advogado) em toda exportação,
 * não só na tela.
 */
function buildDocumentHtml(titulo: string, etapas: JornadaEtapa[]): string {
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
          .dica { background: #F3F4F6; border-radius: 8px; padding: 10px 14px; }
          ul { padding-left: 18px; margin: 0; }
          li { margin-bottom: 10px; font-size: 14px; }
          li p { margin: 2px 0 0; color: #374151; }
        </style>
      </head>
      <body>
        <h1>Ser Dono — ${escapeHtml(titulo)}</h1>
        <p class="subtitulo">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        <p class="aviso">
          Este conteúdo é uma orientação geral sobre o processo de formalização — não substitui um contador ou
          advogado. Exigências municipais (alvará, licenças) variam por cidade; confirme sempre com a prefeitura
          local.
        </p>
        ${etapas.map(etapaHtml).join("")}
      </body>
    </html>`;
}

async function shareOrDownload(uri: string, filename: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: filename });
  }
}

/**
 * `expo-print` na web NÃO renderiza o `html` recebido — a própria doc do
 * pacote avisa ("on web this prints the HTML from the page"), e
 * `printToFileAsync`/`printAsync` viram só `window.print()` da página atual
 * (bug real de produção, 30/07/2026: o PDF saía com a tela inteira do app —
 * cabeçalho, trilha lateral etc. — em vez do conteúdo da etapa). Na web,
 * contornamos com um `<iframe>` oculto só com o HTML do documento e
 * imprimimos ele — o diálogo "Salvar como PDF" do navegador continua
 * disponível, aplicado ao conteúdo certo. Iframe em vez de `window.open`
 * de propósito: `window.open` cai em bloqueio de pop-up em vários
 * navegadores/extensões mesmo disparado por clique direto do usuário; um
 * iframe embutido na própria página não é pop-up, não tem esse risco.
 */
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
    // Remove só depois de um tempo — se o iframe sai do DOM antes do
    // diálogo de impressão fechar, alguns navegadores cancelam a impressão.
    setTimeout(cleanup, 1000);
  };

  doc.open();
  doc.write(html);
  doc.close();
}

/** Gera e baixa/compartilha o PDF de uma única etapa. */
export async function exportEtapaPdf(etapa: JornadaEtapa): Promise<void> {
  const html = buildDocumentHtml(etapa.template.titulo, [etapa]);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareOrDownload(uri, `${etapa.template.slug}.pdf`);
}

/** Gera e baixa/compartilha o PDF com todas as etapas do caminho escolhido. */
export async function exportChecklistPdf(titulo: string, etapas: JornadaEtapa[]): Promise<void> {
  const html = buildDocumentHtml(titulo, etapas);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareOrDownload(uri, "checklist-formalizacao.pdf");
}

/** Abre o diálogo de impressão do sistema direto, sem gerar arquivo. */
export async function printEtapa(etapa: JornadaEtapa): Promise<void> {
  const html = buildDocumentHtml(etapa.template.titulo, [etapa]);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  await Print.printAsync({ html });
}
