import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Card, Logo, color, space, type } from "@serdono/ui";
import { getCurrentSession, getMyJornada, signOut, supabase, type JornadaInstance } from "@serdono/supabase";
import { EscolherNichoScreen } from "./EscolherNichoScreen";

const FASE_LABEL: Record<string, string> = {
  validacao_ideia: "Validação da Ideia",
  planejamento: "Planejamento",
  formalizacao: "Formalização",
  marketing: "Marketing",
  financeiro: "Financeiro",
  clientes: "Clientes",
  retencao: "Retenção",
  escala: "Escala",
};

export function JornadaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jornada, setJornada] = useState<JornadaInstance | null>(null);
  const [nicheName, setNicheName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) return;
      const instance = await getMyJornada(session.user.id);
      setJornada(instance);
      if (instance?.niche_id) {
        const { data } = await supabase.from("niches").select("nome").eq("id", instance.niche_id).maybeSingle();
        setNicheName(data?.nome ?? null);
      }
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  if (!jornada) {
    return <EscolherNichoScreen />;
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
          <Pressable onPress={() => router.push("/perfil")} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Meu perfil</Text>
          </Pressable>
          <Pressable onPress={handleSignOut} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Sair</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Sua jornada</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Acompanhe aqui a evolução do seu negócio, passo a passo.
        </Text>

        <Card variant="default" padding={6}>
          <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[1] }}>NICHO ESCOLHIDO</Text>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[4] }}>{nicheName ?? "—"}</Text>

          <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[1] }}>FASE ATUAL</Text>
          <Text style={{ ...type.h3, color: color.bg.brand, marginBottom: space[4] }}>{FASE_LABEL[jornada.fase_atual] ?? jornada.fase_atual}</Text>

          <Text style={{ ...type.body, color: color.text.secondary }}>
            A próxima etapa (checklist de validação da ideia) chega em breve. Sua escolha já está salva.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
