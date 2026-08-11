import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, Logo, color, radius, space, type } from "@serdono/ui";
import type { ModuleRow } from "@serdono/supabase";
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

const COL = {
  ordem: { width: 64 },
  nome: { flex: 1.2, minWidth: 170 },
  slug: { flex: 1, minWidth: 140 },
  descricao: { flex: 1.6, minWidth: 220 },
  status: { flex: 0.7, minWidth: 110 },
  acoes: { width: 130 },
};

/**
 * Admin — catálogo de módulos do sistema (SDD-30). Tabela em vez de cards
 * empilhados, busca em tempo real e ordenação por setas — mesmo padrão já
 * aplicado em Usuários, Fornecedores e Dicas da Mary. A liberação por
 * usuário continua na tela de cada usuário (`/admin/usuarios/[id]`), não
 * aqui — este catálogo só controla o que existe e se aparece no menu.
 */
export function AdminModulesScreen() {
  const router = useRouter();
  const { modules, buscando, query, setQuery, loading, saving, error, create, toggleAtivo, mover } = useAdminModules();
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

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], alignItems: "flex-start", marginBottom: space[4] }}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Input label="Buscar" value={query} onChangeText={setQuery} placeholder="Nome ou descrição" autoCapitalize="none" />
          </View>
          <View style={{ marginTop: type.bodyStrong.lineHeight + space[1] }}>
            <Button label={showForm ? "Cancelar" : "Cadastrar módulo"} variant={showForm ? "ghost" : "primary"} onPress={() => setShowForm((s) => !s)} />
          </View>
        </View>

        {showForm ? (
          <Card variant="outline" padding={5} style={{ marginBottom: space[4] }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Novo módulo</Text>
            <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Financeiro" />
            <Input label="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Descrição curta (opcional)" />
            <View style={{ flexDirection: "row", gap: space[3] }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setShowForm(false)} />
              <Button label="Cadastrar" variant="primary" loading={saving} onPress={handleCreate} />
            </View>
          </Card>
        ) : null}

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : modules.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>{buscando ? "Nenhum módulo encontrado." : "Nenhum módulo cadastrado ainda."}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
            <View style={{ width: "100%", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: color.border.default }}>
              <TableHeader />
              {modules.map((m, i) => (
                <ModuleRowItem
                  key={m.id}
                  modulo={m}
                  podeReordenar={!buscando}
                  podeSubir={i > 0}
                  podeDescer={i < modules.length - 1}
                  onMoverCima={() => mover(m, -1)}
                  onMoverBaixo={() => mover(m, 1)}
                  onToggleAtivo={() => toggleAtivo(m)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

function TableHeader() {
  return (
    <View style={{ flexDirection: "row", backgroundColor: color.bg.surfaceAlt, borderBottomWidth: 1, borderBottomColor: color.border.default }}>
      <HeaderCell colStyle={COL.ordem} label="Ordem" />
      <HeaderCell colStyle={COL.nome} label="Nome" />
      <HeaderCell colStyle={COL.slug} label="Slug" />
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
        backgroundColor: ativo ? color.state.successBg : color.state.dangerBg,
        borderRadius: radius.full,
        paddingHorizontal: space[2],
        paddingVertical: 2,
      }}
    >
      <Text style={{ ...type.caption, color: ativo ? color.state.success : color.state.danger, fontWeight: "700" }}>
        {ativo ? "Ativo" : "Inativo"}
      </Text>
    </View>
  );
}

function ModuleRowItem({
  modulo: m,
  podeReordenar,
  podeSubir,
  podeDescer,
  onMoverCima,
  onMoverBaixo,
  onToggleAtivo,
}: {
  modulo: ModuleRow;
  podeReordenar: boolean;
  podeSubir: boolean;
  podeDescer: boolean;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
  onToggleAtivo: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: color.border.default }}>
      <View style={{ ...COL.ordem, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        {podeReordenar ? <OrdemButtons podeSubir={podeSubir} podeDescer={podeDescer} onCima={onMoverCima} onBaixo={onMoverBaixo} /> : null}
      </View>
      <View style={{ ...COL.nome, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
          {m.nome}
        </Text>
      </View>
      <View style={{ ...COL.slug, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.mono, color: color.text.muted }} numberOfLines={1}>
          {m.slug}
        </Text>
      </View>
      <View style={{ ...COL.descricao, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.body, color: m.descricao ? color.text.secondary : color.text.muted }} numberOfLines={2}>
          {m.descricao || "—"}
        </Text>
      </View>
      <View style={{ ...COL.status, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <StatusBadge ativo={m.ativo} />
      </View>
      <View style={{ ...COL.acoes, paddingHorizontal: space[3], paddingVertical: space[2] }}>
        <Button label={m.ativo ? "Desativar" : "Ativar"} variant={m.ativo ? "soft" : "primary"} size="sm" onPress={onToggleAtivo} style={{ width: 100 }} />
      </View>
    </View>
  );
}
