import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, Logo, color, space, type } from "@serdono/ui";
import { useAdminModules } from "./useAdminModules";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function AdminModulesScreen() {
  const router = useRouter();
  const { modules, loading, saving, error, create, toggleAtivo, mover } = useAdminModules();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  async function handleCreate() {
    if (!nome.trim()) return;
    const ok = await create({ slug: slugify(nome), nome: nome.trim(), descricao: descricao.trim() || undefined });
    if (ok) {
      setNome("");
      setDescricao("");
      setShowForm(false);
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
        <Pressable onPress={() => router.push("/admin")} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Painel</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Módulos</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Catálogo de módulos do sistema. Use as setas pra mudar a ordem em que aparecem no menu de todo mundo. "Inativo"
          esconde o módulo do menu de todos os usuários sem tirar a liberação de ninguém — reative quando quiser que ele
          volte a aparecer. A liberação por usuário fica na tela de cada usuário, em "Usuários".
        </Text>

        {!showForm ? (
          <Button label="Cadastrar módulo" variant="primary" onPress={() => setShowForm(true)} style={{ marginBottom: space[5] }} />
        ) : (
          <Card variant="outline" padding={5} style={{ marginBottom: space[5] }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Novo módulo</Text>
            <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Financeiro" />
            <Input label="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Descrição curta (opcional)" />
            <View style={{ flexDirection: "row", gap: space[3] }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setShowForm(false)} />
              <Button label="Cadastrar" variant="primary" loading={saving} onPress={handleCreate} />
            </View>
          </Card>
        )}

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : modules.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum módulo cadastrado ainda.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {modules.map((m, i) => (
              <Card key={m.id} variant="default" padding={4}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[3] }}>
                  <View style={{ gap: 2 }}>
                    <Pressable
                      onPress={() => mover(m, -1)}
                      disabled={i === 0}
                      accessibilityRole="button"
                      accessibilityLabel={`Subir ${m.nome} no menu`}
                      style={{ opacity: i === 0 ? 0.3 : 1, minWidth: 32, minHeight: 22, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>▲</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => mover(m, 1)}
                      disabled={i === modules.length - 1}
                      accessibilityRole="button"
                      accessibilityLabel={`Descer ${m.nome} no menu`}
                      style={{ opacity: i === modules.length - 1 ? 0.3 : 1, minWidth: 32, minHeight: 22, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>▼</Text>
                    </Pressable>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{m.nome}</Text>
                    {m.descricao ? <Text style={{ ...type.caption, color: color.text.muted }}>{m.descricao}</Text> : null}
                  </View>
                  <Button label={m.ativo ? "Ativo" : "Inativo"} variant={m.ativo ? "outline" : "danger"} size="sm" onPress={() => toggleAtivo(m)} />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
