import React, { useState } from "react";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { a11y, breakpoint, color, isNativeApp, Logo, radius, space, type } from "@serdono/ui";
import { useDrawer } from "./DrawerContext";
import { MenuIcon } from "./MenuIcon";

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
 *
 * **Web em tela estreita (celular/tablet pelo navegador) vira menu-gaveta,
 * não fica mais em linha (correção de bug relatada pelo dono do produto em
 * 07/08/2026).** Antes, `webLinks`/`links`/`webRight` sempre renderizavam
 * numa única linha ao lado da logo — em tela larga isso é o menu de site
 * normal, mas em `width < breakpoint.medium` a linha não cabia: os botões
 * coloriam a logo (sem `space-between` sobrando, porque a linha já
 * ultrapassava a largura da tela) e, pior, a página inteira ganhava rolagem
 * horizontal pra tentar alcançar o último item — arrastando a tela toda de
 * lado, não só o menu. Agora, abaixo de `breakpoint.medium`, o mesmo espaço
 * onde ficaria a linha vira um botão de hambúrguer (mesmo ícone/posição já
 * usados no app nativo) que abre uma folha com os itens empilhados
 * verticalmente — sem depender de rolagem horizontal nenhuma.
 */
export function ScreenHeader({ webLinks = [], links = [], webRight }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { width } = useWindowDimensions();
  // Só se aplica na web — o app instalado já tem seu próprio menu-gaveta
  // (`AppDrawer`/`openDrawer`), aberto pelo mesmo ícone de hambúrguer.
  const compactWeb = !isNativeApp && width < breakpoint.medium;
  const [menuOpen, setMenuOpen] = useState(false);

  const soWeb = isNativeApp ? [] : webLinks;
  const extra = isNativeApp ? null : webRight;
  const temAlgo = soWeb.length > 0 || links.length > 0 || extra != null;
  const itensMenu = [...soWeb, ...links];

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
      <View style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
        {/* Gatilho do menu lateral (DS-22, SDD-59) no app instalado; na web
            estreita é o mesmo ícone, mas abre a folha logo abaixo em vez do
            drawer nativo (o conteúdo é diferente: aqui são os `webLinks` da
            própria tela, não o catálogo de módulos). */}
        {isNativeApp || (compactWeb && temAlgo) ? (
          <Pressable
            onPress={isNativeApp ? openDrawer : () => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            style={{ minWidth: a11y.minTouchTarget, minHeight: a11y.minTouchTarget, alignItems: "center", justifyContent: "center" }}
          >
            <MenuIcon color={color.text.primary} />
          </Pressable>
        ) : null}
        <Logo size={28} />
      </View>
      {temAlgo && !compactWeb ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space[4] }}>
          {itensMenu.map((link) => (
            <HeaderLink key={link.label} link={link} />
          ))}
          {extra}
        </View>
      ) : null}

      {compactWeb ? (
        <MobileHeaderMenu open={menuOpen} onClose={() => setMenuOpen(false)} itens={itensMenu} extra={extra} />
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

/**
 * Folha do menu em web estreita — mesmo padrão de overlay já usado em
 * `AppDrawer.tsx`/`AppUpdateAlert.tsx` (`Modal transparent` + backdrop),
 * trocando só a ancoragem (topo, abaixo do cabeçalho, em vez de lateral ou
 * centralizado) porque este menu representa a mesma linha de links que
 * apareceria ao lado da logo em tela larga.
 */
function MobileHeaderMenu({
  open,
  onClose,
  itens,
  extra,
}: {
  open: boolean;
  onClose: () => void;
  itens: ScreenHeaderLink[];
  extra: React.ReactNode;
}) {
  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar menu"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(17, 24, 39, 0.5)" }}
      >
        <View
          // Empurra a folha pra logo abaixo do cabeçalho (mesma fórmula de
          // altura do cabeçalho: paddingTop space[6] + paddingBottom space[3]
          // + altura do botão/logo ~44dp) — não precisa medir de verdade,
          // é sempre a mesma altura fixa na web (sem inset de notch aqui).
          style={{ marginTop: space[6] + space[3] + a11y.minTouchTarget, marginHorizontal: space[4] }}
        >
          {/* Pressable interno some o toque de "fechar" do backdrop por trás. */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: color.bg.surface,
              borderRadius: radius.lg,
              paddingVertical: space[2],
              shadowColor: "#111827",
              shadowOpacity: 0.16,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 8 },
              elevation: 16,
            }}
          >
            {itens.map((link) => (
              <Pressable
                key={link.label}
                onPress={() => {
                  onClose();
                  link.onPress();
                }}
                accessibilityRole="button"
                style={{ minHeight: a11y.minTouchTarget, justifyContent: "center", paddingHorizontal: space[5] }}
              >
                <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>{link.label}</Text>
              </Pressable>
            ))}
            {extra ? (
              <View style={{ paddingHorizontal: space[5], paddingTop: space[2], alignItems: "flex-start" }}>{extra}</View>
            ) : null}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
