import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { BackHandler, Modal, Text, View } from "react-native";
import { Button, color, radius, space, type } from "@serdono/ui";
import { useAppVersion } from "../hooks/useAppVersion";

export function AppUpdateAlert() {
  const { status, latestVersion, releaseNotes, storeUrl } = useAppVersion();
  const [dismissed, setDismissed] = useState(false);

  // Impede sair da tela pelo botão físico "voltar" do Android quando o
  // update é obrigatório — sem isso o usuário contornaria o bloqueio.
  useEffect(() => {
    if (status !== "required") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [status]);

  if (status === "up-to-date") return null;
  if (status === "optional" && dismissed) return null;

  const required = status === "required";

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(17, 24, 39, 0.75)",
          alignItems: "center",
          justifyContent: "center",
          padding: space[5],
        }}
      >
        <View
          style={{
            backgroundColor: color.bg.surface,
            borderRadius: radius.lg,
            padding: space[6],
            width: "100%",
            maxWidth: 380,
            gap: space[3],
          }}
        >
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: required ? color.state.dangerBg : color.state.warningBg,
              borderRadius: radius.sm,
              paddingHorizontal: space[3],
              paddingVertical: space[1],
            }}
          >
            <Text style={{ ...type.caption, color: required ? color.state.danger : color.state.warning, fontWeight: "700" }}>
              {required ? "Atualização necessária" : "Nova versão disponível"}
            </Text>
          </View>

          <Text style={{ ...type.h2, color: color.text.primary }}>
            {required ? "Precisamos que você atualize o app" : `Versão ${latestVersion ?? ""} disponível`}
          </Text>

          <Text style={{ ...type.body, color: color.text.secondary }}>
            {required
              ? "Esta versão do Ser Dono não é mais suportada. Atualize para continuar usando o app."
              : "Uma nova versão está disponível, com melhorias e correções."}
          </Text>

          {releaseNotes ? (
            <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4] }}>
              <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>NOVIDADES</Text>
              <Text style={{ ...type.body, color: color.text.primary }}>{releaseNotes}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: space[2], gap: space[2] }}>
            <Button
              label="Atualizar agora"
              variant="primary"
              fullWidth
              onPress={() => storeUrl && Linking.openURL(storeUrl)}
            />
            {!required ? <Button label="Lembrar mais tarde" variant="ghost" fullWidth onPress={() => setDismissed(true)} /> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
