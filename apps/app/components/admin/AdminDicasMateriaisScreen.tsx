import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, ConfirmModal, Input, color, radius, space, type } from "@serdono/ui";
import type { DicasMaterial, MaterialNivel } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { YoutubeEmbed } from "../dicas/YoutubeEmbed";
import { useAdminDicasMateriais } from "./useAdminDicasMateriais";

const NIVEIS: MaterialNivel[] = ["basico", "intermediario", "avancado"];
const NIVEL_LABEL: Record<MaterialNivel, string> = { basico: "Básico", intermediario: "Intermediário", avancado: "Avançado" };

const COL = {
  ordem: { width: 64 },
  titulo: { flex: 1.3, minWidth: 170 },
  midia: { flex: 1, minWidth: 150 },
  nivel: { flex: 0.7, minWidth: 110 },
  status: { flex: 0.7, minWidth: 120 },
  acoes: { width: 240 },
};

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        paddingHorizontal: space[3],
        paddingVertical: space[2],
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: active ? color.action.primary : color.border.default,
        backgroundColor: active ? color.action.primarySubtle : color.bg.surface,
      }}
    >
      <Text style={{ ...type.caption, fontWeight: "700", color: active ? "#8A5B06" : color.text.secondary }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Admin — materiais de uma categoria de "Dicas da Mary" (SDD-59). Os três
 * campos de mídia são independentes (nunca pills exclusivas) — um material
 * pode ter PDF + vídeo + link ao mesmo tempo.
 *
 * Tabela em vez de cards empilhados (mesmo padrão de `AdminDicasCategoriasScreen`
 * e das demais telas do Painel Admin).
 */
export function AdminDicasMateriaisScreen() {
  const router = useRouter();
  const { id: categoriaId } = useLocalSearchParams<{ id: string }>();
  const v = useAdminDicasMateriais(categoriaId ?? "");
  const [showForm, setShowForm] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [nivel, setNivel] = useState<MaterialNivel | null>(null);
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null);
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<DicasMaterial | null>(null);

  function limparForm() {
    setTitulo("");
    setDescricao("");
    setVideoUrl("");
    setLinkUrl("");
    setLinkLabel("");
    setNivel(null);
    setArquivoUrl(null);
    setArquivoNome(null);
  }

  async function handleSelecionarPdf() {
    const resultado = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (resultado.canceled || !resultado.assets[0]) return;
    const asset = resultado.assets[0];
    const url = await v.subirPdf(asset.uri);
    if (url) {
      setArquivoUrl(url);
      setArquivoNome(asset.name);
    }
  }

  async function handleCreate() {
    if (!titulo.trim()) return;
    const ok = await v.create({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      arquivo_url: arquivoUrl,
      arquivo_nome: arquivoNome,
      video_url: videoUrl.trim() || null,
      link_externo_url: linkUrl.trim() || null,
      link_externo_label: linkLabel.trim() || null,
      nivel,
    });
    if (ok) {
      limparForm();
      setShowForm(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Categorias", onPress: () => router.push("/admin/dicas") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Materiais</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          PDF, vídeo do YouTube e link externo são independentes — um material pode ter os três ao mesmo tempo.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], alignItems: "flex-start", marginBottom: space[4] }}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Input label="Buscar" value={v.query} onChangeText={v.setQuery} placeholder="Título do material" autoCapitalize="none" />
          </View>
          <View style={{ marginTop: type.bodyStrong.lineHeight + space[1] }}>
            <Button label={showForm ? "Cancelar" : "Novo material"} variant={showForm ? "ghost" : "primary"} onPress={() => setShowForm((s) => !s)} />
          </View>
        </View>

        {showForm ? (
          <Card variant="outline" padding={5} style={{ marginBottom: space[4] }}>
            <Input label="Título" value={titulo} onChangeText={setTitulo} placeholder="Título do material" />
            <Input label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} />

            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>PDF</Text>
            {arquivoUrl ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space[2], marginBottom: space[3] }}>
                <Text style={{ ...type.body, color: color.text.secondary, flex: 1 }}>{arquivoNome}</Text>
                <Button
                  label="Remover"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setArquivoUrl(null);
                    setArquivoNome(null);
                  }}
                />
              </View>
            ) : (
              <Button
                label={v.uploadingPdf ? "Enviando..." : "Selecionar PDF"}
                variant="outline"
                size="sm"
                loading={v.uploadingPdf}
                onPress={handleSelecionarPdf}
                style={{ alignSelf: "flex-start", marginBottom: space[4] }}
              />
            )}

            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Vídeo do YouTube</Text>
            <Input label="URL do vídeo" value={videoUrl} onChangeText={setVideoUrl} placeholder="https://youtube.com/watch?v=…" autoCapitalize="none" />
            {videoUrl.trim() ? (
              <View style={{ marginBottom: space[4] }}>
                <YoutubeEmbed url={videoUrl.trim()} />
              </View>
            ) : null}

            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Link externo</Text>
            <Input label="URL" value={linkUrl} onChangeText={setLinkUrl} placeholder="https://…" autoCapitalize="none" />
            <Input label="Rótulo do botão" value={linkLabel} onChangeText={setLinkLabel} placeholder="Ex.: Ler artigo completo" />

            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Nível (opcional)</Text>
            <View style={{ flexDirection: "row", gap: space[2], marginBottom: space[4] }}>
              {NIVEIS.map((n) => (
                <Pill key={n} label={NIVEL_LABEL[n]} active={nivel === n} onPress={() => setNivel(nivel === n ? null : n)} />
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: space[2] }}>
              <Button label={v.saving ? "Salvando..." : "Criar material"} variant="primary" loading={v.saving} onPress={handleCreate} />
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={() => {
                  limparForm();
                  setShowForm(false);
                }}
              />
            </View>
          </Card>
        ) : null}

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : v.materiais.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>
            {v.buscando ? "Nenhum material encontrado." : "Nenhum material cadastrado ainda nesta categoria."}
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
            <View style={{ width: "100%", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: color.border.default }}>
              <TableHeader />
              {v.materiais.map((material, i) => (
                <MaterialRow
                  key={material.id}
                  material={material}
                  podeReordenar={!v.buscando}
                  podeSubir={i > 0}
                  podeDescer={i < v.materiais.length - 1}
                  onMoverCima={() => v.mover(material.id, "cima")}
                  onMoverBaixo={() => v.mover(material.id, "baixo")}
                  onToggleAtivo={() => v.toggleAtivo(material)}
                  onExcluir={() => setConfirmandoExclusao(material)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmandoExclusao !== null}
        title="Excluir material"
        message={confirmandoExclusao ? `Excluir "${confirmandoExclusao.titulo}" apaga o material pra sempre. Não dá pra desfazer.` : ""}
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
      <HeaderCell colStyle={COL.midia} label="Mídia" />
      <HeaderCell colStyle={COL.nivel} label="Nível" />
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

function MaterialRow({
  material,
  podeReordenar,
  podeSubir,
  podeDescer,
  onMoverCima,
  onMoverBaixo,
  onToggleAtivo,
  onExcluir,
}: {
  material: DicasMaterial;
  podeReordenar: boolean;
  podeSubir: boolean;
  podeDescer: boolean;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
  onToggleAtivo: () => void;
  onExcluir: () => void;
}) {
  const midias = [material.arquivo_url && "PDF", material.video_url && "Vídeo", material.link_externo_url && "Link"].filter(Boolean).join(" · ");

  return (
    <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: color.border.default }}>
      <View style={{ ...COL.ordem, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        {podeReordenar ? <OrdemButtons podeSubir={podeSubir} podeDescer={podeDescer} onCima={onMoverCima} onBaixo={onMoverBaixo} /> : null}
      </View>
      <View style={{ ...COL.titulo, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
          {material.titulo}
        </Text>
        {material.descricao ? (
          <Text style={{ ...type.caption, color: color.text.muted }} numberOfLines={1}>
            {material.descricao}
          </Text>
        ) : null}
      </View>
      <View style={{ ...COL.midia, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.body, color: midias ? color.text.secondary : color.text.muted }} numberOfLines={1}>
          {midias || "Sem mídia ainda"}
        </Text>
      </View>
      <View style={{ ...COL.nivel, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.caption, color: color.text.muted }}>{material.nivel ? NIVEL_LABEL[material.nivel as MaterialNivel] : "—"}</Text>
      </View>
      <View style={{ ...COL.status, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <StatusBadge ativo={material.ativo} />
      </View>
      <View style={{ ...COL.acoes, paddingHorizontal: space[3], paddingVertical: space[2] }}>
        <View style={{ flexDirection: "row", flexWrap: "nowrap", alignItems: "center", gap: space[2] }}>
          <Button label={material.ativo ? "Despublicar" : "Publicar"} variant="soft" size="sm" onPress={onToggleAtivo} style={{ width: 110 }} />
          <Button label="Excluir" variant="danger" size="sm" onPress={onExcluir} style={{ width: 80 }} />
        </View>
      </View>
    </View>
  );
}
