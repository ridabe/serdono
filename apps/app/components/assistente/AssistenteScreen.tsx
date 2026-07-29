import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Logo, color, radius, space, type } from "@serdono/ui";
import { askKnowledgeBase, getCurrentSession, signOut, supabase, type KnowledgeSource } from "@serdono/supabase";

interface Message {
  id: string;
  role: "usuario" | "assistente";
  texto: string;
  sources?: KnowledgeSource[];
}

export function AssistenteScreen() {
  const router = useRouter();
  const [pergunta, setPergunta] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "boas-vindas",
      role: "assistente",
      texto: "Pode perguntar sobre MEI, abertura de negócio, finanças pessoais ou investimentos — respondo com base na nossa base de conhecimento.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [perfil, setPerfil] = useState<{ nome: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) return;
      const { data } = await supabase.from("users").select("nome, avatar_url").eq("id", session.user.id).maybeSingle();
      setPerfil(data ?? null);
    })();
  }, []);

  async function handleSend() {
    const texto = pergunta.trim();
    if (!texto || loading) return;

    setPergunta("");
    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: "usuario", texto }]);
    setLoading(true);
    try {
      const { answer, sources } = await askKnowledgeBase(texto);
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: "assistente", texto: answer, sources }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-e`, role: "assistente", texto: `Não consegui responder agora: ${(e as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: space[3],
          borderBottomWidth: 1,
          borderBottomColor: color.border.default,
          backgroundColor: color.bg.surface,
        }}
      >
        <Logo size={28} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <Pressable
            onPress={() => router.push("/perfil")}
            accessibilityRole="button"
            accessibilityLabel="Meu perfil"
            style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}
          >
            {perfil?.avatar_url ? (
              <Image source={{ uri: perfil.avatar_url }} style={{ width: 32, height: 32, borderRadius: radius.full }} />
            ) : perfil?.nome ? (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.full,
                  backgroundColor: color.bg.brandSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ ...type.caption, color: color.bg.brand, fontWeight: "700" }}>
                  {perfil.nome.trim()[0]?.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable onPress={handleSignOut} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Sair</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        {messages.map((m) => (
          <View key={m.id} style={{ alignItems: m.role === "usuario" ? "flex-end" : "flex-start" }}>
            <View
              style={{
                maxWidth: "85%",
                backgroundColor: m.role === "usuario" ? color.bg.brand : color.bg.surfaceAlt,
                borderRadius: radius.lg,
                padding: space[4],
              }}
            >
              <Text style={{ ...type.body, color: m.role === "usuario" ? color.text.onBrand : color.text.primary }}>
                {m.texto}
              </Text>
            </View>
            {m.sources && m.sources.length > 0 ? (
              <View style={{ marginTop: space[1], maxWidth: "85%" }}>
                {m.sources.map((s, i) => (
                  <Text key={i} style={{ ...type.caption, color: color.text.muted }}>
                    Fonte: {s.fonte}, {s.fonte_data}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ))}
        {loading ? <ActivityIndicator color={color.bg.brand} style={{ alignSelf: "flex-start" }} /> : null}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          gap: space[2],
          padding: space[4],
          borderTopWidth: 1,
          borderTopColor: color.border.default,
          backgroundColor: color.bg.surface,
        }}
      >
        <TextInput
          value={pergunta}
          onChangeText={setPergunta}
          placeholder="Digite sua pergunta..."
          onSubmitEditing={handleSend}
          style={{
            flex: 1,
            height: 48,
            borderWidth: 1,
            borderColor: color.border.default,
            borderRadius: radius.md,
            paddingHorizontal: space[4],
            fontSize: 14,
          }}
        />
        <Pressable
          onPress={handleSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar pergunta"
          style={{
            height: 48,
            paddingHorizontal: space[5],
            borderRadius: radius.md,
            backgroundColor: color.action.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ ...type.button, color: color.text.onAction }}>Enviar</Text>
        </Pressable>
      </View>
    </View>
  );
}
