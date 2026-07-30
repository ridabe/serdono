import React from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, MaryAvatar, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

export function Hero({ compact, onSeeHowItWorks }: { compact: boolean; onSeeHowItWorks: () => void }) {
  const router = useRouter();
  const maryWidth = compact ? 200 : 300;

  return (
    <View
      style={{
        backgroundColor: color.bg.brand,
        paddingHorizontal: compact ? space[4] : space[10],
        paddingVertical: compact ? space[10] : space[16],
      }}
    >
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
        <Reveal style={{ flex: compact ? undefined : 1.15, width: compact ? "100%" : undefined }}>
          <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[3] }}>
            OI, EU SOU A MARY · SUA MENTORA DE NEGÓCIOS
          </Text>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 30 : 44,
              lineHeight: compact ? 38 : 50,
              letterSpacing: -1,
              color: color.text.onBrand,
              marginBottom: space[4],
            }}
          >
            Você não precisa saber tudo para começar.{" "}
            <Text style={{ color: color.action.primary }}>Só o próximo passo.</Text>
          </Text>
          <Text style={{ ...type.bodyLg, color: "#C7D3E3", marginBottom: space[6], maxWidth: 500 }}>
            Eu te acompanho do "não sei o que abrir" até o primeiro cliente pagando: descobrimos seu nicho, validamos a
            ideia, criamos o nome, a marca e o preço. Uma etapa por vez — sem jargão e sem achismo.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginBottom: space[5] }}>
            <Button label="Começar minha jornada" variant="primary" onPress={() => router.push("/diagnostico")} />
            <Button label="Ver como funciona" variant="ghost" onDark onPress={onSeeHowItWorks} />
          </View>
          <Text style={{ ...type.caption, color: "#8FA3BC" }}>
            Grátis para começar · Sem cartão de crédito · Resultado na hora
          </Text>
        </Reveal>

        <Reveal
          delay={motion.revealStagger * 2}
          style={{
            width: compact ? "100%" : undefined,
            flex: compact ? undefined : 0.85,
            alignItems: "center",
          }}
        >
          <View style={{ width: maryWidth }}>
            {/* Halo dourado atrás da foto — separa a Mary do fundo azul-petróleo
                sem recolorir o asset (DS-15: a foto ainda tem fundo próprio). */}
            <View
              style={{
                position: "absolute",
                top: -space[3],
                left: -space[3],
                right: -space[3],
                bottom: -space[3],
                borderRadius: radius.lg + space[3],
                backgroundColor: "rgba(242,176,61,0.14)",
              }}
            />
            <MaryAvatar pose="boas-vindas" size={maryWidth} />

            <View
              style={{
                position: "absolute",
                bottom: compact ? space[4] : space[6],
                left: compact ? -space[2] : -space[6],
                right: space[8],
                backgroundColor: color.bg.surface,
                borderRadius: radius.lg,
                paddingVertical: space[3],
                paddingHorizontal: space[4],
                shadowColor: "#111827",
                shadowOpacity: 0.16,
                shadowRadius: 32,
                shadowOffset: { width: 0, height: 12 },
                elevation: 12,
              }}
            >
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
                "Bora? Eu te mostro cada passo."
              </Text>
              <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>
                Mary · mentora da sua jornada
              </Text>
            </View>
          </View>
        </Reveal>
      </View>
    </View>
  );
}
