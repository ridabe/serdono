// Ser Dono — template do e-mail de boas-vindas (SDD-70).
//
// Por que HTML de tabela com estilo inline, e não o CSS moderno do produto:
// cliente de e-mail não é navegador. Outlook renderiza com o motor do Word,
// Gmail remove <style> em alguns contextos e nenhum deles suporta flexbox,
// grid ou variável CSS de forma confiável. Toda a régua visual sai dos mesmos
// tokens de DESIGN_SYSTEM.md §2/§3, mas escrita à mão como hex e px.
//
// Regras da marca respeitadas aqui:
// - texto sobre dourado é SEMPRE brand.900, nunca branco (DS §2.3);
// - fonte da marca degrada para sans-serif do sistema — e-mail não carrega
//   webfont de forma confiável, então a hierarquia é sustentada por tamanho
//   e peso, não pela presença da Sora;
// - a senha NUNCA aparece (SDD-71).

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

export interface Modulo {
  nome: string;
  descricao: string;
}

export interface DadosEmailBoasVindas {
  nome: string;
  email: string;
  /** URL base pública do produto — usada em links e nas imagens do e-mail. */
  baseUrl: string;
  /** Módulos liberados hoje, na ordem do catálogo. */
  modulos: Modulo[];
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Primeiro nome — o e-mail fala com a pessoa, não com o cadastro. */
export function primeiroNome(nome: string): string {
  const limpo = nome.trim().split(/\s+/)[0] ?? "";
  return limpo || "empreendedor";
}

function blocoModulo(m: Modulo, ultimo: boolean): string {
  return `
              <tr>
                <td style="padding:16px 0;${ultimo ? "" : `border-bottom:1px solid ${BORDER};`}">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <!-- Marcador: glifo simples, sem border-radius nem fundo.
                           Outlook ignora border-radius e transforma "bolinha"
                           em quadrado — um check dourado renderiza igual em
                           todo cliente e não depende de imagem externa. -->
                      <td width="26" valign="top"
                          style="padding-right:10px;font-family:${FONT};font-size:16px;font-weight:700;color:${GOLD};line-height:22px;">
                        &#10003;
                      </td>
                      <td valign="top" style="font-family:${FONT};">
                        <div style="font-size:16px;font-weight:700;color:${NAVY};margin:0 0 4px;">${escapeHtml(m.nome)}</div>
                        <div style="font-size:14px;line-height:21px;color:${INK_600};margin:0;">${escapeHtml(m.descricao)}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

export function assuntoBoasVindas(nome: string): string {
  return `${primeiroNome(nome)}, sua conta no Ser Dono está pronta`;
}

/** Versão texto puro — obrigatória: melhora entregabilidade e atende quem lê sem HTML. */
export function textoBoasVindas(d: DadosEmailBoasVindas): string {
  const modulos = d.modulos.map((m) => `- ${m.nome}: ${m.descricao}`).join("\n");
  return `Olá, ${primeiroNome(d.nome)}!

Sua conta no Ser Dono está criada. A partir de agora você não está mais sozinho nessa: eu sou a Mary e vou te acompanhar em cada passo.

SEUS DADOS DE ACESSO
E-mail: ${d.email}
Senha: a que você escolheu no cadastro.

Por segurança, nunca enviamos sua senha por e-mail. Se esquecer, é só usar "Esqueci minha senha" na tela de login: ${d.baseUrl}/login

O QUE VOCÊ JÁ PODE USAR HOJE
${modulos}

COMO COMEÇAR
1. Entre na sua conta em ${d.baseUrl}/login
2. Confira o resultado do seu diagnóstico e escolha o nicho que vai seguir
3. Abra a Jornada Empreendedora e faça a primeira etapa

Não precisa fazer tudo hoje. Faça uma etapa por vez — é assim que funciona.

Qualquer dúvida, é só responder este e-mail.

Mary — Ser Dono
${d.baseUrl}`;
}

export function htmlBoasVindas(d: DadosEmailBoasVindas): string {
  const nome = escapeHtml(primeiroNome(d.nome));
  const email = escapeHtml(d.email);
  const base = d.baseUrl.replace(/\/$/, "");
  const modulos = d.modulos.map((m, i) => blocoModulo(m, i === d.modulos.length - 1)).join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Bem-vindo ao Ser Dono</title>
<!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<!-- pré-cabeçalho: o trecho que o cliente de e-mail mostra na listagem, antes de abrir -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Sua conta está pronta. Veja como começar e o que você já pode usar hoje.</div>

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

        <!-- ============ MARY DANDO AS BOAS-VINDAS ============ -->
        <tr>
          <td style="background-color:${NAVY};padding:24px 32px 30px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="120" valign="top" style="padding-right:20px;">
                  <img src="${base}/email/mary-boas-vindas.png" width="120" height="150" alt="Mary"
                       style="display:block;border:0;outline:none;text-decoration:none;width:120px;height:150px;border-radius:12px;" />
                </td>
                <td valign="top" style="font-family:${FONT};">
                  <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:${GOLD};text-transform:uppercase;margin:0 0 8px;">Oi, eu sou a Mary</div>
                  <div style="font-size:26px;line-height:33px;font-weight:700;color:#FFFFFF;margin:0 0 10px;">Bem-vindo,<br />${nome}!</div>
                  <div style="font-size:15px;line-height:23px;color:${ICE};margin:0;">Sua conta está pronta. A partir de agora eu te acompanho em cada passo — do que abrir até o negócio funcionando.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ DADOS DE ACESSO ============ -->
        <tr>
          <td style="padding:30px 32px 0;font-family:${FONT};">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:${INK_400};text-transform:uppercase;margin:0 0 12px;">Seus dados de acesso</div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${SURFACE_ALT};border-radius:10px;">
              <tr>
                <td style="padding:18px 20px;font-family:${FONT};">
                  <div style="font-size:12px;color:${INK_400};margin:0 0 3px;">E-mail de acesso</div>
                  <div style="font-size:16px;font-weight:700;color:${INK};margin:0 0 14px;word-break:break-all;">${email}</div>
                  <div style="font-size:12px;color:${INK_400};margin:0 0 3px;">Senha</div>
                  <div style="font-size:15px;color:${INK_600};margin:0;">A que você escolheu no cadastro.</div>
                </td>
              </tr>
            </table>

            <div style="font-size:13px;line-height:20px;color:${INK_400};margin:12px 0 0;">
              Por segurança, nunca enviamos sua senha por e-mail — nem nós conseguimos vê-la. Se esquecer, use
              <a href="${base}/login" style="color:${NAVY_700};font-weight:600;text-decoration:underline;">Esqueci minha senha</a> na tela de login.
            </div>
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
                    Entrar na minha conta
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ O QUE VOCÊ JÁ PODE USAR ============ -->
        <tr>
          <td style="padding:30px 32px 0;font-family:${FONT};">
            <div style="height:1px;background-color:${BORDER};font-size:0;line-height:0;">&nbsp;</div>
            <div style="font-size:20px;font-weight:700;color:${NAVY};margin:26px 0 4px;">O que você já pode usar hoje</div>
            <div style="font-size:14px;line-height:21px;color:${INK_600};margin:0 0 6px;">Está tudo liberado dentro da sua conta. Não precisa usar tudo de uma vez.</div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${modulos}
            </table>
          </td>
        </tr>

        <!-- ============ COMO COMEÇAR ============ -->
        <tr>
          <td style="padding:26px 32px 0;font-family:${FONT};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${CANVAS};border-radius:12px;">
              <tr>
                <td style="padding:22px 22px 18px;font-family:${FONT};">
                  <div style="font-size:17px;font-weight:700;color:${NAVY};margin:0 0 14px;">Por onde começar</div>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="30" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:${GOLD};padding-bottom:12px;">1</td>
                      <td valign="top" style="font-family:${FONT};font-size:14px;line-height:21px;color:${INK_600};padding-bottom:12px;">Entre na sua conta com o e-mail acima.</td>
                    </tr>
                    <tr>
                      <td width="30" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:${GOLD};padding-bottom:12px;">2</td>
                      <td valign="top" style="font-family:${FONT};font-size:14px;line-height:21px;color:${INK_600};padding-bottom:12px;">Veja o resultado do seu diagnóstico e escolha o nicho que vai seguir.</td>
                    </tr>
                    <tr>
                      <td width="30" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:${GOLD};">3</td>
                      <td valign="top" style="font-family:${FONT};font-size:14px;line-height:21px;color:${INK_600};">Abra a Jornada Empreendedora e faça só a primeira etapa. Uma de cada vez — é assim que funciona.</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ ASSINATURA DA MARY ============ -->
        <tr>
          <td style="padding:26px 32px 30px;font-family:${FONT};">
            <div style="font-size:15px;line-height:23px;color:${INK_600};margin:0 0 6px;">
              Qualquer dúvida, é só responder este e-mail. Eu leio.
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
              Você recebeu este e-mail porque criou uma conta em
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
