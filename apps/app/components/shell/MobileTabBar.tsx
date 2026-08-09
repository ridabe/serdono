import React from "react";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { a11y, color, IconBadge, moduleAccent, space, type, type ModuleAccent } from "@serdono/ui";
import { TabIcon, type TabIconName } from "./TabIcon";

interface Tab {
  href: string;
  label: string;
  icon: TabIconName;
  /** Cor própria da aba (pedido do dono do produto, 09/08/2026: menu sempre visível
      merecia mais destaque que ícone monocromático) — mesma paleta de `moduleAccent`
      já usada no catálogo de módulos (DS-23), reaproveitada aqui como identidade fixa
      por aba, não cíclica (as 4 abas não mudam, então a cor de cada uma também não). */
  accent: ModuleAccent;
  /** Prefixos de rota que acendem esta aba. */
  matches: string[];
}

const BASE_TABS: Tab[] = [
  { href: "/inicio", label: "Início", icon: "inicio", accent: "teal", matches: ["/inicio"] },
  { href: "/jornada", label: "Jornada", icon: "jornada", accent: "gold", matches: ["/jornada"] },
  // Não é mais "Mary"/`/assistente` (pedido do dono do produto, 09/08/2026):
  // essa rota já tem 1 toque de distância em qualquer tela via o botão
  // flutuante (`MaryFloatingButton.tsx`) — a aba levava pro MESMO destino,
  // pura redundância. "Dicas da Mary" entrou no lugar: era uma "área livre"
  // (RN-34) meio escondida só no menu lateral, e ganhar aba própria também
  // liberou espaço na Início (o card resumo de lá saiu, virou redundante
  // com esta aba — ver `DashboardScreen.tsx`).
  { href: "/dicas-da-mary", label: "Dicas", icon: "dicas", accent: "blue", matches: ["/dicas-da-mary"] },
  { href: "/perfil", label: "Perfil", icon: "perfil", accent: "green", matches: ["/perfil", "/completar-cadastro"] },
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
        const tons = moduleAccent[tab.accent];
        // Rótulo colorido só na aba ativa usa o mesmo tom de `tons.bg` (a cor
        // saturada do acento) — já validado como texto legível em fundo claro
        // pelo próprio design system (é o mesmo valor usado como `text` dos
        // acentos equivalentes em `CollapsibleSection`, ex.: `gold` = mesmo
        // `color.action.primaryHover`), não uma cor nova sem checar contraste.
        const corRotulo = ativa ? tons.bg : color.text.muted;
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
              gap: 4,
            }}
          >
            {/* Estado ativo não depende só de cor (DS-2): o círculo colorido
                (presença/ausência) e o negrito no rótulo são os sinais
                estruturais — a cor em si é só reforço visual. */}
            {ativa ? (
              <IconBadge accent={tab.accent} size={36}>
                <TabIcon name={tab.icon} color={tons.fg} size={18} />
              </IconBadge>
            ) : (
              <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
                <TabIcon name={tab.icon} color={tons.bg} size={20} />
              </View>
            )}
            <Text style={{ ...type.caption, color: corRotulo, fontWeight: ativa ? "700" : "500" }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
