import React from "react";
import { Text, View } from "react-native";
import { color, content, radius, space, type } from "@serdono/ui";

// TODO: depoimento placeholder herdado do mockup de conceito (docs/identidade-visual/mockups/portal-web.html).
// Substituir por depoimento real de usuário antes de publicar em produção — não usar como prova social fabricada.
export function TestimonialSection({ compact }: { compact: boolean }) {
  return (
    <View style={{ backgroundColor: color.bg.brand, paddingVertical: space[16], paddingHorizontal: space[4] }}>
      <View
        style={{
          maxWidth: content.maxWidth,
          width: "100%",
          alignSelf: "center",
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: radius.lg,
          padding: compact ? space[6] : space[8],
        }}
      >
        <Text style={{ ...type.h2, color: color.text.onBrand, marginBottom: space[4], lineHeight: 30 }}>
          "Eu sabia que queria sair do emprego, mas não fazia ideia do que abrir. Em três meses eu tinha o CNPJ e o
          primeiro cliente."
        </Text>
        <Text style={{ ...type.caption, color: "#8FA3BC" }}>Marcos R. · Serviços domiciliares · Campinas/SP</Text>
      </View>
    </View>
  );
}
