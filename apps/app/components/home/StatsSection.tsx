import React from "react";
import { Text, View } from "react-native";
import { color, content, space, type } from "@serdono/ui";

// RN-20 (PRD §13): todo dado de mercado citado tem fonte e data visíveis.
const stats = [
  { value: "2,05 mi", label: "pequenos negócios abertos\nem 4 meses de 2026" },
  { value: "6 em 10", label: "fecham em até 5 anos —\nquase sempre pelos mesmos motivos" },
  { value: "78%", label: "das novas empresas\nsão MEI" },
];

export function StatsSection({ compact }: { compact: boolean }) {
  return (
    <View style={{ backgroundColor: color.bg.canvas, paddingVertical: space[12], paddingHorizontal: space[4] }}>
      <View
        style={{
          maxWidth: content.maxWidthWide,
          width: "100%",
          alignSelf: "center",
          flexDirection: compact ? "column" : "row",
          justifyContent: "center",
          gap: compact ? space[8] : space[16],
        }}
      >
        {stats.map((s) => (
          <View key={s.value} style={{ alignItems: "center" }}>
            <Text style={{ ...type.display, fontSize: 32, color: color.bg.brand }}>{s.value}</Text>
            <Text style={{ ...type.caption, textAlign: "center", marginTop: space[1] }}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Text style={{ ...type.caption, textAlign: "center", marginTop: space[8] }}>
        Fonte: Sebrae — Mapa de Empresas e Boletim de Sobrevivência, 2026
      </Text>
    </View>
  );
}
