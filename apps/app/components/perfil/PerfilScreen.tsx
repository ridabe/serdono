import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, color, radius, space, type } from "@serdono/ui";
import { enviarPushTeste, signOut } from "@serdono/supabase";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { ScreenHeader } from "../shell/ScreenHeader";
import { PerfilFields } from "./PerfilFields";
import { usePerfilForm } from "./usePerfilForm";

// Tela de perfil acessível a qualquer momento pós-login (SPEC.md SDD-26) —
// mesmos campos do gate de completar cadastro, mas sem obrigatoriedade nem
// redirecionamento: o usuário edita e continua onde estava.
export function PerfilScreen() {
  const router = useRouter();
  const form = usePerfilForm();
  const push = usePushNotifications();
  const [saved, setSaved] = useState(false);
  const [testeEnviado, setTesteEnviado] = useState(false);
  const [testeErro, setTesteErro] = useState<string | null>(null);
  const [testando, setTestando] = useState(false);

  async function handleTestarAviso() {
    setTestando(true);
    setTesteEnviado(false);
    setTesteErro(null);
    try {
      await enviarPushTeste();
      setTesteEnviado(true);
    } catch (e) {
      setTesteErro((e as Error).message);
    } finally {
      setTestando(false);
    }
  }

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

          {push.suportado ? (
            <View
              style={{
                backgroundColor: color.bg.surface,
                borderRadius: radius.lg,
                padding: space[6],
                marginTop: space[5],
                shadowColor: "#111827",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Avisos no celular</Text>
              <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
                Ative pra eu te lembrar quando tiver etapa parada na Jornada, hora do check-up mensal ou obrigação
                vencendo — sem precisar abrir o app pra descobrir.
              </Text>

              {push.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{push.error}</Text> : null}

              {push.carregando ? null : push.ativado ? (
                <View style={{ gap: space[2] }}>
                  <Button label="Testar aviso" variant="outline" loading={testando} onPress={handleTestarAviso} />
                  {testeEnviado ? <Text style={{ ...type.caption, color: color.state.success }}>Aviso de teste enviado.</Text> : null}
                  {testeErro ? <Text style={{ ...type.caption, color: color.state.danger }}>{testeErro}</Text> : null}
                  <Button label="Desativar avisos" variant="ghost" loading={push.processando} onPress={push.desativar} />
                </View>
              ) : (
                <Button label="Ativar avisos no celular" variant="primary" loading={push.processando} onPress={push.ativar} />
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
