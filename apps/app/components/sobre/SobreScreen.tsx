import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Platform, ScrollView, Text, View } from "react-native";
import { Button, Card, color, Logo, space, type } from "@serdono/ui";
import { ScreenHeader } from "../shell/ScreenHeader";

const DESENVOLVEDOR = "Algoritmum Desenvolvimento";

// Só Android tem `versionCode` (build da Play Store) — web/iOS mostram só a
// versão semântica do `app.config.js` (mesmo campo que `useAppVersion.ts`
// compara contra `app_versions` pra decidir o aviso de atualização, SDD-29).
const versaoInstalada = Constants.expoConfig?.version ?? "—";
const versionCode = Constants.expoConfig?.android?.versionCode as number | undefined;

export function SobreScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[
          { label: "← Voltar", onPress: () => (router.canGoBack() ? router.back() : router.replace("/inicio")) },
        ]}
      />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <View style={{ alignItems: "center", paddingVertical: space[4] }}>
          <Logo size={48} />
        </View>

        <Card variant="outline" padding={5}>
          <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>VERSÃO DO APP</Text>
          <Text style={{ ...type.h3, color: color.text.primary }}>
            {versaoInstalada}
            {Platform.OS === "android" && versionCode ? ` (build ${versionCode})` : ""}
          </Text>
        </Card>

        <Card variant="outline" padding={5}>
          <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>DESENVOLVIDO POR</Text>
          <Text style={{ ...type.body, color: color.text.primary }}>{DESENVOLVEDOR}</Text>
        </Card>

        <Card variant="default" padding={5}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Meu perfil</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
            Alterar nome, telefone, foto e demais dados de cadastro.
          </Text>
          <Button label="Ver meu perfil" variant="outline" onPress={() => router.push("/perfil")} style={{ alignSelf: "flex-start" }} />
        </Card>

        <View style={{ gap: space[2], marginTop: space[2] }}>
          <Button label="Termos de uso" variant="ghost" onPress={() => router.push("/termos")} style={{ alignSelf: "flex-start" }} />
          <Button
            label="Política de privacidade"
            variant="ghost"
            onPress={() => router.push("/privacidade")}
            style={{ alignSelf: "flex-start" }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
