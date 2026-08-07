import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, EntrepreneurBackground, Logo, color, radius, space, type } from "@serdono/ui";
import { enviarEmailBoasVindas, ensureSession, isAnonymousSession, supabase } from "@serdono/supabase";
import { pickEntrepreneurPhoto } from "../../constants/entrepreneurPhotos";

const BACKGROUND_PHOTO = pickEntrepreneurPhoto("cadastro");

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function CadastroScreen() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!nome.trim()) return setError("Como podemos te chamar?");
    if (!isValidEmail(email)) return setError("Digite um e-mail válido.");
    if (senha.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (senha !== confirmarSenha) return setError("As senhas não conferem.");

    setLoading(true);
    try {
      const session = await ensureSession();
      const anonymous = isAnonymousSession(session);

      if (anonymous) {
        // Converte a sessão anônima em conta permanente, preservando o mesmo
        // auth.uid() — o diagnóstico e os niche_matches já salvos continuam ligados.
        const { error: updateError } = await supabase.auth.updateUser({ email, password: senha });
        if (updateError) throw updateError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password: senha });
        if (signUpError) throw signUpError;
      }

      const currentSession = await ensureSession();
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ nome: nome.trim(), onboarding_status: "diagnostico_concluido" })
        .eq("id", currentSession!.user.id);
      if (userUpdateError) throw userUpdateError;

      // E-mail de boas-vindas (SDD-70). Sem `await`: a conta já está criada e
      // a pessoa não pode esperar o provedor de e-mail para entrar no produto.
      // Falha aqui não interrompe nada — ver enviarEmailBoasVindas().
      void enviarEmailBoasVindas();

      router.replace("/cadastro/bem-vindo");
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
          <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Criar minha conta</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
            É rápido — o resultado do seu diagnóstico já fica salvo na sua conta.
          </Text>

          <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Como podemos te chamar?" />
          <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Senha" value={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" secureTextEntry />
          <Field label="Confirmar senha" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita a senha" secureTextEntry />

          {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

          <Button label={loading ? "Criando conta..." : "Criar conta e continuar"} variant="primary" fullWidth loading={loading} onPress={handleSubmit} />
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize ?? "sentences"}
        style={{
          height: 48,
          borderWidth: 1,
          borderColor: color.border.default,
          borderRadius: radius.md,
          paddingHorizontal: space[4],
          fontSize: 14,
        }}
      />
    </View>
  );
}
