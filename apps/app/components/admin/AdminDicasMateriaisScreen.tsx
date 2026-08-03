import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, color, radius, space, type } from "@serdono/ui";
import type { DicasMaterial, MaterialNivel } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { YoutubeEmbed } from "../dicas/YoutubeEmbed";
import { useAdminDicasMateriais } from "./useAdminDicasMateriais";

const NIVEIS: MaterialNivel[] = ["basico", "intermediario", "avancado"];
const NIVEL_LABEL: Record<MaterialNivel, string> = { basico: "Básico", intermediario: "Intermediário", avancado: "Avançado" };

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
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          PDF, vídeo do YouTube e link externo são independentes — um material pode ter os três ao mesmo tempo.
        </Text>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{v.error}</Text> : null}

        {showForm ? (
          <Card variant="outline" padding={5} style={{ marginBottom: space[4] }}>
            <Input label="Título" value={titulo} onChangeText={setTitulo} placeholder="Título do material" />
            <Input label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} />

            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>PDF</Text>
            {arquivoUrl ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space[2], marginBottom: space[3] }}>
                <Text style={{ ...type.body, color: color.text.secondary, flex: 1 }}>{arquivoNome}</Text>
                <Button label="Remover" variant="ghost" size="sm" onPress={() => { setArquivoUrl(null); setArquivoNome(null); }} />
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
            {videoUrl.trim() ? <View style={{ marginBottom: space[4] }}><YoutubeEmbed url={videoUrl.trim()} /></View> : null}

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
              <Button label="Cancelar" variant="ghost" onPress={() => { limparForm(); setShowForm(false); }} />
            </View>
          </Card>
        ) : (
          <Button label="+ Novo material" variant="outline" onPress={() => setShowForm(true)} style={{ alignSelf: "flex-start", marginBottom: space[4] }} />
        )}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : v.materiais.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum material cadastrado ainda nesta categoria.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {v.materiais.map((material, i) => (
              <MaterialCard
                key={material.id}
                material={material}
                podeSubir={i > 0}
                podeDescer={i < v.materiais.length - 1}
                onMoverCima={() => v.mover(material.id, "cima")}
                onMoverBaixo={() => v.mover(material.id, "baixo")}
                onToggleAtivo={() => v.toggleAtivo(material)}
                onRemover={() => v.remove(material.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MaterialCard({
  material,
  podeSubir,
  podeDescer,
  onMoverCima,
  onMoverBaixo,
  onToggleAtivo,
  onRemover,
}: {
  material: DicasMaterial;
  podeSubir: boolean;
  podeDescer: boolean;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
  onToggleAtivo: () => void;
  onRemover: () => void;
}) {
  const midias = [material.arquivo_url && "PDF", material.video_url && "Vídeo", material.link_externo_url && "Link"].filter(Boolean).join(" · ");

  return (
    <Card variant="default" padding={4}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[3] }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{material.titulo}</Text>
          <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{midias || "Sem mídia ainda"}</Text>
        </View>
        <View
          style={{
            backgroundColor: material.ativo ? color.state.successBg : color.bg.surfaceAlt,
            borderRadius: radius.full,
            paddingHorizontal: space[3],
            paddingVertical: 4,
          }}
        >
          <Text style={{ ...type.caption, color: material.ativo ? color.state.success : color.text.muted, fontWeight: "700" }}>
            {material.ativo ? "PUBLICADO" : "RASCUNHO"}
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
        <Button label={material.ativo ? "Despublicar" : "Publicar"} variant="ghost" size="sm" onPress={onToggleAtivo} />
        <Button label="Excluir" variant="ghost" size="sm" onPress={onRemover} />
      </View>
    </Card>
  );
}
