import React from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button, Logo, color, space, type } from "@serdono/ui";

const links = ["Como funciona", "Planos", "Para quem é", "Ajuda"];

export function NavBar({ compact }: { compact: boolean }) {
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
          <View style={{ flexDirection: "row", gap: space[6] }}>
            {links.map((label) => (
              <Pressable key={label}>
                <Text style={{ fontFamily: type.body.fontFamily, fontSize: 14, fontWeight: "500", color: color.text.secondary }}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: "row", gap: space[2], alignItems: "center" }}>
        {!compact ? <Button label="Entrar" variant="ghost" size="sm" onPress={() => router.push("/login")} /> : null}
        <Button label="Começar grátis" variant="primary" size="sm" onPress={() => router.push("/diagnostico")} />
      </View>
    </View>
  );
}
