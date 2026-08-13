// Ser Dono — template do e-mail de convite de reunião (Assistente de
// Reunião, convite por e-mail, 13/08/2026).
//
// Mesma convenção de HTML de e-mail já usada em enviar-email-boas-vindas
// (SDD-72): tabelas aninhadas, estilo inline, hex literal — cliente de
// e-mail não é navegador e não suporta flexbox/grid/CSS var de forma
// confiável.
//
// Diferença de tom em relação ao e-mail de boas-vindas: este não é a Mary
// falando com o usuário do Ser Dono, é o EMPREENDEDOR convidando alguém de
// fora do produto (fornecedor, cliente, investidor...) — a mensagem central
// é a reunião marcada, a marca Ser Dono aparece só como remetente/rodapé.
//
// `tipo`/`tipo_outro_detalhe` de `reunioes` (catálogo Fornecedor/Cliente ou
// prospect/Investidor/...) NUNCA aparece neste e-mail (pedido do dono do
// produto, 13/08/2026) — é rótulo interno de como o empreendedor está se
// preparando, não informação pro convidado.

const NAVY = "#0E3A4F";
const NAVY_700 = "#17546E";
const GOLD = "#F2B03D";
const ICE = "#BFD4DC";
const INK = "#111827";
const INK_600 = "#374151";
const INK_400 = "#6B7280";
const BORDER = "#D1D5DB";
const CANVAS = "#F7F9FC";
const SURFACE_ALT = "#F3F4F6";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export interface DadosConviteReuniao {
  remetenteNome: string;
  nomeNegocio: string;
  dataHoraFormatada: string;
  localTipoLabel: string;
  localValor: string;
  contatoNome?: string | null;
  /** URL assinada (bucket privado), null quando o usuário não tem logo definido. */
  logoUrl?: string | null;
  baseUrl: string;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function primeiroNome(nome: string): string {
  const limpo = nome.trim().split(/\s+/)[0] ?? "";
  return limpo || "seu contato";
}

export function assuntoConvite(d: DadosConviteReuniao): string {
  return `Convite: reunião com ${d.remetenteNome || d.nomeNegocio} — ${d.dataHoraFormatada}`;
}

/** Versão texto puro — obrigatória (SDD-72): melhora entregabilidade e atende quem lê sem HTML. */
export function textoConvite(d: DadosConviteReuniao): string {
  const saudacao = d.contatoNome ? `Olá, ${primeiroNome(d.contatoNome)}!` : "Olá!";
  return `${saudacao}

${d.remetenteNome} (${d.nomeNegocio}) marcou uma reunião com você.

QUANDO
${d.dataHoraFormatada}

ONDE
${d.localTipoLabel}: ${d.localValor}

Qualquer dúvida sobre o encontro, é só responder este e-mail — ele chega direto para ${d.remetenteNome}.

Convite enviado através do Ser Dono.
${d.baseUrl}`;
}

export function htmlConvite(d: DadosConviteReuniao): string {
  const remetente = escapeHtml(d.remetenteNome);
  const nomeNegocio = escapeHtml(d.nomeNegocio);
  const saudacao = d.contatoNome ? `Olá, ${escapeHtml(primeiroNome(d.contatoNome))}!` : "Olá!";
  const base = d.baseUrl.replace(/\/$/, "");
  const logoBloco = d.logoUrl
    ? `<img src="${d.logoUrl}" width="64" height="64" alt="${nomeNegocio}" style="display:block;border:0;outline:none;text-decoration:none;width:64px;height:64px;border-radius:10px;object-fit:cover;background-color:#FFFFFF;" />`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Convite de reunião</title>
<!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${remetente} marcou uma reunião com você — ${escapeHtml(d.dataHoraFormatada)}.</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${CANVAS};">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:14px;overflow:hidden;">

        <!-- ============ CABEÇALHO ============ -->
        <tr>
          <td style="background-color:${NAVY};padding:28px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                ${
                  logoBloco
                    ? `<td width="64" valign="top" style="padding-right:16px;">${logoBloco}</td>`
                    : ""
                }
                <td valign="top" style="font-family:${FONT};">
                  <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:${GOLD};text-transform:uppercase;margin:0 0 8px;">Convite de reunião</div>
                  <div style="font-size:24px;line-height:30px;font-weight:700;color:#FFFFFF;margin:0 0 6px;">${saudacao}</div>
                  <div style="font-size:15px;line-height:22px;color:${ICE};margin:0;">${remetente} (${nomeNegocio}) marcou uma reunião com você.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ DETALHES ============ -->
        <tr>
          <td style="padding:30px 32px 0;font-family:${FONT};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${SURFACE_ALT};border-radius:10px;">
              <tr>
                <td style="padding:20px 22px;font-family:${FONT};">
                  <div style="font-size:12px;color:${INK_400};margin:0 0 3px;">Quando</div>
                  <div style="font-size:18px;font-weight:700;color:${INK};margin:0 0 16px;">${escapeHtml(d.dataHoraFormatada)}</div>

                  <div style="font-size:12px;color:${INK_400};margin:0 0 3px;">${escapeHtml(d.localTipoLabel)}</div>
                  <div style="font-size:16px;color:${INK_600};margin:0;word-break:break-word;">${escapeHtml(d.localValor)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ RESPOSTA ============ -->
        <tr>
          <td style="padding:22px 32px 0;font-family:${FONT};">
            <div style="font-size:14px;line-height:21px;color:${INK_600};margin:0;">
              Qualquer dúvida sobre o encontro, é só responder este e-mail — ele chega direto para
              <span style="color:${NAVY_700};font-weight:600;">${remetente}</span>.
            </div>
          </td>
        </tr>

        <!-- ============ RODAPÉ ============ -->
        <tr>
          <td style="background-color:${NAVY};padding:22px 32px;margin-top:26px;font-family:${FONT};">
            <div style="font-size:13px;color:${ICE};margin:0 0 6px;">Ser Dono — o sócio que você ainda não tem</div>
            <div style="font-size:12px;line-height:19px;color:#8FA3BC;margin:0;">
              Este convite foi enviado por ${remetente} através do
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
