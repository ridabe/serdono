import React from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, color, content, space, type } from "@serdono/ui";

export function FinalCta({ compact }: { compact: boolean }) {
  const router = useRouter();
  return (
    <View style={{ backgroundColor: color.bg.surface, paddingVertical: space[16], paddingHorizontal: space[4] }}>
      <View style={{ maxWidth: content.maxWidth, width: "100%", alignSelf: "center", alignItems: "center" }}>
        <Text style={{ ...type.h1, color: color.bg.brand, textAlign: "center", marginBottom: space[3] }}>
          Seu negócio não vai se abrir sozinho.
        </Text>
        <Text style={{ ...type.bodyLg, color: color.text.secondary, textAlign: "center", marginBottom: space[6] }}>
          6 minutos de perguntas, e você já sai sabendo qual negócio combina com você — de graça.
        </Text>
        <Button label="Fazer meu diagnóstico grátis" variant="primary" size="md" onPress={() => router.push("/diagnostico")} />
      </View>
    </View>
  );
}
