import React from "react";
import { Text, View } from "react-native";
import { color, content, space, type } from "@serdono/ui";

export function Footer({ compact }: { compact: boolean }) {
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
        <Text style={{ ...type.caption, color: "#8FA3BC" }}>Termos · Privacidade · LGPD</Text>
      </View>
    </View>
  );
}
