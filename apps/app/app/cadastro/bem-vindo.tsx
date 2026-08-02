import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Logo, color, space, type } from "@serdono/ui";

/**
 * Ponte entre "conta criada" e a Jornada (SDD-52) — antes era um beco sem
 * saída (texto de antes da Jornada Empreendedora existir, sem botão nenhum
 * pra continuar). `/jornada` já resolve sozinho pra `EscolherNichoScreen`
 * quando não existe `jornada_instances` ainda (comportamento existente,
 * ver `JornadaScreen.tsx`), então só redirecionar já é suficiente — sem
 * duplicar aqui a lógica de "tem ou não tem jornada".
 */
export default function BemVindo() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/jornada");
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.brand, alignItems: "center", justifyContent: "center", padding: space[6] }}>
      <Logo size={40} variant="white" />
      <Text style={{ ...type.h1, color: color.text.onBrand, textAlign: "center", marginTop: space[6], marginBottom: space[2] }}>
        Sua conta foi criada.
      </Text>
      <ActivityIndicator color={color.action.primary} style={{ marginTop: space[4] }} />
    </View>
  );
}
