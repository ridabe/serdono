// PDF do Plano de Organização (SDD-48) — mesmo padrão de `formalizacaoPdf.ts`
// (expo-print + fallback de iframe oculto na web, porque expo-print não
// renderiza HTML arbitrário no navegador).
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { color } from "@serdono/ui";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const PLANO_30_DIAS: { semana: string; itens: string[] }[] = [
  {
    semana: "Semana 1 — Organização financeira",
    itens: [
      "Separar contas pessoais e empresariais",
      "Definir onde vai registrar receitas e despesas",
      "Cadastrar as despesas recorrentes do mês",
      "Organizar as contas a pagar da semana",
    ],
  },
  {
    semana: "Semana 2 — Documentos e arquivos",
    itens: [
      "Criar a estrutura de pastas do negócio",
      "Organizar os documentos empresariais que já existem",
      "Definir um padrão de nomes para os arquivos",
      "Configurar uma rotina simples de backup (nuvem)",
    ],
  },
  {
    semana: "Semana 3 — Operação",
    itens: [
      "Criar um jeito simples de controlar pedidos",
      "Organizar materiais ou estoque, se aplicável",
      "Definir uma rotina de conferência",
      "Identificar os itens mais críticos da operação",
    ],
  },
  {
    semana: "Semana 4 — Rotina e indicadores",
    itens: [
      "Criar a agenda administrativa (diária/semanal/mensal)",
      "Escolher as ferramentas que vai usar de fato",
      "Confirmar os indicadores que vai acompanhar",
      "Fazer a primeira revisão mensal do negócio",
    ],
  },
];

function buildPlanoHtml(nomeEmpresa: string, nivelLabel: string, prioridades: string[]): string {
  const prioridadesHtml = prioridades.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
  const semanasHtml = PLANO_30_DIAS.map(
    (s) => `
      <section>
        <h2>${escapeHtml(s.semana)}</h2>
        <ul>${s.itens.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      </section>`
  ).join("");

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; padding: 32px; }
          h1 { color: ${color.bg.brand}; font-size: 22px; margin-bottom: 4px; }
          .subtitulo { color: #6B7280; font-size: 13px; margin-bottom: 24px; }
          .nivel { background: #BFD4DC; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 16px; }
          .prioridades { background: #F9DEDB; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
          .prioridades h3 { margin: 0 0 6px; font-size: 13px; text-transform: uppercase; color: #C23B2E; }
          section { margin-bottom: 24px; page-break-inside: avoid; }
          h2 { color: ${color.bg.brand}; font-size: 16px; margin-bottom: 6px; }
          ul { padding-left: 18px; margin: 0; }
          li { margin-bottom: 6px; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>Ser Dono — Plano de Organização</h1>
        <p class="subtitulo">${escapeHtml(nomeEmpresa)} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        <p class="nivel"><strong>Nível de organização atual:</strong> ${escapeHtml(nivelLabel)}</p>
        ${
          prioridades.length > 0
            ? `<div class="prioridades"><h3>Prioridades identificadas no diagnóstico</h3><ul>${prioridadesHtml}</ul></div>`
            : ""
        }
        ${semanasHtml}
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

export async function exportPlanoOrganizacaoPdf(nomeEmpresa: string, nivelLabel: string, prioridades: string[]): Promise<void> {
  const html = buildPlanoHtml(nomeEmpresa, nivelLabel, prioridades);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "plano-de-organizacao.pdf" });
  }
}
