import React from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { color, content, space, type } from "@serdono/ui";

export function Footer({ compact }: { compact: boolean }) {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: color.bg.brand,
        paddingVertical: space[6],
        paddingHorizontal: compact ? space[4] : space[10],
      }}
    >
      <View
        style={{
          maxWidth: content.maxWidthWide,
          width: "100%",
          alignSelf: "center",
          flexDirection: compact ? "column" : "row",
          justifyContent: "space-between",
          alignItems: compact ? "flex-start" : "center",
          gap: space[2],
        }}
      >
        <Text style={{ ...type.caption, color: "#8FA3BC" }}>© 2026 Ser Dono · serdono.com.br</Text>
        <View style={{ flexDirection: "row", gap: space[4] }}>
          <Pressable onPress={() => router.push("/termos")}>
            <Text style={{ ...type.caption, color: "#8FA3BC" }}>Termos</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/privacidade")}>
            <Text style={{ ...type.caption, color: "#8FA3BC" }}>Privacidade</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/lgpd")}>
            <Text style={{ ...type.caption, color: "#8FA3BC" }}>LGPD</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
