import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Animated, BackHandler, Dimensions, Easing, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { a11y, color, Logo, motion, radius, space, type } from "@serdono/ui";
import { rotaDoModulo } from "../modulos/rotas";
import { useDrawer } from "./DrawerContext";
import { MenuIcon } from "./MenuIcon";
import { TabIcon, type TabIconName } from "./TabIcon";
import { useModulosExtras } from "./useModulosExtras";

const LARGURA_DRAWER = Math.min(300, Dimensions.get("window").width * 0.82);

/**
 * Menu lateral do app instalado (DS-22, SDD-59) — substitui a aba "Módulos"
 * condicional que vivia na barra de abas (SDD-53/DS-20.1): o rodapé agora é
 * só Início/Jornada/Mary/Perfil, fixo para sempre, e este componente é quem
 * cresce à vontade conforme o catálogo aumenta.
 *
 * Mesmo padrão de overlay já estabelecido em `AppUpdateAlert.tsx` (`Modal
 * transparent` + backdrop escuro), com um painel que desliza da esquerda via
 * `Animated.Value` — mesma técnica de transform já usada em `Button.tsx`/
 * `HoverLift.tsx`, timing `motion.base` (200ms, DS-16).
 */
export function AppDrawer() {
  const router = useRouter();
  const { open, closeDrawer } = useDrawer();
  const { temOutrosModulos, modulos } = useModulosExtras();
  const translateX = useRef(new Animated.Value(-LARGURA_DRAWER)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: open ? 0 : -LARGURA_DRAWER,
      duration: motion.base,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, translateX]);

  // Botão físico "voltar" do Android fecha o drawer em vez de navegar, só
  // enquanto ele estiver aberto — mesmo padrão de interceptação já usado em
  // `AppUpdateAlert.tsx`, mas aqui é dispensável (não bloqueado), só desvia.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeDrawer();
      return true;
    });
    return () => sub.remove();
  }, [open, closeDrawer]);

  function ir(rota: string) {
    closeDrawer();
    router.push(rota as never);
  }

  return (
    <Modal transparent visible={open} animationType="none" statusBarTranslucent onRequestClose={closeDrawer}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        <Animated.View
          style={{
            width: LARGURA_DRAWER,
            backgroundColor: color.bg.surface,
            transform: [{ translateX }],
            shadowColor: "#111827",
            shadowOpacity: 0.16,
            shadowRadius: 24,
            shadowOffset: { width: 4, height: 0 },
            elevation: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: space[5],
              paddingTop: space[10],
              paddingBottom: space[4],
              borderBottomWidth: 1,
              borderBottomColor: color.border.default,
            }}
          >
            <Logo size={26} />
            <Pressable
              onPress={closeDrawer}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
              style={{ minWidth: a11y.minTouchTarget, minHeight: a11y.minTouchTarget, alignItems: "flex-end", justifyContent: "center" }}
            >
              <Text style={{ ...type.h3, color: color.text.secondary }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingVertical: space[3] }}>
            {/* Seção condicional — some inteira se só a Jornada estiver
                liberada (RN-2: nunca listar destino vazio). */}
            {temOutrosModulos ? (
              <View style={{ marginBottom: space[4] }}>
                <DrawerSectionLabel texto="Módulos" />
                {modulos.map((m) => {
                  const rota = rotaDoModulo(m.slug);
                  if (!rota) return null;
                  return (
                    <DrawerItem key={m.id} label={m.nome} onPress={() => ir(rota)} />
                  );
                })}
              </View>
            ) : null}

            <View style={{ marginBottom: space[4] }}>
              <DrawerSectionLabel texto="Aprender" />
              {/* Sempre visível, sem gate de módulo/plano (RN-34) — não é
                  módulo, é área livre a todo mundo. */}
              <DrawerItem label="Dicas da Mary" icon="mary" onPress={() => ir("/dicas-da-mary")} />
            </View>

            <View>
              <DrawerSectionLabel texto="Sistema" />
              {/* Versão do app, dados do desenvolvedor e atalho pro perfil
                  (SDD-84) — Perfil continua aba própria (SDD-53), este é só
                  um complemento pra quem quer essa informação. */}
              <DrawerItem label="Sobre" icon="sobre" onPress={() => ir("/sobre")} />
            </View>
          </ScrollView>
        </Animated.View>

        <Pressable
          onPress={closeDrawer}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
          style={{ flex: 1, backgroundColor: "rgba(17, 24, 39, 0.5)" }}
        />
      </View>
    </Modal>
  );
}

function DrawerSectionLabel({ texto }: { texto: string }) {
  return (
    <Text style={{ ...type.overline, color: color.text.muted, paddingHorizontal: space[5], marginBottom: space[2] }}>
      {texto.toUpperCase()}
    </Text>
  );
}

function DrawerItem({ label, icon = "modulos", onPress }: { label: string; icon?: TabIconName; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space[3],
        minHeight: a11y.minTouchTarget,
        paddingHorizontal: space[5],
      }}
    >
      <TabIcon name={icon} color={color.text.secondary} size={18} />
      <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>{label}</Text>
      <Text style={{ ...type.body, color: color.text.muted }}>›</Text>
    </Pressable>
  );
}
