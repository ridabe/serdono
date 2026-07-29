import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button, EntrepreneurBackground, Logo, color, radius, space, type } from "@serdono/ui";
import { requestPasswordReset } from "@serdono/supabase";
import { pickEntrepreneurPhoto } from "../../constants/entrepreneurPhotos";
import { Field } from "./Field";

const BACKGROUND_PHOTO = pickEntrepreneurPhoto("cadastro");

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function EsqueciSenhaScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!isValidEmail(email)) return setError("Digite um e-mail válido.");

    setLoading(true);
    try {
      const redirectTo = Linking.createURL("login/redefinir-senha");
      await requestPasswordReset(email.trim(), redirectTo);
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <EntrepreneurBackground photoUrl={BACKGROUND_PHOTO.url} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space[5],
          paddingTop: space[6],
        }}
      >
        <Logo size={28} />
        <Pressable
          onPress={() => router.replace("/login")}
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Voltar</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space[5] }}
      >
        <View style={{ width: "100%", maxWidth: 420 }}>
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
            {sent ? (
              <>
                <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Verifique seu e-mail</Text>
                <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
                  Se houver uma conta com o e-mail {email.trim()}, enviamos um link pra você redefinir sua senha.
                </Text>
                <Button label="Voltar para o login" variant="primary" fullWidth onPress={() => router.replace("/login")} />
              </>
            ) : (
              <>
                <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Esqueci minha senha</Text>
                <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
                  Digite seu e-mail e enviaremos um link pra você criar uma nova senha.
                </Text>

                <Field
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="voce@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

                <Button
                  label={loading ? "Enviando..." : "Enviar link de recuperação"}
                  variant="primary"
                  fullWidth
                  loading={loading}
                  onPress={handleSubmit}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
