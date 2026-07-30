import React from "react";
import { Text, View } from "react-native";
import { HoverLift, MaryAvatar, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

// Cada pilar descreve algo que o produto realmente faz hoje — os 4 saem
// direto dos Princípios de Produto do PRD §4 e das regras RN-1/RN-14.
const pillars = [
  {
    title: "Ela pergunta antes de responder",
    body: "Antes de sugerir qualquer negócio, entendo seu perfil, quanto você tem e onde você mora. Nada de receita genérica de internet.",
  },
  {
    title: "Ela explica como quem quer ser entendida",
    body: "CNAE, MEI, Simples Nacional — todo termo técnico vem com uma frase que explica. Você decide entendendo, não confiando.",
  },
  {
    title: "Ela faz o trabalho pesado com você",
    body: "Persona, análise de concorrência, nome da empresa, logo e slogan: eu gero as opções, você escolhe e ajusta.",
  },
  {
    title: "Ela não deixa você travar",
    body: "Se uma etapa depende de terceiros, já te mostro a próxima em que dá pra avançar hoje. A jornada nunca para de pé.",
  },
];

export function MentorSection({ compact }: { compact: boolean }) {
  return (
    <View style={{ backgroundColor: color.bg.surface, paddingVertical: space[16], paddingHorizontal: space[4] }}>
      <View
        style={{
          maxWidth: content.maxWidthWide,
          width: "100%",
          alignSelf: "center",
          flexDirection: compact ? "column" : "row",
          gap: compact ? space[10] : space[12],
          alignItems: compact ? "center" : "flex-start",
        }}
      >
        <Reveal style={{ width: compact ? "100%" : undefined, alignItems: "center" }}>
          <View style={{ width: compact ? 180 : 260 }}>
            <MaryAvatar pose="jornada" size={compact ? 180 : 260} />
          </View>
          {!compact ? (
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[4], textAlign: "center" }}>
              Mary acompanha as 9 fases{"\n"}da sua jornada
            </Text>
          ) : null}
        </Reveal>

        <View style={{ flex: compact ? undefined : 1.4, width: compact ? "100%" : undefined }}>
          <Reveal>
            <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>
              COMO A MARY TRABALHA
            </Text>
            <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[6] }}>
              A mentora que não te deixa no meio do caminho
            </Text>
          </Reveal>

          <View style={{ flexDirection: compact ? "column" : "row", flexWrap: "wrap", gap: space[4] }}>
            {pillars.map((pillar, i) => (
              <Reveal
                key={pillar.title}
                delay={motion.revealStagger * (i + 1)}
                style={{
                  flexBasis: compact ? "100%" : "46%",
                  flexGrow: 1,
                  minWidth: compact ? undefined : 240,
                }}
              >
                <HoverLift
                  style={{
                    backgroundColor: color.bg.canvas,
                    borderRadius: radius.lg,
                    padding: space[5],
                    borderLeftWidth: 3,
                    borderLeftColor: color.action.primary,
                  }}
                >
                  <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[2] }}>{pillar.title}</Text>
                  <Text style={{ ...type.body, color: color.text.secondary }}>{pillar.body}</Text>
                </HoverLift>
              </Reveal>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
