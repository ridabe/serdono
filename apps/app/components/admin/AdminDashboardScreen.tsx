import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, Logo, color, space, type } from "@serdono/ui";
import { signOut } from "@serdono/supabase";

// Placeholder — o Painel Admin de verdade é fase futura (PRD RN-2: não
// construir tela de fase futura antes da hora). Isso só confirma que o
// roteamento por papel (SPEC.md SDD-22) está funcionando.
export function AdminDashboardScreen() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.brand, alignItems: "center", justifyContent: "center", padding: space[6] }}>
      <Logo size={40} variant="white" />
      <Text style={{ ...type.h1, color: color.text.onBrand, textAlign: "center", marginTop: space[6], marginBottom: space[2] }}>
        Painel administrativo
      </Text>
      <Text style={{ ...type.bodyLg, color: "#C7D3E3", textAlign: "center", maxWidth: 420, marginBottom: space[8] }}>
        Curadoria de nichos e gestão do sistema chegam nas próximas fases. Por enquanto, isso confirma que você entrou como admin.
      </Text>
      <Button label="Sair" variant="ghost" onDark onPress={handleSignOut} />
    </View>
  );
}
