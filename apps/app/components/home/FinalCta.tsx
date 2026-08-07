import React from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, MaryAvatar, Reveal, color, content, motion, space, type } from "@serdono/ui";

export function FinalCta({ compact }: { compact: boolean }) {
  const router = useRouter();
  return (
    <View style={{ backgroundColor: color.bg.surface, paddingVertical: compact ? space[10] : space[16], paddingHorizontal: space[4] }}>
      <View
        style={{
          maxWidth: content.maxWidthWide,
          width: "100%",
          alignSelf: "center",
          flexDirection: compact ? "column" : "row",
          alignItems: "center",
          gap: compact ? space[8] : space[12],
        }}
      >
        <Reveal style={{ alignItems: "center" }}>
          <MaryAvatar pose="checklist" size={compact ? 150 : 200} />
        </Reveal>

        <Reveal delay={motion.revealStagger} style={{ flex: compact ? undefined : 1, width: compact ? "100%" : undefined }}>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 26 : 34,
              lineHeight: compact ? 34 : 42,
              color: color.bg.brand,
              textAlign: compact ? "center" : "left",
              marginBottom: space[3],
            }}
          >
            Seu negócio não vai se abrir sozinho.{"\n"}
            <Text style={{ color: color.action.primaryHover }}>Mas você também não está.</Text>
          </Text>
          <Text
            style={{
              ...type.bodyLg,
              color: color.text.secondary,
              textAlign: compact ? "center" : "left",
              marginBottom: space[6],
              maxWidth: 520,
            }}
          >
            São 6 minutos de perguntas. No fim, você sai sabendo quais negócios combinam com você e por quê — e a Mary
            já te espera na primeira etapa.
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: space[3],
              justifyContent: compact ? "center" : "flex-start",
            }}
          >
            <Button label="Começar minha jornada" variant="primary" onPress={() => router.push("/diagnostico")} />
            <Button label="Já tenho conta" variant="outline" onPress={() => router.push("/login")} />
          </View>
        </Reveal>
      </View>
    </View>
  );
}
