import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button, color, radius, space, type } from "@serdono/ui";

// RN-5 (PRD §13): capital sempre em faixas, nunca valor numérico livre.
const options = ["Até R$ 5 mil", "De R$ 5 mil a R$ 15 mil", "De R$ 15 mil a R$ 40 mil", "Mais de R$ 40 mil"];

export function QuizPreviewCard({ width }: { width?: number }) {
  const router = useRouter();
  const [selected, setSelected] = useState(1);

  return (
    <View
      style={{
        width,
        backgroundColor: color.bg.surface,
        borderRadius: radius.lg,
        padding: space[6],
        shadowColor: "#111827",
        shadowOpacity: 0.16,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
      }}
    >
      <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>BLOCO 1 DE 7</Text>

      <View style={{ height: 8, borderRadius: radius.full, backgroundColor: color.border.default, overflow: "hidden", marginBottom: space[4] }}>
        <View style={{ width: "14%", height: "100%", backgroundColor: color.action.primary, borderRadius: radius.full }} />
      </View>

      <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>
        Quanto você tem guardado para começar?
      </Text>
      <Text style={{ ...type.caption, marginBottom: space[3] }}>
        Não precisa ser exato — é só pra entender seu ponto de partida.
      </Text>

      <View style={{ gap: space[2], marginBottom: space[4] }}>
        {options.map((label, i) => {
          const isSelected = i === selected;
          return (
            <Pressable
              key={label}
              onPress={() => setSelected(i)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space[3],
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? color.bg.brand : color.border.default,
                backgroundColor: isSelected ? "#F5F9FB" : "transparent",
                borderRadius: radius.md,
                paddingVertical: space[3],
                paddingHorizontal: space[3],
                minHeight: 44,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: radius.full,
                  borderWidth: 2,
                  borderColor: isSelected ? color.bg.brand : color.border.default,
                  backgroundColor: isSelected ? color.bg.brand : "transparent",
                }}
              />
              <Text style={{ ...type.body, fontWeight: isSelected ? "600" : "400", color: color.text.primary }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button label="Continuar" variant="secondary" fullWidth onPress={() => router.push("/diagnostico")} />
    </View>
  );
}
