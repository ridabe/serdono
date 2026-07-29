import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { Button, EntrepreneurBackground, Input, Logo, color, radius, space, type } from "@serdono/ui";
import { confirmPasswordRecovery, supabase, updatePassword } from "@serdono/supabase";
import { pickEntrepreneurPhoto } from "../../constants/entrepreneurPhotos";

const BACKGROUND_PHOTO = pickEntrepreneurPhoto("cadastro");

/**
 * Extrai token_hash/type do link de recuperação, tanto do formato de fragmento
 * (`#access_token=...&type=recovery`) quanto de query string (`?token_hash=...&type=recovery`)
 * — o Supabase pode enviar qualquer um dos dois dependendo da configuração do projeto.
 */
async function consumeRecoveryLink(url: string): Promise<boolean> {
  const [, rest = ""] = url.split("#");
  const fragmentParams = new URLSearchParams(rest);
  const queryString = url.split("?")[1]?.split("#")[0] ?? "";
  const queryParams = new URLSearchParams(queryString);

  const access_token = fragmentParams.get("access_token");
  const refresh_token = fragmentParams.get("refresh_token");
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return true;
  }

  const tokenHash = queryParams.get("token_hash") ?? fragmentParams.get("token_hash");
  const type = queryParams.get("type") ?? fragmentParams.get("type");
  if (tokenHash && type === "recovery") {
    const session = await confirmPasswordRecovery(tokenHash);
    return Boolean(session);
  }

  return false;
}

export function RedefinirSenhaScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      // No web, `detectSessionInUrl` (packages/supabase/client.ts) processa
      // tokens no fragmento (#access_token=...) ou `?code=` automaticamente e
      // dispara PASSWORD_RECOVERY — inscrever o listener é o que aciona esse
      // processamento na v2 do supabase-js. Um link no formato `?token_hash=`
      // não é coberto por esse mecanismo, então tentamos consumi-lo à mão
      // também, cobrindo os dois formatos que o Supabase pode emitir.
      let cancelled = false;
      const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" && !cancelled) {
          setReady(true);
          setChecking(false);
        }
      });
      consumeRecoveryLink(window.location.href)
        .then((consumed) => {
          if (consumed && !cancelled) {
            setReady(true);
            setChecking(false);
          }
        })
        .catch((e) => {
          if (!cancelled) setError((e as Error).message);
        });
      // Se o processamento já tiver terminado sem link de recuperação válido.
      const timeout = setTimeout(() => !cancelled && setChecking(false), 2000);
      return () => {
        cancelled = true;
        subscription.subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }

    // Fora da web, o app é aberto via deep link (`serdono://login/redefinir-senha`)
    // a partir do navegador/e-mail — precisa ler a URL manualmente.
    let cancelled = false;
    async function handleNativeLink() {
      try {
        const initialUrl = await Linking.getInitialURL();
        const consumed = initialUrl ? await consumeRecoveryLink(initialUrl) : false;
        if (!cancelled) {
          setReady(consumed);
          setChecking(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setReady(false);
          setChecking(false);
        }
      }
    }
    handleNativeLink();
    const sub = Linking.addEventListener("url", async ({ url }) => {
      try {
        const consumed = await consumeRecoveryLink(url);
        if (!cancelled) setReady(consumed);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  async function handleSubmit() {
    setError(null);
    if (senha.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (senha !== confirmarSenha) return setError("As senhas não conferem.");

    setLoading(true);
    try {
      await updatePassword(senha);
      setDone(true);
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
            {done ? (
              <>
                <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Senha atualizada</Text>
                <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
                  Sua senha foi redefinida. Já pode entrar com ela.
                </Text>
                <Button label="Ir para o login" variant="primary" fullWidth onPress={() => router.replace("/login")} />
              </>
            ) : checking ? (
              <Text style={{ ...type.body, color: color.text.secondary }}>Verificando o link de recuperação...</Text>
            ) : !ready ? (
              <>
                <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Link inválido ou expirado</Text>
                <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
                  Peça um novo link de recuperação de senha.
                </Text>
                <Button
                  label="Solicitar novo link"
                  variant="primary"
                  fullWidth
                  onPress={() => router.replace("/login/esqueci-senha")}
                />
              </>
            ) : (
              <>
                <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Criar nova senha</Text>
                <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
                  Escolha uma nova senha pra sua conta.
                </Text>

                <Input
                  label="Nova senha"
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Input
                  label="Confirmar nova senha"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Repita a senha"
                  secureTextEntry
                  autoCapitalize="none"
                />

                {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

                <Button
                  label={loading ? "Salvando..." : "Salvar nova senha"}
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
