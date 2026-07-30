import React from "react";
import { Text, View } from "react-native";
import { MaryAvatar, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

/**
 * Substitui o antigo `TestimonialSection`, que trazia um depoimento fabricado
 * herdado do mockup de conceito — prova social inventada não vai para produção.
 * Aqui a diferenciação vem do combinado explícito com o usuário, que é
 * verdadeiro e verificável: cada item corresponde a uma regra real do produto
 * (RN-1, RN-20, RN-21, PRD §4).
 *
 * Quando houver depoimento real de usuário-piloto, ele entra abaixo desta
 * seção — com nome, nicho e cidade reais, nunca reconstruído de exemplo.
 */
const prometo = [
  "Te mostrar o próximo passo, sempre — mesmo quando uma etapa travar por causa de terceiros.",
  "Explicar todo termo técnico em uma frase. CNAE, MEI, Simples: nada de sopa de letra.",
  "Mostrar de onde vem cada número que eu te der, com fonte e data.",
];

const naoPrometo = [
  "Dinheiro rápido, nem negócio sem risco.",
  "Substituir contador ou advogado nas decisões que exigem um profissional.",
  "Que vai ser fácil. Só que você não vai estar sozinho.",
];

export function PromiseSection({ compact }: { compact: boolean }) {
  return (
    <View
      style={{
        backgroundColor: color.bg.brand,
        paddingVertical: space[16],
        paddingHorizontal: compact ? space[4] : space[10],
      }}
    >
      <View style={{ maxWidth: content.maxWidthWide, width: "100%", alignSelf: "center" }}>
        <Reveal style={{ alignItems: "center", marginBottom: space[10] }}>
          <MaryAvatar pose="positivo" size={compact ? 140 : 170} />
          <Text style={{ ...type.overline, color: color.action.primary, marginTop: space[5], marginBottom: space[2] }}>
            O COMBINADO
          </Text>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 26 : 32,
              lineHeight: compact ? 34 : 40,
              color: color.text.onBrand,
              textAlign: "center",
            }}
          >
            O que eu prometo — e o que eu não prometo
          </Text>
        </Reveal>

        <View style={{ flexDirection: compact ? "column" : "row", gap: space[4] }}>
          <Reveal delay={motion.revealStagger} style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: "rgba(242,176,61,0.12)",
                borderWidth: 1,
                borderColor: color.action.primary,
                borderRadius: radius.lg,
                padding: space[6],
                height: "100%",
              }}
            >
              <Text style={{ ...type.h2, color: color.action.primary, marginBottom: space[4] }}>Prometo</Text>
              {prometo.map((item) => (
                <View key={item} style={{ flexDirection: "row", gap: space[3], marginBottom: space[3] }}>
                  <Text style={{ ...type.bodyStrong, color: color.action.primary }}>✓</Text>
                  <Text style={{ ...type.body, color: color.text.onBrand, flex: 1 }}>{item}</Text>
                </View>
              ))}
            </View>
          </Reveal>

          <Reveal delay={motion.revealStagger * 2} style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                borderRadius: radius.lg,
                padding: space[6],
                height: "100%",
              }}
            >
              <Text style={{ ...type.h2, color: "#C7D3E3", marginBottom: space[4] }}>Não prometo</Text>
              {naoPrometo.map((item) => (
                <View key={item} style={{ flexDirection: "row", gap: space[3], marginBottom: space[3] }}>
                  <Text style={{ ...type.bodyStrong, color: "#8FA3BC" }}>—</Text>
                  <Text style={{ ...type.body, color: "#C7D3E3", flex: 1 }}>{item}</Text>
                </View>
              ))}
            </View>
          </Reveal>
        </View>
      </View>
    </View>
  );
}
