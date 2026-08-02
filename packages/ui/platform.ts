import { Platform } from "react-native";

/**
 * Fronteira única entre "app instalado" e "site aberto no navegador" — SDD-53.
 *
 * O código de tela é o mesmo nas três plataformas (SDD-1); o que muda é o
 * *shell*: quem entra pela Play Store já baixou o produto, então não vê a
 * landing de venda nem um menu de links no topo — vê a tela de boas-vindas
 * do app e uma barra de abas embaixo.
 *
 * `Platform.OS === "web"` é `true` tanto no desktop quanto no navegador do
 * celular, de propósito: web mobile continua sendo web (o usuário chegou por
 * um link e precisa da landing pra entender o que é o produto). A diferença
 * entre web larga e web estreita continua sendo responsividade por
 * `useWindowDimensions`/`breakpoint`, não esta constante.
 */
export const isNativeApp = Platform.OS !== "web";

/** Complemento de `isNativeApp` — web de desktop e web mobile. */
export const isWebPlatform = Platform.OS === "web";
