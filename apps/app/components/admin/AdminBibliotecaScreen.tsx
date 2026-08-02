import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Card, Input, Logo, color, radius, space, type } from "@serdono/ui";
import { CONTEUDO_NIVEL_LABEL, CONTEUDO_TIPO_LABEL, type ConteudoNivel, type ConteudoTipo } from "@serdono/supabase";
import { useAdminBiblioteca } from "./useAdminBiblioteca";

const TIPOS: ConteudoTipo[] = ["curso", "video", "apostila", "dica"];
const NIVEIS: ConteudoNivel[] = ["basico", "intermediario", "avancado"];

function textAreaStyle() {
  return {
    minHeight: 80,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontSize: 14,
    textAlignVertical: "top" as const,
  };
}

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

export function AdminBibliotecaScreen() {
  const router = useRouter();
  const v = useAdminBiblioteca();
  const [showForm, setShowForm] = useState(false);

  const [tipo, setTipo] = useState<ConteudoTipo>("dica");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [conteudoMd, setConteudoMd] = useState("");
  const [duracaoMin, setDuracaoMin] = useState("");
  const [nivel, setNivel] = useState<ConteudoNivel | null>(null);

  function limparForm() {
    setTitulo("");
    setDescricao("");
    setVideoUrl("");
    setArquivoUrl("");
    setConteudoMd("");
    setDuracaoMin("");
    setNivel(null);
  }

  async function handleCreate() {
    if (!titulo.trim()) return;
    const ok = await v.create({
      tipo,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      video_url: videoUrl.trim() || null,
      arquivo_url: arquivoUrl.trim() || null,
      conteudo_md: conteudoMd.trim() || null,
      duracao_min: duracaoMin.trim() ? Number(duracaoMin) : null,
      nivel,
    });
    if (ok) {
      limparForm();
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
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Biblioteca</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Cursos, vídeos, apostilas e dicas exibidos no painel do empreendedor. Só conteúdo marcado "Publicado"
          aparece pra ele.
        </Text>

        {!showForm ? (
          <Button label="Novo conteúdo" variant="primary" onPress={() => setShowForm(true)} style={{ marginBottom: space[5] }} />
        ) : (
          <Card variant="outline" padding={5} style={{ marginBottom: space[5] }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Novo conteúdo</Text>

            <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[2] }}>TIPO</Text>
            <View style={{ flexDirection: "row", gap: space[2], flexWrap: "wrap", marginBottom: space[4] }}>
              {TIPOS.map((t) => (
                <Pill key={t} label={CONTEUDO_TIPO_LABEL[t]} active={tipo === t} onPress={() => setTipo(t)} />
              ))}
            </View>

            <Input label="Título" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Precificação na prática" />
            <Input label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} placeholder="Resumo curto" />

            {tipo === "video" || tipo === "curso" ? (
              <Input
                label={tipo === "curso" ? "Vídeo de introdução (opcional)" : "URL do vídeo"}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://…"
                autoCapitalize="none"
              />
            ) : null}

            {tipo === "apostila" ? (
              <Input label="URL do arquivo (PDF)" value={arquivoUrl} onChangeText={setArquivoUrl} placeholder="https://…" autoCapitalize="none" />
            ) : null}

            {tipo === "dica" ? (
              <View style={{ marginBottom: space[4] }}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Texto da dica</Text>
                <TextInput value={conteudoMd} onChangeText={setConteudoMd} placeholder="Escreva a dica" multiline style={textAreaStyle()} />
              </View>
            ) : null}

            {tipo === "video" ? (
              <Input label="Duração em minutos (opcional)" value={duracaoMin} onChangeText={setDuracaoMin} placeholder="8" keyboardType="numeric" />
            ) : null}

            <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[2] }}>NÍVEL (OPCIONAL)</Text>
            <View style={{ flexDirection: "row", gap: space[2], flexWrap: "wrap", marginBottom: space[4] }}>
              {NIVEIS.map((n) => (
                <Pill key={n} label={CONTEUDO_NIVEL_LABEL[n]} active={nivel === n} onPress={() => setNivel(nivel === n ? null : n)} />
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: space[3] }}>
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={() => {
                  limparForm();
                  setShowForm(false);
                }}
              />
              <Button label="Salvar como rascunho" variant="primary" loading={v.saving} onPress={handleCreate} />
            </View>
          </Card>
        )}

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : v.conteudos.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum conteúdo cadastrado ainda.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {v.conteudos.map((c) => (
              <Card key={c.id} variant="default" padding={4}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space[3] }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
                      <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{c.titulo}</Text>
                      <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: space[2] }}>
                        <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "700" }}>
                          {CONTEUDO_TIPO_LABEL[c.tipo as ConteudoTipo] ?? c.tipo}
                        </Text>
                      </View>
                    </View>
                    {c.descricao ? <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{c.descricao}</Text> : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: space[2] }}>
                    <Button label={c.ativo ? "Publicado" : "Rascunho"} variant={c.ativo ? "outline" : "danger"} size="sm" onPress={() => v.toggleAtivo(c)} />
                    <Button label="Excluir" variant="ghost" size="sm" onPress={() => v.remove(c.id)} />
                  </View>
                </View>

                {c.tipo === "curso" ? (
                  <CursoAulas
                    conteudoId={c.id}
                    aberto={v.aulasAbertas[c.id]}
                    carregando={v.carregandoAulas === c.id}
                    onToggle={() => v.toggleAulas(c.id)}
                    onCriarAula={(input) => v.criarAula(c.id, input)}
                    onRemoverAula={(aulaId) => v.removerAula(c.id, aulaId)}
                  />
                ) : null}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CursoAulas({
  conteudoId: _conteudoId,
  aberto,
  carregando,
  onToggle,
  onCriarAula,
  onRemoverAula,
}: {
  conteudoId: string;
  aberto?: { aulas: { id: string; titulo: string; duracao_min: number | null }[] };
  carregando: boolean;
  onToggle: () => void;
  onCriarAula: (input: { titulo: string; video_url?: string; duracao_min?: number }) => void;
  onRemoverAula: (aulaId: string) => void;
}) {
  const [tituloAula, setTituloAula] = useState("");
  const [videoAula, setVideoAula] = useState("");

  return (
    <View style={{ marginTop: space[3], paddingTop: space[3], borderTopWidth: 1, borderTopColor: color.border.default }}>
      <Button label={aberto ? "Ocultar aulas" : carregando ? "Carregando…" : "Gerenciar aulas"} variant="ghost" size="sm" onPress={onToggle} />
      {aberto ? (
        <View style={{ marginTop: space[3], gap: space[2] }}>
          {aberto.aulas.map((a) => (
            <View key={a.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ ...type.body, color: color.text.primary }}>
                {a.titulo}
                {a.duracao_min ? ` · ${a.duracao_min} min` : ""}
              </Text>
              <Button label="Remover" variant="ghost" size="sm" onPress={() => onRemoverAula(a.id)} />
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: space[2], marginTop: space[2], alignItems: "flex-end" }}>
            <View style={{ flex: 1 }}>
              <Input label="Nova aula" value={tituloAula} onChangeText={setTituloAula} placeholder="Título da aula" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Vídeo (opcional)" value={videoAula} onChangeText={setVideoAula} placeholder="https://…" autoCapitalize="none" />
            </View>
            <Button
              label="Adicionar"
              variant="primary"
              size="sm"
              onPress={() => {
                if (!tituloAula.trim()) return;
                onCriarAula({ titulo: tituloAula.trim(), video_url: videoAula.trim() || undefined });
                setTituloAula("");
                setVideoAula("");
              }}
              style={{ marginBottom: space[4] }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
