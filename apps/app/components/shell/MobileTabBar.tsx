import React from "react";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { a11y, color, space, type } from "@serdono/ui";
import { TabIcon, type TabIconName } from "./TabIcon";

interface Tab {
  href: string;
  label: string;
  icon: TabIconName;
  /** Prefixos de rota que acendem esta aba. */
  matches: string[];
}

const BASE_TABS: Tab[] = [
  { href: "/inicio", label: "Início", icon: "inicio", matches: ["/inicio"] },
  { href: "/jornada", label: "Jornada", icon: "jornada", matches: ["/jornada"] },
  { href: "/assistente", label: "Mary", icon: "mary", matches: ["/assistente"] },
  { href: "/perfil", label: "Perfil", icon: "perfil", matches: ["/perfil", "/completar-cadastro"] },
];

/**
 * Barra de abas do app instalado (DS-20/DS-22, SDD-53/SDD-59) — só monta
 * quando `isNativeApp`; na web a navegação continua sendo o cabeçalho de
 * cada tela.
 *
 * **INVARIANTE ATUAL: 4 abas fixas, para sempre — nada aqui cresce.** Até a
 * SDD-59 este arquivo tinha uma 5ª aba agregadora condicional ("Módulos"),
 * teto que a SDD-53 fixou em 5. O dono do produto pediu, em 03/08/2026, pra
 * ir além: em vez de uma aba que absorve o catálogo inteiro, o catálogo (e
 * qualquer área nova que não seja módulo, como "Dicas da Mary") passou a
 * viver no `AppDrawer.tsx` — menu lateral que cresce à vontade, sem disputar
 * espaço com a navegação principal. Quem for adicionar módulo: mexa em
 * `ROTA_POR_SLUG` (`rotas.ts`) e no `AppDrawer`; este arquivo nunca precisa
 * mudar de novo por causa de catálogo.
 */
export function MobileTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const tabs = BASE_TABS;

  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: color.border.default,
        backgroundColor: color.bg.surface,
        paddingTop: space[2],
        paddingBottom: Math.max(insets.bottom, space[2]),
      }}
    >
      {tabs.map((tab) => {
        const ativa = tab.matches.some((m) => pathname === m || pathname.startsWith(`${m}/`));
        const tint = ativa ? color.action.secondary : color.text.muted;
        return (
          <Pressable
            key={tab.href}
            onPress={() => router.navigate(tab.href as never)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: ativa }}
            style={{
              flex: 1,
              minHeight: a11y.minTouchTarget,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {/* Indicador de aba ativa não é só cor — DS-2: cor sozinha nunca carrega
                estado. O traço dourado no topo é o segundo sinal. */}
            <View
              style={{
                position: "absolute",
                top: -space[2],
                height: 2,
                width: 28,
                backgroundColor: ativa ? color.action.primary : "transparent",
              }}
            />
            <TabIcon name={tab.icon} color={tint} />
            <Text style={{ ...type.caption, color: tint, fontWeight: ativa ? "700" : "500" }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
