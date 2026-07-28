import { Text, View } from "react-native";
import { Logo, color, space, type } from "@serdono/ui";

// Placeholder até o Painel do Negócio (PRD §14.2) ser construído — RN-2:
// não antecipar tela de fase futura, só confirmar que o cadastro funcionou
// e que o diagnóstico já está salvo na conta.
export default function BemVindo() {
  return (
    <View style={{ flex: 1, backgroundColor: color.bg.brand, alignItems: "center", justifyContent: "center", padding: space[6] }}>
      <Logo size={40} variant="white" />
      <Text style={{ ...type.h1, color: color.text.onBrand, textAlign: "center", marginTop: space[6], marginBottom: space[2] }}>
        Sua conta foi criada.
      </Text>
      <Text style={{ ...type.bodyLg, color: "#C7D3E3", textAlign: "center", maxWidth: 420 }}>
        O resultado do seu diagnóstico já está salvo. O próximo passo — assinar um plano e destravar o caminho
        completo até o primeiro cliente — chega em breve.
      </Text>
    </View>
  );
}
