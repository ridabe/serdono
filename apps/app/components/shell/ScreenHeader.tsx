import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { a11y, color, isNativeApp, Logo, space, type } from "@serdono/ui";

export interface ScreenHeaderLink {
  label: string;
  onPress: () => void;
}

export interface ScreenHeaderProps {
  /**
   * Links de navegação exibidos só na web — no app instalado esses destinos
   * são abas da `MobileTabBar` (SDD-53), e repeti-los no topo é o defeito que
   * o dono do produto apontou: menu de site dentro de um app.
   */
  webLinks?: ScreenHeaderLink[];
  /** Ações que continuam no topo nas duas plataformas (ex.: "Sair", "← Voltar"). */
  links?: ScreenHeaderLink[];
  /** Elemento livre no fim da linha, só na web (ex.: o avatar do perfil na tela da Mary). */
  webRight?: React.ReactNode;
}

/**
 * Cabeçalho compartilhado das telas autenticadas (DS-20, SDD-53).
 *
 * Substitui a barra que estava duplicada, com padding próprio, em cada tela
 * (Painel, Jornada, Mary, Módulos, Perfil). Além de tirar a duplicação, é o
 * único ponto que precisa saber do recorte de tela do aparelho: o
 * `paddingTop` respeita o inset de status bar / notch no nativo e cai pro
 * espaçamento normal na web, onde inset é sempre 0.
 */
export function ScreenHeader({ webLinks = [], links = [], webRight }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const soWeb = isNativeApp ? [] : webLinks;
  const extra = isNativeApp ? null : webRight;
  const temAlgo = soWeb.length > 0 || links.length > 0 || extra != null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: space[5],
        // Sem inset (web, e Android sem barra sobreposta) mantém o space[6]
        // que as telas já usavam — a migração pra este componente não pode
        // mexer no espaçamento da web. Com inset, o recorte do aparelho já
        // dá a folga do topo e só falta o respiro mínimo até a logo.
        paddingTop: insets.top > 0 ? insets.top + space[3] : space[6],
        paddingBottom: space[3],
        borderBottomWidth: 1,
        borderBottomColor: color.border.default,
        backgroundColor: color.bg.surface,
      }}
    >
      <Logo size={28} />
      {temAlgo ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space[4] }}>
          {soWeb.map((link) => (
            <HeaderLink key={link.label} link={link} />
          ))}
          {links.map((link) => (
            <HeaderLink key={link.label} link={link} />
          ))}
          {extra}
        </View>
      ) : null}
    </View>
  );
}

function HeaderLink({ link }: { link: ScreenHeaderLink }) {
  return (
    <Pressable
      onPress={link.onPress}
      accessibilityRole="button"
      style={{ minHeight: a11y.minTouchTarget, justifyContent: "center" }}
    >
      <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>{link.label}</Text>
    </Pressable>
  );
}
