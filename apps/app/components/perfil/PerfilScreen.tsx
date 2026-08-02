import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, color, radius, space, type } from "@serdono/ui";
import { signOut } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { PerfilFields } from "./PerfilFields";
import { usePerfilForm } from "./usePerfilForm";

// Tela de perfil acessível a qualquer momento pós-login (SPEC.md SDD-26) —
// mesmos campos do gate de completar cadastro, mas sem obrigatoriedade nem
// redirecionamento: o usuário edita e continua onde estava.
export function PerfilScreen() {
  const router = useRouter();
  const form = usePerfilForm();
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaved(false);
    const ok = await form.save();
    if (ok) setSaved(true);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      {/* "Sair" fica nas duas plataformas: no app é a única saída da conta,
          já que Perfil é uma aba e não tem "voltar" pra lugar nenhum. */}
      <ScreenHeader
        webLinks={[
          { label: "← Voltar", onPress: () => (router.canGoBack() ? router.back() : router.replace("/assistente")) },
        ]}
        links={[{ label: "Sair", onPress: handleSignOut }]}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", padding: space[5] }}>
        <View style={{ width: "100%", maxWidth: 420, paddingTop: space[6] }}>
          <View
            style={{
              backgroundColor: color.bg.surface,
              borderRadius: radius.lg,
              padding: space[6],
              shadowColor: "#111827",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Meu perfil</Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[6] }}>
              Altere seus dados de cadastro sempre que precisar.
            </Text>

            {!form.loadingProfile ? (
              <PerfilFields
                nome={form.nome}
                onChangeNome={form.setNome}
                telefone={form.telefone}
                onChangeTelefone={form.setTelefone}
                avatarUri={form.avatarUri}
                onPickPhoto={form.handlePickPhoto}
                error={form.error}
              />
            ) : null}

            {saved && !form.error ? (
              <Text style={{ ...type.caption, color: color.state.success, marginBottom: space[3] }}>Alterações salvas.</Text>
            ) : null}

            <Button label={form.saving ? "Salvando..." : "Salvar alterações"} variant="primary" fullWidth loading={form.saving} onPress={handleSave} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
