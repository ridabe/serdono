import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Card, Logo, color, space, type } from "@serdono/ui";
import { labelPlano, type Plano } from "@serdono/core";
import { listUserModuleAccess, setModuleAccess, setModuleCortesia, type ModuleAccessRow } from "@serdono/supabase";

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

  /**
   * Cortesia (pedido do dono do produto, 28/08/2026) — libera o módulo pra
   * este usuário mesmo que o plano atual não contemple, sem mexer no plano
   * inteiro. Revogável a qualquer momento, mesmo botão.
   */
  async function toggleCortesia(module: ModuleAccessRow) {
    if (!id) return;
    setError(null);
    try {
      await setModuleCortesia(id, module.id, !module.cortesia);
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
          "Habilitado" liga/desliga o módulo pra esta conta, independente do plano. "Cortesia" libera mesmo que o plano atual não
          contemple o módulo — revogável a qualquer momento.
        </Text>

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : modules.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum módulo cadastrado no catálogo ainda.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {modules.map((m) => (
              <Card key={m.id} variant="default" padding={4}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[2], marginBottom: space[3] }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{m.nome}</Text>
                    {m.descricao ? <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{m.descricao}</Text> : null}
                  </View>
                  {m.plano_minimo !== "gratuito" ? (
                    <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: 999, paddingHorizontal: space[3], paddingVertical: 4 }}>
                      <Text style={{ ...type.caption, color: color.text.secondary, fontWeight: "700" }}>
                        Plano {labelPlano(m.plano_minimo as Plano)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ gap: space[2] }}>
                  <ToggleRow label="Habilitado" ativo={m.habilitado} onPress={() => toggle(m)} />
                  <ToggleRow
                    label="Cortesia (libera fora do plano)"
                    ativo={m.cortesia}
                    onPress={() => toggleCortesia(m)}
                    accent
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/** Linha "rótulo + switch" reaproveitada pelos dois toggles do módulo (habilitado/cortesia) — `accent` destaca a cortesia com a cor de marca em vez do verde padrão de "ligado", pra não parecer o mesmo controle que "Habilitado". */
function ToggleRow({ label, ativo, onPress, accent = false }: { label: string; ativo: boolean; onPress: () => void; accent?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: ativo }}
      style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 }}
    >
      <Text style={{ ...type.body, color: color.text.primary }}>{label}</Text>
      <View
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          backgroundColor: ativo ? (accent ? color.bg.brand : color.action.secondary) : color.border.default,
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
            alignSelf: ativo ? "flex-end" : "flex-start",
          }}
        />
      </View>
    </Pressable>
  );
}
