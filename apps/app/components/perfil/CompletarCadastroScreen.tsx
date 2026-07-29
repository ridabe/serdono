import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Logo, color, radius, space, type } from "@serdono/ui";
import { getCurrentSession, getUserRole, supabase, uploadAvatar } from "@serdono/supabase";

function destinationFor(role: "user" | "admin"): "/admin" | "/assistente" {
  return role === "admin" ? "/admin" : "/assistente";
}

export function CompletarCadastroScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) return;
      setUserId(session.user.id);

      const metaNome = (session.user.user_metadata?.full_name ?? session.user.user_metadata?.name) as
        | string
        | undefined;

      const { data } = await supabase.from("users").select("nome, telefone, avatar_url").eq("id", session.user.id).maybeSingle();
      setNome(data?.nome ?? metaNome ?? "");
      setTelefone(data?.telefone ?? "");
      setAvatarUri(data?.avatar_url ?? null);
    })();
  }, []);

  async function handlePickPhoto() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Precisamos de permissão para acessar suas fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    // DS: padroniza toda foto de perfil pro mesmo formato antes de subir —
    // quadrado 512x512, JPEG, compressão 0.7 (leve, cobre exibição em
    // radius.full em qualquer densidade de tela razoável).
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    setAvatarUri(manipulated.uri);
  }

  async function handleSubmit() {
    setError(null);
    if (!nome.trim()) return setError("Como podemos te chamar?");
    if (!telefone.trim()) return setError("Informe um telefone de contato.");
    if (!userId) return setError("Sessão perdida — faça login de novo.");

    setLoading(true);
    try {
      // Só sobe de novo se for uma foto local nova (file:/blob:/data: da
      // manipulação) — se já veio de um avatar_url salvo (http), reaproveita.
      let avatar_url: string | null = avatarUri;
      if (avatarUri && !avatarUri.startsWith("http")) {
        avatar_url = await uploadAvatar(userId, avatarUri);
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ nome: nome.trim(), telefone: telefone.trim(), avatar_url })
        .eq("id", userId);
      if (updateError) throw updateError;

      const session = await getCurrentSession();
      router.replace(destinationFor(getUserRole(session)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space[5] }}>
        <View style={{ width: "100%", maxWidth: 420 }}>
          <View style={{ alignItems: "center", marginBottom: space[6] }}>
            <Logo size={32} />
          </View>

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
            <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Complete seu cadastro</Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[6] }}>
              Falta pouco — nome e telefone pra continuar. A foto é opcional, dá pra adicionar depois.
            </Text>

            <View style={{ alignItems: "center", marginBottom: space[6] }}>
              <Pressable onPress={handlePickPhoto} accessibilityRole="button" accessibilityLabel="Escolher foto de perfil">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96, borderRadius: radius.full }} />
                ) : (
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: radius.full,
                      backgroundColor: color.bg.brandSubtle,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ ...type.h2, color: color.bg.brand }}>{nome.trim() ? nome.trim()[0].toUpperCase() : "?"}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={handlePickPhoto} style={{ minHeight: 44, justifyContent: "center", marginTop: space[2] }}>
                <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>
                  {avatarUri ? "Trocar foto" : "Adicionar foto (opcional)"}
                </Text>
              </Pressable>
            </View>

            <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Como podemos te chamar?" />
            <Field
              label="Telefone"
              value={telefone}
              onChangeText={setTelefone}
              placeholder="(11) 91234-5678"
              keyboardType="phone-pad"
            />

            {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

            <Button label={loading ? "Salvando..." : "Salvar e continuar"} variant="primary" fullWidth loading={loading} onPress={handleSubmit} />
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
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType}
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
