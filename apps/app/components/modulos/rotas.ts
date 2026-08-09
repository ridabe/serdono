/**
 * Onde cada módulo do catálogo abre (SDD-54/SDD-56).
 *
 * **Este é o único lugar a tocar quando um módulo novo ganha tela.** Mora
 * aqui, e não dentro de uma tela, porque três lugares precisam da mesma
 * resposta: o catálogo (`ModulosScreen`), o card "Seus módulos" do Painel e
 * qualquer atalho futuro. Enquanto o mapa vivia dentro de `ModulosScreen`, o
 * Painel listava os módulos sem conseguir abrir nenhum.
 *
 * Módulo liberado que ainda não tem tela simplesmente não entra aqui: ele
 * continua aparecendo no catálogo, sem virar link pra lugar nenhum (RN-2).
 *
 * Nota pra quem for adicionar módulo: acrescente a linha aqui e pare. A barra
 * de abas do app **não** ganha ícone novo — ela tem teto de 5 e a aba
 * "Módulos" já agrega todos (DS-20.1).
 */
export const ROTA_POR_SLUG: Record<string, string> = {
  "jornada-empreendedora": "/jornada",
  "retencao-clientes": "/retencao",
  "mentoria-investimentos": "/investimentos",
  "meu-negocio-em-dia": "/obrigacoes",
  "plano-acao-mensal": "/plano-acao",
  "parceiros-fornecedores": "/parceiros",
  "checkup-mensal": "/checkup",
};

export function rotaDoModulo(slug: string): string | undefined {
  return ROTA_POR_SLUG[slug];
}
