import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Card, Logo, color, space, type } from "@serdono/ui";
import { getCurrentSession, listMyModules, type MyModule } from "@serdono/supabase";

export function ModulosScreen() {
  const router = useRouter();
  const [modules, setModules] = useState<MyModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setModules(await listMyModules(session.user.id));
      setLoading(false);
    })();
  }, []);

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
        <Pressable onPress={() => router.push("/assistente")} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Voltar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Módulos</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Aqui aparecem os módulos liberados pra sua conta.
        </Text>

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : modules.length === 0 ? (
          <Card variant="outline" padding={6}>
            <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center" }}>
              Nenhum módulo disponível ainda. Assim que um módulo novo for liberado pra sua conta, ele aparece aqui.
            </Text>
          </Card>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
            {modules.map((m) => (
              <Card key={m.id} variant="default" padding={5} style={{ minWidth: 220, flexGrow: 1 }}>
                <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>{m.nome}</Text>
                {m.descricao ? <Text style={{ ...type.body, color: color.text.secondary }}>{m.descricao}</Text> : null}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
