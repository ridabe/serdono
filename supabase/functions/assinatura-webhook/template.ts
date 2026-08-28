// Ser Dono — template do e-mail de "plano ativado/trocado" (pedido do dono
// do produto, 28/08/2026, mesma sessão que corrigiu o parsing do webhook —
// ver `index.ts`). Mesmo espírito de `enviar-email-boas-vindas/template.ts`:
// tabela + estilo inline (cliente de e-mail não é navegador), tokens de
// DESIGN_SYSTEM.md §2/§3 escritos à mão, texto sobre dourado sempre navy
// (nunca branco).
//
// Dispara na hora que a AbacatePay confirma o pagamento (dentro do próprio
// `assinatura-webhook`, no branch que já ativa a assinatura) — não é o
// usuário que pede este e-mail, como no de boas-vindas.

const NAVY = "#0E3A4F";
const GOLD = "#F2B03D";
const ICE = "#BFD4DC";
const INK = "#111827";
const INK_600 = "#374151";
const INK_400 = "#6B7280";
const BORDER = "#D1D5DB";
const CANVAS = "#F7F9FC";
const SUCCESS_BG = "#EAF7EE";
const SUCCESS = "#1E8E4E";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Duplicado de `packages/core/planos.ts::PLANOS_CATALOGO` — Edge Function não
// importa `@serdono/core` (mesmo motivo já documentado em
// `assinatura-criar-checkout/index.ts`). Só os 2 planos pagos: quem recebe
// este e-mail sempre acabou de pagar por um dos dois, nunca o Gratuito.
const CATALOGO_PLANO: Record<"essencial" | "master", { nome: string; beneficios: string[] }> = {
  essencial: {
    nome: "Essencial",
    beneficios: [
      "Jornada completa, 12 fases",
      "Nome da empresa e logo",
      "Calculadora de Precificação",
      "Meu Negócio em Dia",
      "Parceiros e Fornecedores",
      "A Mary responde",
    ],
  },
  master: {
    nome: "Master",
    beneficios: [
      "Tudo do Essencial",
      "Check-up Mensal do Negócio",
      "Plano de Ação Mensal",
      "Raio-X Financeiro",
      "Nível de Maturidade e Ser Dono Score",
      "Retenção de Clientes",
      "Assistente de Reunião e de Contrato",
      "Mentoria em Investimentos",
    ],
  },
};

