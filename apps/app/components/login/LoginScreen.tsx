import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Button, EntrepreneurBackground, Input, Logo, color, radius, space, type } from "@serdono/ui";
import {
  getCurrentSession,
  getUserRole,
  isAnonymousSession,
  signInWithEmail,
  signInWithGoogle,
  supabase,
} from "@serdono/supabase";
import { pickEntrepreneurPhoto } from "../../constants/entrepreneurPhotos";

const BACKGROUND_PHOTO = pickEntrepreneurPhoto("cadastro");

function destinationFor(role: "user" | "admin"): "/admin" | "/assistente" {
  return role === "admin" ? "/admin" : "/assistente";
}

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirected = useRef(false);

  async function redirectIfLoggedIn() {
    if (redirected.current) return;
    const session = await getCurrentSession();
    if (session && !isAnonymousSession(session)) {
      redirected.current = true;
      router.replace(destinationFor(getUserRole(session)));
    }
  }

  // Cobre o retorno do redirect de OAuth na web — a tela é remontada depois
  // que o Google devolve o controle ao app e o supabase-js processa a sessão
  // da URL (detectSessionInUrl, packages/supabase/client.ts).
  useEffect(() => {
    redirectIfLoggedIn();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") redirectIfLoggedIn();
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !senha) return setError("Preencha e-mail e senha.");

    setLoading(true);
    try {
      const session = await signInWithEmail(email.trim(), senha);
      if (session) router.replace(destinationFor(getUserRole(session)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const redirectTo = Linking.createURL("login");

      if (Platform.OS === "web") {
        await signInWithGoogle(redirectTo);
        return; // navega pra fora do app; retorno tratado pelo useEffect acima
      }

      const { url } = await signInWithGoogle(redirectTo);
      if (!url) throw new Error("Não foi possível iniciar o login com Google.");

      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      if (result.type === "success" && result.url) {
        const fragment = result.url.split("#")[1] ?? "";
        const params = new URLSearchParams(fragment);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionError) throw sessionError;
          await redirectIfLoggedIn();
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGoogleLoading(false);
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
          onPress={() => router.replace("/")}
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Início</Text>
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
            <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Entrar</Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
              Acesse sua conta pra continuar de onde parou.
            </Text>

            <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" />
            <Input
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              placeholder="Sua senha"
              secureTextEntry
              autoCapitalize="none"
            />

            <Pressable
              onPress={() => router.push("/login/esqueci-senha")}
              accessibilityRole="link"
              style={{ alignSelf: "flex-end", minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ ...type.body, color: color.action.secondary }}>Esqueci minha senha</Text>
            </Pressable>

            {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

            <Button label={loading ? "Entrando..." : "Entrar"} variant="primary" fullWidth loading={loading} onPress={handleSubmit} />

            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: space[5] }}>
              <View style={{ flex: 1, height: 1, backgroundColor: color.border.default }} />
              <Text style={{ ...type.caption, color: color.text.muted, marginHorizontal: space[3] }}>ou</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: color.border.default }} />
            </View>

            <Button
              label={googleLoading ? "Conectando..." : "Continuar com Google"}
              variant="outline"
              fullWidth
              loading={googleLoading}
              onPress={handleGoogle}
            />

            <Pressable
              onPress={() => router.push("/cadastro")}
              accessibilityRole="link"
              style={{ minHeight: 44, justifyContent: "center", alignItems: "center", marginTop: space[5] }}
            >
              <Text style={{ ...type.body, color: color.text.secondary }}>
                Não tem conta? <Text style={{ color: color.action.secondary, fontWeight: "600" }}>Criar conta</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
