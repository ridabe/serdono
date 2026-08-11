import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, ConfirmModal, Input, color, radius, space, type } from "@serdono/ui";
import type { DicasCategoria } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { useAdminDicasCategorias } from "./useAdminDicasCategorias";

const COL = {
  ordem: { width: 64 },
  titulo: { flex: 1.1, minWidth: 160 },
  descricao: { flex: 1.6, minWidth: 220 },
  status: { flex: 0.7, minWidth: 120 },
  acoes: { width: 360 },
};

/**
 * Admin — categorias de "Dicas da Mary" (SDD-59). Cada categoria leva pra
 * `AdminDicasMateriaisScreen` (gerenciar os materiais dela), mesmo padrão de
 * duas telas já usado em `/admin/usuarios` → `/admin/usuarios/[id]`.
 *
 * Tabela em vez de cards empilhados (mesmo padrão de `AdminUsersScreen`/
 * `AdminFornecedoresScreen`) — busca em tempo real e exclusão com
 * confirmação em duas etapas.
 */
export function AdminDicasCategoriasScreen() {
  const router = useRouter();
  const v = useAdminDicasCategorias();
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<DicasCategoria | null>(null);

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
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Liberado a todo usuário, sem gate de módulo. Cada categoria precisa de um texto explicando do que ela trata.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], alignItems: "flex-start", marginBottom: space[4] }}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Input label="Buscar" value={v.query} onChangeText={v.setQuery} placeholder="Título ou descrição" autoCapitalize="none" />
          </View>
          <View style={{ marginTop: type.bodyStrong.lineHeight + space[1] }}>
            <Button label={showForm ? "Cancelar" : "Nova categoria"} variant={showForm ? "ghost" : "primary"} onPress={() => setShowForm((s) => !s)} />
          </View>
        </View>

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
        ) : null}

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : v.categorias.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>
            {v.buscando ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada ainda."}
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
            <View style={{ width: "100%", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: color.border.default }}>
              <TableHeader />
              {v.categorias.map((categoria, i) => (
                <CategoriaRow
                  key={categoria.id}
                  categoria={categoria}
                  podeReordenar={!v.buscando}
                  podeSubir={i > 0}
                  podeDescer={i < v.categorias.length - 1}
                  onMoverCima={() => v.mover(categoria.id, "cima")}
                  onMoverBaixo={() => v.mover(categoria.id, "baixo")}
                  onToggleAtivo={() => v.toggleAtivo(categoria)}
                  onExcluir={() => setConfirmandoExclusao(categoria)}
                  onGerenciarMateriais={() => router.push(`/admin/dicas/${categoria.id}`)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmandoExclusao !== null}
        title="Excluir categoria"
        message={
          confirmandoExclusao
            ? `Excluir "${confirmandoExclusao.titulo}" apaga a categoria e todos os materiais cadastrados dentro dela, pra sempre. Não dá pra desfazer.`
            : ""
        }
        confirmLabel="Sim, excluir definitivamente"
        onCancel={() => setConfirmandoExclusao(null)}
        onConfirm={async () => {
          if (!confirmandoExclusao) return;
          await v.remove(confirmandoExclusao.id);
          setConfirmandoExclusao(null);
        }}
      />
    </View>
  );
}

function TableHeader() {
  return (
    <View style={{ flexDirection: "row", backgroundColor: color.bg.surfaceAlt, borderBottomWidth: 1, borderBottomColor: color.border.default }}>
      <HeaderCell colStyle={COL.ordem} label="Ordem" />
      <HeaderCell colStyle={COL.titulo} label="Título" />
      <HeaderCell colStyle={COL.descricao} label="Descrição" />
      <HeaderCell colStyle={COL.status} label="Status" />
      <HeaderCell colStyle={COL.acoes} label="Ações" />
    </View>
  );
}

function HeaderCell({ colStyle, label }: { colStyle: { flex?: number; minWidth?: number; width?: number }; label: string }) {
  return (
    <View style={{ ...colStyle, paddingHorizontal: space[3], paddingVertical: space[3] }}>
      <Text style={{ ...type.overline, color: color.text.muted }}>{label}</Text>
    </View>
  );
}

function OrdemButtons({ podeSubir, podeDescer, onCima, onBaixo }: { podeSubir: boolean; podeDescer: boolean; onCima: () => void; onBaixo: () => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      <Pressable
        onPress={onCima}
        disabled={!podeSubir}
        accessibilityRole="button"
        accessibilityLabel="Mover pra cima"
        style={{
          width: 26,
          height: 26,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: color.border.default,
          alignItems: "center",
          justifyContent: "center",
          opacity: podeSubir ? 1 : 0.3,
        }}
      >
        <Text style={{ ...type.caption, color: color.text.secondary }}>↑</Text>
      </Pressable>
      <Pressable
        onPress={onBaixo}
        disabled={!podeDescer}
        accessibilityRole="button"
        accessibilityLabel="Mover pra baixo"
        style={{
          width: 26,
          height: 26,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: color.border.default,
          alignItems: "center",
          justifyContent: "center",
          opacity: podeDescer ? 1 : 0.3,
        }}
      >
        <Text style={{ ...type.caption, color: color.text.secondary }}>↓</Text>
      </Pressable>
    </View>
  );
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: ativo ? color.state.successBg : color.bg.surfaceAlt,
        borderRadius: radius.full,
        paddingHorizontal: space[2],
        paddingVertical: 2,
      }}
    >
      <Text style={{ ...type.caption, color: ativo ? color.state.success : color.text.muted, fontWeight: "700" }}>
        {ativo ? "Publicado" : "Rascunho"}
      </Text>
    </View>
  );
}

function CategoriaRow({
  categoria,
  podeReordenar,
  podeSubir,
  podeDescer,
  onMoverCima,
  onMoverBaixo,
  onToggleAtivo,
  onExcluir,
  onGerenciarMateriais,
}: {
  categoria: DicasCategoria;
  podeReordenar: boolean;
  podeSubir: boolean;
  podeDescer: boolean;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
  onToggleAtivo: () => void;
  onExcluir: () => void;
  onGerenciarMateriais: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: color.border.default }}>
      <View style={{ ...COL.ordem, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        {podeReordenar ? <OrdemButtons podeSubir={podeSubir} podeDescer={podeDescer} onCima={onMoverCima} onBaixo={onMoverBaixo} /> : null}
      </View>
      <View style={{ ...COL.titulo, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
          {categoria.titulo}
        </Text>
      </View>
      <View style={{ ...COL.descricao, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.body, color: color.text.secondary }} numberOfLines={2}>
          {categoria.descricao}
        </Text>
      </View>
      <View style={{ ...COL.status, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <StatusBadge ativo={categoria.ativo} />
      </View>
      <View style={{ ...COL.acoes, paddingHorizontal: space[3], paddingVertical: space[2] }}>
        <View style={{ flexDirection: "row", flexWrap: "nowrap", alignItems: "center", gap: space[2] }}>
          <Button label="Gerenciar materiais" variant="soft" size="sm" onPress={onGerenciarMateriais} style={{ width: 150 }} />
          <Button label={categoria.ativo ? "Despublicar" : "Publicar"} variant="soft" size="sm" onPress={onToggleAtivo} style={{ width: 110 }} />
          <Button label="Excluir" variant="danger" size="sm" onPress={onExcluir} style={{ width: 80 }} />
        </View>
      </View>
    </View>
  );
}
