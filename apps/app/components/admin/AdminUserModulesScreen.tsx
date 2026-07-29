import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Card, Logo, color, space, type } from "@serdono/ui";
import { listUserModuleAccess, setModuleAccess, type ModuleAccessRow } from "@serdono/supabase";

export function AdminUserModulesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modules, setModules] = useState<ModuleAccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setModules(await listUserModuleAccess(id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function toggle(module: ModuleAccessRow) {
    if (!id) return;
    setError(null);
    try {
      await setModuleAccess(id, module.id, !module.habilitado);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
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
        <Pressable onPress={() => router.push("/admin/usuarios")} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Usuários</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Módulos deste usuário</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Liberação independe do plano — controlada manualmente aqui.
        </Text>

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : modules.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum módulo cadastrado no catálogo ainda.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {modules.map((m) => (
              <Pressable key={m.id} onPress={() => toggle(m)} accessibilityRole="switch" accessibilityState={{ checked: m.habilitado }}>
                <Card variant="default" padding={4}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{m.nome}</Text>
                      {m.descricao ? <Text style={{ ...type.caption, color: color.text.muted }}>{m.descricao}</Text> : null}
                    </View>
                    <View
                      style={{
                        width: 44,
                        height: 26,
                        borderRadius: 999,
                        backgroundColor: m.habilitado ? color.action.secondary : color.border.default,
                        justifyContent: "center",
                        padding: 2,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          backgroundColor: color.bg.surface,
                          alignSelf: m.habilitado ? "flex-end" : "flex-start",
                        }}
                      />
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
