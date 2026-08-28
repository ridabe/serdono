// Ser Dono — template do e-mail "não detectamos o pagamento da sua
// assinatura" (pedido do dono do produto, 28/08/2026). Mesmo espírito de
// `assinatura-webhook/template.ts`: tabela + estilo inline, tokens de
// DESIGN_SYSTEM.md §2/§3 escritos à mão, voz da Mary em 1ª pessoa.
//
// Dispara uma vez só, no instante em que `assinatura-verificar-vencidas`
// detecta que o ciclo de cobrança passou sem um `subscription.renewed` da
// AbacatePay — nunca a cada rodada do cron (idempotência vem da própria
// transição de status `ativa` → `inadimplente`, ver `index.ts`).

const NAVY = "#0E3A4F";
const GOLD = "#F2B03D";
const ICE = "#BFD4DC";
const INK = "#111827";
const INK_600 = "#374151";
const INK_400 = "#6B7280";
const CANVAS = "#F7F9FC";
const WARNING_BG = "#FFF6E5";
const WARNING = "#B4790A";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const LABEL_PLANO: Record<"essencial" | "master", string> = { essencial: "Essencial", master: "Master" };

export interface DadosEmailAssinaturaVencida {
  nome: string;
  email: string;
  plano: "essencial" | "master";
  precoCentavos: number;
  /** ISO — quando o rebaixamento automático pro Gratuito acontece se o pagamento não for regularizado. */
  prazoLimite: string;
  baseUrl: string;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function primeiroNome(nome: string): string {
  const limpo = nome.trim().split(/\s+/)[0] ?? "";
  return limpo || "empreendedor";
}

function formatMoney(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;
}

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function assuntoAssinaturaVencida(d: DadosEmailAssinaturaVencida): string {
  return `${primeiroNome(d.nome)}, não recebi o pagamento da sua assinatura`;
}

/** Versão texto puro — obrigatória: melhora entregabilidade e atende quem lê sem HTML. */
export function textoAssinaturaVencida(d: DadosEmailAssinaturaVencida): string {
  const plano = LABEL_PLANO[d.plano];
  return `Olá, ${primeiroNome(d.nome)}!

Sua mensalidade do plano ${plano} (${formatMoney(d.precoCentavos)}) venceu e eu ainda não recebi a confirmação de pagamento da AbacatePay.

O QUE ACONTECE AGORA
Seu acesso ao plano ${plano} continua liberado até ${formatData(d.prazoLimite)}. Se o pagamento não for regularizado até lá, sua conta volta pro plano Gratuito — os módulos do plano ${plano} ficam bloqueados, mas nada do que você já fez se perde: suas etapas concluídas, dados e histórico continuam guardados exatamente como estão.

Assim que o pagamento for confirmado (de novo pela AbacatePay ou assinando de novo), tudo volta a ficar liberado imediatamente, do jeito que você deixou.

Regularizar agora: ${d.baseUrl}/planos

Qualquer dúvida sobre a cobrança, é só responder este e-mail.

Mary — Ser Dono
${d.baseUrl}`;
}

export function htmlAssinaturaVencida(d: DadosEmailAssinaturaVencida): string {
  const nome = escapeHtml(primeiroNome(d.nome));
  const base = d.baseUrl.replace(/\/$/, "");
  const plano = LABEL_PLANO[d.plano];
  const preheader = `Sua mensalidade do plano ${plano} venceu — regularize até ${formatData(d.prazoLimite)} pra não perder o acesso.`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Pagamento da assinatura não detectado</title>
<!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${CANVAS};">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:14px;overflow:hidden;">

        <!-- ============ CABEÇALHO ============ -->
        <tr>
          <td style="background-color:${NAVY};padding:28px 32px 0;">
            <img src="${base}/email/logo-serdono-branco.png" width="150" height="46" alt="Ser Dono"
                 style="display:block;border:0;outline:none;text-decoration:none;width:150px;height:auto;" />
          </td>
        </tr>

        <!-- ============ MARY AVISANDO ============ -->
        <tr>
          <td style="background-color:${NAVY};padding:24px 32px 30px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="120" valign="top" style="padding-right:20px;">
                  <img src="${base}/email/mary-boas-vindas.png" width="120" height="150" alt="Mary"
                       style="display:block;border:0;outline:none;text-decoration:none;width:120px;height:150px;border-radius:12px;" />
                </td>
                <td valign="top" style="font-family:${FONT};">
                  <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:${GOLD};text-transform:uppercase;margin:0 0 8px;">Oi, ${nome}</div>
                  <div style="font-size:24px;line-height:31px;font-weight:700;color:#FFFFFF;margin:0 0 10px;">Não recebi o pagamento da sua assinatura</div>
                  <div style="font-size:15px;line-height:23px;color:${ICE};margin:0;">Sua mensalidade do plano ${escapeHtml(plano)} venceu e a AbacatePay ainda não confirmou o pagamento.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ PRAZO ============ -->
        <tr>
          <td style="padding:30px 32px 0;font-family:${FONT};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${WARNING_BG};border-radius:10px;">
              <tr>
                <td style="padding:18px 20px;font-family:${FONT};">
                  <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:${WARNING};text-transform:uppercase;margin:0 0 10px;">Prazo pra regularizar</div>
                  <div style="font-size:16px;font-weight:700;color:${INK};margin:0 0 6px;">Até ${escapeHtml(formatData(d.prazoLimite))}</div>
                  <div style="font-size:14px;line-height:21px;color:${INK_600};margin:0;">
                    Até lá, seu plano ${escapeHtml(plano)} (${formatMoney(d.precoCentavos)}/mês) continua liberado normalmente. Depois desse prazo sem confirmação, sua conta volta pro plano Gratuito.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ TRANQUILIZA SOBRE OS DADOS ============ -->
        <tr>
          <td style="padding:22px 32px 0;font-family:${FONT};">
            <div style="font-size:15px;line-height:23px;color:${INK_600};margin:0;">
              <strong style="color:${INK};">Nada do que você já fez se perde.</strong> Suas etapas concluídas, dados e histórico continuam guardados exatamente como estão — só os módulos do plano ${escapeHtml(plano)} ficam bloqueados enquanto a assinatura não for regularizada. Assim que o pagamento for confirmado, tudo volta a ficar liberado na hora, do jeito que você deixou.
            </div>
          </td>
        </tr>

        <!-- ============ BOTÃO PRINCIPAL ============ -->
        <tr>
          <td align="center" style="padding:26px 32px 6px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="background-color:${GOLD};border-radius:10px;">
                  <a href="${base}/planos"
                     style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:16px;font-weight:700;color:${NAVY};text-decoration:none;">
                    Regularizar agora
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ ASSINATURA DA MARY ============ -->
        <tr>
          <td style="padding:26px 32px 30px;font-family:${FONT};">
            <div style="font-size:15px;line-height:23px;color:${INK_600};margin:0 0 6px;">
              Qualquer dúvida sobre a cobrança, é só responder este e-mail. Eu leio.
            </div>
            <div style="font-size:15px;font-weight:700;color:${NAVY};margin:0;">Mary</div>
            <div style="font-size:13px;color:${INK_400};margin:2px 0 0;">Sua parceira no Ser Dono</div>
          </td>
        </tr>

        <!-- ============ RODAPÉ ============ -->
        <tr>
          <td style="background-color:${NAVY};padding:22px 32px;font-family:${FONT};">
            <div style="font-size:13px;color:${ICE};margin:0 0 6px;">Ser Dono — o sócio que você ainda não tem</div>
            <div style="font-size:12px;line-height:19px;color:#8FA3BC;margin:0;">
              Você recebeu este e-mail porque sua assinatura em
              <a href="${base}" style="color:${ICE};text-decoration:underline;">serdono.com.br</a> venceu sem pagamento confirmado.<br />
              <a href="${base}/privacidade" style="color:#8FA3BC;text-decoration:underline;">Política de Privacidade</a> &nbsp;·&nbsp;
              <a href="${base}/termos" style="color:#8FA3BC;text-decoration:underline;">Termos de Uso</a>
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
