import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, Logo, color, space, type } from "@serdono/ui";
import type { UpdateAppVersionParams } from "@serdono/supabase";
import { useAdminVersaoApp } from "./useAdminVersaoApp";

function parseInt0(texto: string): number {
  const limpo = texto.replace(/\D/g, "");
  return limpo ? Number(limpo) : 0;
}

export function AdminVersaoAppScreen() {
  const router = useRouter();
  const { versao, loading, saving, error, salvar } = useAdminVersaoApp();

  const [form, setForm] = useState<UpdateAppVersionParams | null>(null);

  // A linha só chega depois da primeira consulta — sincroniza o formulário
  // local com o dado do banco sempre que ele mudar (inclusive após salvar).
  useEffect(() => {
    if (!versao) return;
    setForm({
      current_version: versao.current_version,
      current_version_code: versao.current_version_code,
      min_version_code: versao.min_version_code,
      force_update: versao.force_update,
      store_url: versao.store_url,
      release_notes: versao.release_notes,
    });
  }, [versao]);

  async function handleSalvar() {
    if (!form) return;
    await salvar(form);
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
        <Pressable onPress={() => router.push("/admin")} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Painel</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Versão do App</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Controla o aviso de atualização mostrado no app Android. Publicou uma versão nova na Play Store? Atualize os
          campos abaixo pra que o app avise quem ainda está numa versão antiga.
        </Text>

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

        {loading || !form ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : (
          <Card variant="outline" padding={5} style={{ gap: space[1] }}>
            <Input
              label="Versão atual publicada (ex.: 0.1.4)"
              value={form.current_version}
              onChangeText={(t) => setForm({ ...form, current_version: t })}
            />
            <Input
              label="Version code atual publicado (número do build)"
              keyboardType="numeric"
              value={String(form.current_version_code)}
              onChangeText={(t) => setForm({ ...form, current_version_code: parseInt0(t) })}
            />
            <Input
              label="Version code mínimo suportado"
              keyboardType="numeric"
              value={String(form.min_version_code)}
              onChangeText={(t) => setForm({ ...form, min_version_code: parseInt0(t) })}
            />
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: -space[2], marginBottom: space[3] }}>
              Quem estiver com o version code instalado abaixo deste número é considerado desatualizado. Se "Forçar
              atualização" estiver ligado, esse usuário fica bloqueado até atualizar.
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space[3] }}>
              <View style={{ flex: 1, marginRight: space[3] }}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Forçar atualização</Text>
                <Text style={{ ...type.caption, color: color.text.muted }}>
                  Ligado: bloqueia o uso do app até atualizar. Desligado: só um aviso dispensável.
                </Text>
              </View>
              <Button
                label={form.force_update ? "Obrigatória" : "Opcional"}
                variant={form.force_update ? "danger" : "outline"}
                size="sm"
                onPress={() => setForm({ ...form, force_update: !form.force_update })}
              />
            </View>

            <Input
              label="Endereço do app na Play Store"
              value={form.store_url ?? ""}
              onChangeText={(t) => setForm({ ...form, store_url: t || null })}
              placeholder="https://play.google.com/store/apps/details?id=br.com.serdono.app"
            />
            <Input
              label="Novidades desta versão (opcional)"
              value={form.release_notes ?? ""}
              onChangeText={(t) => setForm({ ...form, release_notes: t || null })}
              placeholder="Aparece no popup de atualização"
            />

            <Button label="Salvar" variant="primary" loading={saving} onPress={handleSalvar} style={{ marginTop: space[2] }} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
