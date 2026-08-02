import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { a11y, color, space, type } from "@serdono/ui";
import { getCurrentSession, listMyModules } from "@serdono/supabase";
import { TabIcon, type TabIconName } from "./TabIcon";

/** Slug do módulo que É a Jornada — ele já tem aba própria, não repete em "Módulos". */
const JORNADA_SLUG = "jornada-empreendedora";

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

const MODULOS_TAB: Tab = { href: "/modulos", label: "Módulos", icon: "modulos", matches: ["/modulos"] };

/**
 * Barra de abas do app instalado (DS-20, SDD-53) — só monta quando
 * `isNativeApp`; na web a navegação continua sendo o cabeçalho de cada tela.
 *
 * A aba "Módulos" é condicional de propósito: enquanto a Jornada for o único
 * módulo liberado pra pessoa, uma aba fixa levaria sempre a uma tela vazia —
 * anunciar função que não existe é exatamente o que RN-2 proíbe. Assim que o
 * admin liberar qualquer outro módulo (SDD-30), a aba aparece sozinha, sem
 * release novo do app. Admin não tem aba: o painel administrativo é web
 * (decisão do dono do produto, 02/08/2026).
 */
export function MobileTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [temOutrosModulos, setTemOutrosModulos] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session || !active) return;
        const modulos = await listMyModules(session.user.id);
        if (!active) return;
        setTemOutrosModulos(modulos.some((m) => m.slug !== JORNADA_SLUG));
      } catch {
        // Falha de rede aqui só esconde uma aba opcional — não vale derrubar
        // a navegação inteira do app por isso.
      }
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  const tabs = temOutrosModulos ? [...BASE_TABS.slice(0, 3), MODULOS_TAB, BASE_TABS[3]] : BASE_TABS;

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
