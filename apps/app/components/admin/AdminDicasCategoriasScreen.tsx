import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, color, radius, space, type } from "@serdono/ui";
import type { DicasCategoria } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { useAdminDicasCategorias } from "./useAdminDicasCategorias";

/**
 * Admin — categorias de "Dicas da Mary" (SDD-59). Cada categoria leva pra
 * `AdminDicasMateriaisScreen` (gerenciar os materiais dela), mesmo padrão de
 * duas telas já usado em `/admin/usuarios` → `/admin/usuarios/[id]`.
 */
export function AdminDicasCategoriasScreen() {
  const router = useRouter();
  const v = useAdminDicasCategorias();
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  async function handleCreate() {
    if (!titulo.trim() || !descricao.trim()) return;
    const ok = await v.create({ titulo: titulo.trim(), descricao: descricao.trim() });
    if (ok) {
      setTitulo("");
      setDescricao("");
      setShowForm(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Painel Admin", onPress: () => router.push("/admin") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Dicas da Mary — Categorias</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Liberado a todo usuário, sem gate de módulo. Cada categoria precisa de um texto explicando do que ela trata.
        </Text>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{v.error}</Text> : null}

        {showForm ? (
          <Card variant="outline" padding={5} style={{ marginBottom: space[4] }}>
            <Input label="Título da categoria" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Precificação" />
            <Input
              label="Texto explicativo (o que o empreendedor encontra aqui)"
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Ex.: Como formar preço, entender margem e não vender no prejuízo."
            />
            <View style={{ flexDirection: "row", gap: space[2] }}>
              <Button label={v.saving ? "Salvando..." : "Criar categoria"} variant="primary" loading={v.saving} onPress={handleCreate} />
              <Button label="Cancelar" variant="ghost" onPress={() => setShowForm(false)} />
            </View>
          </Card>
        ) : (
          <Button label="+ Nova categoria" variant="outline" onPress={() => setShowForm(true)} style={{ alignSelf: "flex-start", marginBottom: space[4] }} />
        )}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : v.categorias.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhuma categoria cadastrada ainda.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {v.categorias.map((categoria, i) => (
              <CategoriaCard
                key={categoria.id}
                categoria={categoria}
                podeSubir={i > 0}
                podeDescer={i < v.categorias.length - 1}
                onMoverCima={() => v.mover(categoria.id, "cima")}
                onMoverBaixo={() => v.mover(categoria.id, "baixo")}
                onToggleAtivo={() => v.toggleAtivo(categoria)}
                onRemover={() => v.remove(categoria.id)}
                onGerenciarMateriais={() => router.push(`/admin/dicas/${categoria.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CategoriaCard({
  categoria,
  podeSubir,
  podeDescer,
  onMoverCima,
  onMoverBaixo,
  onToggleAtivo,
  onRemover,
  onGerenciarMateriais,
}: {
  categoria: DicasCategoria;
  podeSubir: boolean;
  podeDescer: boolean;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
  onToggleAtivo: () => void;
  onRemover: () => void;
  onGerenciarMateriais: () => void;
}) {
  return (
    <Card variant="default" padding={4}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[3] }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{categoria.titulo}</Text>
          <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{categoria.descricao}</Text>
        </View>
        <View
          style={{
            backgroundColor: categoria.ativo ? color.state.successBg : color.bg.surfaceAlt,
            borderRadius: radius.full,
            paddingHorizontal: space[3],
            paddingVertical: 4,
          }}
        >
          <Text style={{ ...type.caption, color: categoria.ativo ? color.state.success : color.text.muted, fontWeight: "700" }}>
            {categoria.ativo ? "PUBLICADO" : "RASCUNHO"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] }}>
        <Pressable onPress={onMoverCima} disabled={!podeSubir} accessibilityRole="button" style={{ opacity: podeSubir ? 1 : 0.3, padding: space[2] }}>
          <Text style={{ ...type.body }}>↑</Text>
        </Pressable>
        <Pressable onPress={onMoverBaixo} disabled={!podeDescer} accessibilityRole="button" style={{ opacity: podeDescer ? 1 : 0.3, padding: space[2] }}>
          <Text style={{ ...type.body }}>↓</Text>
        </Pressable>
        <Button label="Gerenciar materiais →" variant="outline" size="sm" onPress={onGerenciarMateriais} />
        <Button label={categoria.ativo ? "Despublicar" : "Publicar"} variant="ghost" size="sm" onPress={onToggleAtivo} />
        <Button label="Excluir" variant="ghost" size="sm" onPress={onRemover} />
      </View>
    </Card>
  );
}
