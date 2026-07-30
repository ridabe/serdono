import React from "react";
import { Text, View } from "react-native";
import { HoverLift, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

// Cenários derivados das personas do PRD §2, em linguagem simples (RN-1) — sem expor os nomes internos.
const scenarios = [
  {
    kick: "QUER SAIR DO CLT",
    title: "Você sabe que quer empreender, mas não sabe em quê",
    body: "Tem um dinheiro guardado e vontade de decidir — só falta clareza de por onde começar.",
  },
  {
    kick: "JÁ TEM CNPJ",
    title: "Você já abriu, mas está no escuro sobre como crescer",
    body: "MEI ou pequena empresa recente, precisando de direção mais que de mais uma planilha.",
  },
  {
    kick: "PRECISA DE ALGO SIMPLES",
    title: "Você quer um passo a passo sem jargão",
    body: "Cada termo técnico — CNAE, Simples Nacional, MEI — explicado em uma frase, sem enrolação.",
  },
];

export function ForWhomSection({ compact }: { compact: boolean }) {
  return (
    <View style={{ backgroundColor: color.bg.surface, paddingVertical: space[16], paddingHorizontal: space[4] }}>
      <View style={{ maxWidth: content.maxWidthWide, width: "100%", alignSelf: "center" }}>
        <Reveal>
          <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>PARA QUEM É</Text>
          <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[6] }}>
            Se alguma dessas frases parece com você
          </Text>
        </Reveal>

        <View style={{ flexDirection: compact ? "column" : "row", gap: space[4] }}>
          {scenarios.map((s, i) => (
            <Reveal key={s.kick} delay={motion.revealStagger * (i + 1)} style={{ flex: 1 }}>
              <HoverLift
                style={{
                  minWidth: compact ? undefined : 220,
                  backgroundColor: color.bg.canvas,
                  borderRadius: radius.lg,
                  padding: space[6],
                  height: "100%",
                  shadowColor: "#111827",
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...type.overline, color: color.action.primaryHover, marginBottom: space[3] }}>
                  {s.kick}
                </Text>
                <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[2] }}>{s.title}</Text>
                <Text style={{ ...type.body, color: color.text.secondary }}>{s.body}</Text>
              </HoverLift>
            </Reveal>
          ))}
        </View>
      </View>
    </View>
  );
}