export interface DadosEmailPlanoAtivado {
  nome: string;
  email: string;
  plano: "essencial" | "master";
  precoCentavos: number;
  /** ISO — quando a AbacatePay confirmou o pagamento (`renovado_em`/`iniciado_em` da subscription). */
  dataPagamento: string;
  /** `true` quando o usuário já teve alguma assinatura antes desta (trocou de plano) — muda o tom do texto. */
  trocaDePlano: boolean;
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

function blocoBeneficio(texto: string, ultimo: boolean): string {
  return `
              <tr>
                <td style="padding:14px 0;${ultimo ? "" : `border-bottom:1px solid ${BORDER};`}">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="26" valign="top"
                          style="padding-right:10px;font-family:${FONT};font-size:16px;font-weight:700;color:${GOLD};line-height:22px;">
                        &#10003;
                      </td>
                      <td valign="top" style="font-family:${FONT};font-size:15px;line-height:22px;color:${INK_600};">${escapeHtml(texto)}</td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

export function assuntoPlanoAtivado(d: DadosEmailPlanoAtivado): string {
  const plano = CATALOGO_PLANO[d.plano].nome;
  return d.trocaDePlano ? `${primeiroNome(d.nome)}, seu plano agora é o ${plano}` : `${primeiroNome(d.nome)}, seu plano ${plano} está ativo`;
}

/** Versão texto puro — obrigatória: melhora entregabilidade e atende quem lê sem HTML. */
export function textoPlanoAtivado(d: DadosEmailPlanoAtivado): string {
  const plano = CATALOGO_PLANO[d.plano];
  const beneficios = plano.beneficios.map((b) => `- ${b}`).join("\n");
  const titulo = d.trocaDePlano ? `Seu plano agora é o ${plano.nome}!` : `Seu plano ${plano.nome} está ativo!`;

  return `Olá, ${primeiroNome(d.nome)}!

${titulo} Recebi a confirmação de pagamento da AbacatePay e já liberei tudo pra você.

PAGAMENTO CONFIRMADO
Plano: ${plano.nome}
Valor: ${formatMoney(d.precoCentavos)}
Data: ${formatData(d.dataPagamento)}

O QUE ACABOU DE SER LIBERADO
${beneficios}

Entre na sua conta agora: ${d.baseUrl}/login

Qualquer dúvida sobre a cobrança ou o plano, é só responder este e-mail.

Mary — Ser Dono
${d.baseUrl}`;
}

export function htmlPlanoAtivado(d: DadosEmailPlanoAtivado): string {
  const nome = escapeHtml(primeiroNome(d.nome));
  const base = d.baseUrl.replace(/\/$/, "");
  const plano = CATALOGO_PLANO[d.plano];
  const beneficios = plano.beneficios.map((b, i) => blocoBeneficio(b, i === plano.beneficios.length - 1)).join("");
  const titulo = d.trocaDePlano ? `Seu plano agora é o<br />${plano.nome}!` : `Seu plano ${plano.nome}<br />está ativo!`;
  const preheader = d.trocaDePlano
    ? `Pagamento confirmado — você já está no plano ${plano.nome}.`
    : `Pagamento confirmado — seu plano ${plano.nome} já está liberado.`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Seu plano no Ser Dono</title>
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

        <!-- ============ MARY CONFIRMANDO O PLANO ============ -->
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
                  <div style="font-size:26px;line-height:33px;font-weight:700;color:#FFFFFF;margin:0 0 10px;">${titulo}</div>
                  <div style="font-size:15px;line-height:23px;color:${ICE};margin:0;">Recebi a confirmação de pagamento da AbacatePay e já liberei tudo pra você.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ PAGAMENTO CONFIRMADO ============ -->
        <tr>
          <td style="padding:30px 32px 0;font-family:${FONT};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${SUCCESS_BG};border-radius:10px;">
              <tr>
                <td style="padding:18px 20px;font-family:${FONT};">
                  <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:${SUCCESS};text-transform:uppercase;margin:0 0 12px;">&#10003; Pagamento confirmado</div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="50%" valign="top">
                        <div style="font-size:12px;color:${INK_400};margin:0 0 3px;">Plano</div>
                        <div style="font-size:16px;font-weight:700;color:${INK};margin:0;">${escapeHtml(plano.nome)}</div>
                      </td>
                      <td width="50%" valign="top">
                        <div style="font-size:12px;color:${INK_400};margin:0 0 3px;">Valor pago</div>
                        <div style="font-size:16px;font-weight:700;color:${INK};margin:0;">${formatMoney(d.precoCentavos)}</div>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top:14px;">
                        <div style="font-size:12px;color:${INK_400};margin:0 0 3px;">Data</div>
                        <div style="font-size:15px;color:${INK_600};margin:0;">${escapeHtml(formatData(d.dataPagamento))}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ BOTÃO PRINCIPAL ============ -->
        <tr>
          <td align="center" style="padding:26px 32px 6px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="background-color:${GOLD};border-radius:10px;">
                  <a href="${base}/login"
                     style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:16px;font-weight:700;color:${NAVY};text-decoration:none;">
                    Acessar minha conta
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ O QUE FOI LIBERADO ============ -->
        <tr>
          <td style="padding:30px 32px 0;font-family:${FONT};">
            <div style="height:1px;background-color:${BORDER};font-size:0;line-height:0;">&nbsp;</div>
            <div style="font-size:20px;font-weight:700;color:${NAVY};margin:26px 0 4px;">O que acabou de ser liberado</div>
            <div style="font-size:14px;line-height:21px;color:${INK_600};margin:0 0 6px;">Já está tudo dentro da sua conta.</div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${beneficios}
            </table>
          </td>
        </tr>

        <!-- ============ ASSINATURA DA MARY ============ -->
        <tr>
          <td style="padding:26px 32px 30px;font-family:${FONT};">
            <div style="font-size:15px;line-height:23px;color:${INK_600};margin:0 0 6px;">
              Qualquer dúvida sobre a cobrança ou o plano, é só responder este e-mail. Eu leio.
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
              Você recebeu este e-mail porque uma assinatura foi confirmada na sua conta em
              <a href="${base}" style="color:${ICE};text-decoration:underline;">serdono.com.br</a>.<br />
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
