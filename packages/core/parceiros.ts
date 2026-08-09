/**
 * Módulo Parceiros e Fornecedores (pedido do dono do produto, 08/08/2026) —
 * lógica pura (SDD-3). O campo `contato` da base de parceiros é texto livre
 * preenchido pelo admin ("Telefone, e-mail ou WhatsApp", sem formato
 * obrigatório) — aqui só a classificação de como transformar esse texto
 * numa ação clicável, sem tentar validar o dado em si.
 */

export type TipoContato = "telefone" | "email" | "texto";

export interface ContatoClassificado {
  tipo: TipoContato;
  /** Texto original, exibido igual foi cadastrado. */
  exibicao: string;
  /** `tel:`/`mailto:` pronto pra `Linking.openURL` — `null` quando não dá pra montar uma ação (tipo "texto"). */
  href: string | null;
}

/**
 * Um contato conta como "telefone" quando, tirando espaços/pontuação comuns
 * de número de telefone, sobra só dígito (e opcionalmente um `+` na
 * frente) — cobre "(11) 91426-0063", "+55 11 91426-0063", "11914260063".
 * Detecta e-mail pela presença de "@". Qualquer outra coisa (endereço,
 * "fale com o João", Instagram sem link) fica como texto simples, sem virar
 * link — melhor não fingir uma ação do que abrir um `tel:`/`mailto:` quebrado.
 */
export function classificarContato(contato: string | null | undefined): ContatoClassificado | null {
  const texto = contato?.trim();
  if (!texto) return null;

  if (texto.includes("@")) {
    return { tipo: "email", exibicao: texto, href: `mailto:${texto}` };
  }

  const apenasDigitos = texto.replace(/[\s().-]/g, "");
  if (/^\+?\d{8,15}$/.test(apenasDigitos)) {
    return { tipo: "telefone", exibicao: texto, href: `tel:${apenasDigitos}` };
  }

  return { tipo: "texto", exibicao: texto, href: null };
}

/** `site` também é texto livre (SDD-51) — admin pode ter cadastrado sem `http(s)://` na frente. */
export function normalizarUrlSite(site: string): string {
  return /^https?:\/\//i.test(site) ? site : `https://${site}`;
}
