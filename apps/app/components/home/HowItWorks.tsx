import React from "react";
import { Text, View } from "react-native";
import { color, content, radius, space, type } from "@serdono/ui";

const steps = [
  { title: "Diagnóstico", body: "A gente entende seu perfil, seu capital e sua cidade." },
  { title: "Seus nichos", body: "Mostramos os negócios que mais combinam com você, e por quê." },
  { title: "Passo a passo", body: "Um caminho guiado, do estudo de viabilidade ao CNPJ." },
  { title: "Primeiros clientes", body: "Preço, canais e divulgação — com o copiloto do seu lado." },
];

export function HowItWorks({ compact }: { compact: boolean }) {
  return (
    <View style={{ backgroundColor: color.bg.surface, paddingVertical: space[16], paddingHorizontal: space[4] }}>
      <View style={{ maxWidth: content.maxWidthWide, width: "100%", alignSelf: "center" }}>
        <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>COMO FUNCIONA</Text>
        <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[6] }}>
          Do "não sei o que abrir" ao negócio funcionando
        </Text>

        <View
          style={{
            flexDirection: compact ? "column" : "row",
            flexWrap: "wrap",
            gap: space[4],
          }}
        >
          {steps.map((step, i) => (
            <View
              key={step.title}
              style={{
                flexBasis: compact ? "100%" : "23%",
                flexGrow: 1,
                minWidth: 200,
                borderWidth: 1,
                borderColor: color.border.default,
                borderRadius: radius.lg,
                padding: space[5],
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.full,
                  backgroundColor: color.bg.brand,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: space[3],
                }}
              >
                <Text style={{ ...type.h3, fontFamily: type.h2.fontFamily, color: color.action.primary, fontSize: 14 }}>
                  {i + 1}
                </Text>
              </View>
              <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>{step.title}</Text>
              <Text style={{ ...type.body, color: color.text.secondary }}>{step.body}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
