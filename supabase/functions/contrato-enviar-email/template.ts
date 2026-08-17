// Ser Dono — template do e-mail com o contrato completo (Assistente de
// Contrato, 17/08/2026).
//
// Mesma convenção de e-mail já fixada em SDD-72/reuniao-convite-email:
// tabelas aninhadas, estilo inline, hex literal, versão texto puro
// obrigatória.
//
// Decisão deliberada (SDD-109): o corpo do e-mail leva o contrato inteiro
// em HTML, NÃO um PDF anexado — não há precedente de anexo binário no
// Resend neste projeto, e no web o app não tem acesso a um PDF em bytes
// (expo-print só abre o diálogo de impressão do navegador). Anexar só no
// nativo quebraria a paridade mobile/web (Princípio de Produto §4). Quem
// gerou o contrato baixa o PDF separadamente pra imprimir/assinar.

import type { ClausulaContrato } from "./clausulas.ts";

const NAVY = "#0E3A4F";
const NAVY_700 = "#17546E";
const GOLD = "#F2B03D";
const ICE = "#BFD4DC";
const INK = "#111827";
const INK_600 = "#374151";
const INK_400 = "#6B7280";
const SURFACE_ALT = "#F3F4F6";
const CANVAS = "#F7F9FC";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export interface DadosContratoEmail {
  remetenteNome: string;
  tituloContrato: string;
  tipoLabel: string;
  clausulas: ClausulaContrato[];
  baseUrl: string;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function assuntoContrato(d: DadosContratoEmail): string {
  return `Contrato: ${d.tituloContrato}`;
}

/** Versão texto puro — obrigatória (SDD-72): melhora entregabilidade e atende quem lê sem HTML. */
export function textoContrato(d: DadosContratoEmail): string {
  const corpo = d.clausulas.map((c) => `${c.titulo.toUpperCase()}\n${c.paragrafos.join("\n")}`).join("\n\n");
  return `${d.remetenteNome} enviou o contrato de ${d.tipoLabel.toLowerCase()} abaixo: "${d.tituloContrato}".

${corpo}

Qualquer dúvida sobre este contrato, é só responder este e-mail — ele chega direto para ${d.remetenteNome}.

Enviado através do Ser Dono.
${d.baseUrl}`;
}

function clausulaHtml(c: ClausulaContrato): string {
  const paragrafos = c.paragrafos.map((p) => `<p style="font-size:14px;line-height:21px;color:${INK_600};margin:0 0 10px;">${escapeHtml(p)}</p>`).join("");
  return `<tr>
    <td style="padding:0 0 18px;font-family:${FONT};">
      <div style="font-size:13px;font-weight:700;color:${NAVY_700};text-transform:uppercase;letter-spacing:0.4px;margin:0 0 6px;">${escapeHtml(c.titulo)}</div>
      ${paragrafos}
    </td>
  </tr>`;
}

export function htmlContrato(d: DadosContratoEmail): string {
  const remetente = escapeHtml(d.remetenteNome);
  const titulo = escapeHtml(d.tituloContrato);
  const base = d.baseUrl.replace(/\/$/, "");
  const clausulas = d.clausulas.map(clausulaHtml).join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Contrato</title>
<!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${remetente} enviou o contrato "${titulo}".</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${CANVAS};">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:14px;overflow:hidden;">

        <!-- ============ CABEÇALHO ============ -->
        <tr>
          <td style="background-color:${NAVY};padding:28px 32px;font-family:${FONT};">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:${GOLD};text-transform:uppercase;margin:0 0 8px;">Contrato</div>
            <div style="font-size:22px;line-height:28px;font-weight:700;color:#FFFFFF;margin:0 0 6px;">${titulo}</div>
            <div style="font-size:14px;line-height:20px;color:${ICE};margin:0;">Enviado por ${remetente}</div>
          </td>
        </tr>

        <!-- ============ AVISO ============ -->
        <tr>
          <td style="padding:22px 32px 0;font-family:${FONT};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${SURFACE_ALT};border-radius:10px;">
              <tr>
                <td style="padding:14px 18px;font-family:${FONT};">
                  <div style="font-size:13px;line-height:19px;color:${INK_400};margin:0;">Este é um modelo de orientação geral e não substitui a revisão de um advogado antes de ser assinado.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ CLÁUSULAS ============ -->
        <tr>
          <td style="padding:26px 32px 6px;font-family:${FONT};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${clausulas}
            </table>
          </td>
        </tr>

        <!-- ============ RESPOSTA ============ -->
        <tr>
          <td style="padding:6px 32px 26px;font-family:${FONT};">
            <div style="font-size:14px;line-height:21px;color:${INK_600};margin:0;">
              Qualquer dúvida sobre este contrato, é só responder este e-mail — ele chega direto para
              <span style="color:${NAVY_700};font-weight:600;">${remetente}</span>.
            </div>
          </td>
        </tr>

        <!-- ============ RODAPÉ ============ -->
        <tr>
          <td style="background-color:${NAVY};padding:22px 32px;font-family:${FONT};">
            <div style="font-size:13px;color:${ICE};margin:0 0 6px;">Ser Dono — o sócio que você ainda não tem</div>
            <div style="font-size:12px;line-height:19px;color:#8FA3BC;margin:0;">
              Este contrato foi enviado por ${remetente} através do
              <a href="${base}" style="color:${ICE};text-decoration:underline;">serdono.com.br</a>.<br />
              <a href="${base}/privacidade" style="color:#8FA3BC;text-decoration:underline;">Política de Privacidade</a>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
