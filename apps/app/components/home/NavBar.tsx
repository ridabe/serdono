import React from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button, Logo, color, radius, space, type } from "@serdono/ui";
import type { HomeSection } from "./HomeScreen";

// Só destinos que existem de verdade. "Planos" saiu do menu: plano pago ainda
// não existe no produto (PRD §12.1 / §17 — gateway é decisão pendente), e
// "Ajuda" não tinha página. Link que não leva a nada é defeito, não conteúdo.
const links: { label: string; section: HomeSection }[] = [
  { label: "A Mary", section: "mentor" },
  { label: "Como funciona", section: "jornada" },
  { label: "Módulos", section: "modulos" },
  { label: "Para quem é", section: "paraQuem" },
];

function NavLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label} style={{ minHeight: 32 }}>
      {({ hovered }: any) => (
        <View style={{ alignItems: "center", gap: space[1] }}>
          <Text
            style={{
              fontFamily: type.body.fontFamily,
              fontSize: 14,
              fontWeight: "500",
              color: hovered ? color.bg.brand : color.text.secondary,
            }}
          >
            {label}
          </Text>
          {/* Sublinhado dourado que aparece no hover — DS-16. */}
          <View
            style={{
              height: 2,
              width: hovered ? "100%" : 0,
              borderRadius: radius.full,
              backgroundColor: color.action.primary,
            }}
          />
        </View>
      )}
    </Pressable>
  );
}

export function NavBar({ compact, onNavigate }: { compact: boolean; onNavigate: (section: HomeSection) => void }) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: compact ? space[4] : space[10],
        paddingVertical: space[4],
        borderBottomWidth: 1,
        borderBottomColor: color.border.default,
        backgroundColor: color.bg.surface,
      }}
    >
      <Logo size={32} />

      {!compact ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginHorizontal: space[8] }}>
          <View style={{ flexDirection: "row", gap: space[6], alignItems: "center" }}>
            {links.map((link) => (
              <NavLink key={link.label} label={link.label} onPress={() => onNavigate(link.section)} />
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: "row", gap: space[2], alignItems: "center" }}>
        {/* "Entrar" sumia inteiro no mobile — só existia mais embaixo, no
            FinalCta ("Já tenho conta"), obrigando quem já tem conta a rolar
            a página inteira pra achar como logar. Sempre visível agora. */}
        <Button label="Entrar" variant="ghost" size="sm" onPress={() => router.push("/login")} />
        <Button label="Começar grátis" variant="primary" size="sm" onPress={() => router.push("/diagnostico")} />
      </View>
    </View>
  );
}
