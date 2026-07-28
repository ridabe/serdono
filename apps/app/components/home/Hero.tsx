import React from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, color, content, space, type } from "@serdono/ui";
import { QuizPreviewCard } from "./QuizPreviewCard";

export function Hero({ compact }: { compact: boolean }) {
  const router = useRouter();
  return (
    <View style={{ backgroundColor: color.bg.brand, paddingHorizontal: compact ? space[4] : space[10], paddingVertical: compact ? space[10] : space[16] }}>
      <View
        style={{
          maxWidth: content.maxWidthWide,
          width: "100%",
          alignSelf: "center",
          flexDirection: compact ? "column" : "row",
          alignItems: "center",
          gap: compact ? space[10] : space[12],
        }}
      >
        <View style={{ flex: compact ? undefined : 1.15, width: compact ? "100%" : undefined }}>
          <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[3] }}>
            O SÓCIO QUE VOCÊ AINDA NÃO TEM
          </Text>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 30 : 42,
              lineHeight: compact ? 38 : 48,
              letterSpacing: -1,
              color: color.text.onBrand,
              marginBottom: space[4],
            }}
          >
            Descubra qual negócio combina com você — e{" "}
            <Text style={{ color: color.action.primary }}>abra ele de verdade</Text>.
          </Text>
          <Text
            style={{
              ...type.bodyLg,
              color: "#C7D3E3",
              marginBottom: space[6],
              maxWidth: 480,
            }}
          >
            Responda 6 minutos de perguntas. A gente cruza seu perfil, seu dinheiro e sua cidade para mostrar quais
            negócios fazem sentido — e depois te acompanha até o primeiro cliente.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginBottom: space[5] }}>
            <Button label="Fazer meu diagnóstico grátis" variant="primary" onPress={() => router.push("/diagnostico")} />
            <Button label="Ver como funciona" variant="ghost" onDark />
          </View>
          <Text style={{ ...type.caption, color: "#8FA3BC" }}>Sem cartão de crédito · Resultado na hora</Text>
        </View>

        <View style={{ width: compact ? "100%" : undefined, flex: compact ? undefined : 0.85, alignItems: compact ? "stretch" : undefined }}>
          <QuizPreviewCard width={compact ? undefined : 420} />
        </View>
      </View>
    </View>
  );
}
