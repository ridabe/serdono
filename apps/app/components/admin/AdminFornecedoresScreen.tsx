import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, Logo, color, radius, space, type } from "@serdono/ui";
import { uploadParceiroLogo, type FornecedorParceiro } from "@serdono/supabase";
import { useAdminFornecedores } from "./useAdminFornecedores";

/** Não precisa ser criptograficamente forte — só desacopla o caminho no bucket do id (ainda inexistente) do parceiro que vai ser criado. */
function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const COL = {
  logo: { width: 60 },
  nome: { flex: 1.3, minWidth: 160 },
  categoria: { flex: 1, minWidth: 130 },
  regiao: { flex: 1, minWidth: 120 },
  nichos: { flex: 1, minWidth: 120 },
  status: { flex: 1.1, minWidth: 150 },
  acoes: { width: 130 },
};

export function AdminFornecedoresScreen() {
  const router = useRouter();
  const { parceiros, niches, query, setQuery, loading, saving, error, create, toggleAtivo } = useAdminFornecedores();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [regiao, setRegiao] = useState("");
  const [contato, setContato] = useState("");
  const [site, setSite] = useState("");
  const [nichesSelecionados, setNichesSelecionados] = useState<string[]>([]);
  const [indicadoDesenvolvimento, setIndicadoDesenvolvimento] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  function toggleNiche(id: string) {
    setNichesSelecionados((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  }

  async function handlePickLogo() {
    setLogoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setLogoError("Precisamos de permissão para acessar suas fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    // Mesmo padrão de foto de perfil (usePerfilForm) — quadrado, JPEG,
    // compressão leve, mas menor (logo é exibido pequeno nos cards).
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 256, height: 256 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    setLogoUri(manipulated.uri);
  }

  async function handleCreate() {
    if (!nome.trim() || !categoria.trim()) return;

    let logo_url: string | undefined;
    if (logoUri) {
      setUploadingLogo(true);
      try {
        logo_url = await uploadParceiroLogo(randomId(), logoUri);
      } catch (e) {
        setLogoError((e as Error).message);
        setUploadingLogo(false);
        return;
      }
      setUploadingLogo(false);
    }

    const ok = await create({
      nome: nome.trim(),
      categoria: categoria.trim(),
      descricao: descricao.trim() || undefined,
      regiao: regiao.trim() || undefined,
      contato: contato.trim() || undefined,
      site: site.trim() || undefined,
      niches_aplicaveis: nichesSelecionados,
      indicado_desenvolvimento: indicadoDesenvolvimento,
      logo_url,
    });
    if (ok) {
      setNome("");
      setCategoria("");
      setDescricao("");
      setRegiao("");
      setContato("");
      setSite("");
      setNichesSelecionados([]);
      setIndicadoDesenvolvimento(false);
      setLogoUri(null);
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
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Fornecedores parceiros</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Base de parceiros sugerida ao empreendedor na Fase 8 (Fornecedores) da Jornada, filtrada pelo nicho dele. Sem
          nicho marcado, o parceiro aparece pra qualquer nicho.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], alignItems: "flex-start", marginBottom: space[4] }}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Input label="Buscar" value={query} onChangeText={setQuery} placeholder="Nome, categoria ou região" autoCapitalize="none" />
          </View>
          {/* marginTop compensa o rótulo do Input, que o botão não tem (mesmo ajuste de AdminUsersScreen). */}
          <View style={{ marginTop: type.bodyStrong.lineHeight + space[1] }}>
            <Button label={showForm ? "Cancelar" : "Cadastrar parceiro"} variant={showForm ? "ghost" : "primary"} onPress={() => setShowForm((v) => !v)} />
          </View>
        </View>

        {showForm ? (
          <Card variant="outline" padding={5} style={{ marginBottom: space[5] }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Novo parceiro</Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: space[3], marginBottom: space[4] }}>
              <Pressable onPress={handlePickLogo} accessibilityRole="button" accessibilityLabel="Escolher logo do parceiro">
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={{ width: 64, height: 64, borderRadius: radius.md }} />
                ) : (
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: radius.md,
                      backgroundColor: color.bg.surfaceAlt,
                      borderWidth: 1,
                      borderColor: color.border.default,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ ...type.caption, color: color.text.muted, textAlign: "center" }}>Sem logo</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={handlePickLogo} style={{ minHeight: 44, justifyContent: "center" }}>
                <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>{logoUri ? "Trocar logo" : "Adicionar logo (opcional)"}</Text>
              </Pressable>
            </View>
            {logoError ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{logoError}</Text> : null}

            <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Distribuidora Bom Preço" />
            <Input label="Categoria" value={categoria} onChangeText={setCategoria} placeholder="Ex.: Embalagens" />
            <Input label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} placeholder="O que oferece" />
            <Input label="Região (opcional)" value={regiao} onChangeText={setRegiao} placeholder="Ex.: São Paulo, SP ou Nacional" />
            <Input label="Contato (opcional)" value={contato} onChangeText={setContato} placeholder="Telefone, e-mail ou WhatsApp" />
            <Input label="Site (opcional)" value={site} onChangeText={setSite} placeholder="https://..." />

            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>
              Nichos aplicáveis (nenhum marcado = todos)
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[4] }}>
              {niches.map((n) => (
                <Button
                  key={n.id}
                  label={n.nome}
                  variant={nichesSelecionados.includes(n.id) ? "primary" : "outline"}
                  size="sm"
                  onPress={() => toggleNiche(n.id)}
                />
              ))}
            </View>

            <Button
              label={indicadoDesenvolvimento ? "✓ Indicado como desenvolvedor de sistema (Fase 9 — Produto)" : "Indicar como desenvolvedor de sistema (Fase 9 — Produto)"}
              variant={indicadoDesenvolvimento ? "primary" : "outline"}
              size="sm"
              onPress={() => setIndicadoDesenvolvimento((v) => !v)}
              style={{ alignSelf: "flex-start", marginBottom: space[4] }}
            />

            <View style={{ flexDirection: "row", gap: space[3] }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setShowForm(false)} />
              <Button label="Cadastrar" variant="primary" loading={saving || uploadingLogo} onPress={handleCreate} />
            </View>
          </Card>
        ) : null}

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : parceiros.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum parceiro encontrado.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
            <View style={{ width: "100%", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: color.border.default }}>
              <FornecedoresTableHeader />
              {parceiros.map((p, i) => (
                <FornecedorRow key={p.id} parceiro={p} index={i} onToggleAtivo={() => toggleAtivo(p)} />
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

function FornecedoresTableHeader() {
  return (
    <View style={{ flexDirection: "row", backgroundColor: color.bg.surfaceAlt, borderBottomWidth: 1, borderBottomColor: color.border.default }}>
      <HeaderCell colStyle={COL.logo} label="" />
      <HeaderCell colStyle={COL.nome} label="Nome" />
      <HeaderCell colStyle={COL.categoria} label="Categoria" />
      <HeaderCell colStyle={COL.regiao} label="Região" />
      <HeaderCell colStyle={COL.nichos} label="Nichos" />
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

function FornecedorRow({
  parceiro: p,
  index,
  onToggleAtivo,
}: {
  parceiro: FornecedorParceiro;
  index: number;
  onToggleAtivo: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: index % 2 === 1 ? color.bg.surfaceAlt : color.bg.surface,
        borderBottomWidth: 1,
        borderBottomColor: color.border.default,
      }}
    >
      <View style={{ ...COL.logo, paddingHorizontal: space[3], paddingVertical: space[2] }}>
        {p.logo_url ? (
          <Image source={{ uri: p.logo_url }} style={{ width: 36, height: 36, borderRadius: radius.sm }} />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.sm,
              backgroundColor: color.bg.surfaceAlt,
              borderWidth: 1,
              borderColor: color.border.default,
            }}
          />
        )}
      </View>
      <View style={{ ...COL.nome, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
          {p.nome}
        </Text>
        {p.descricao ? (
          <Text style={{ ...type.caption, color: color.text.muted }} numberOfLines={1}>
            {p.descricao}
          </Text>
        ) : null}
      </View>
      <View style={{ ...COL.categoria, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.body, color: color.text.secondary }} numberOfLines={1}>
          {p.categoria}
        </Text>
      </View>
      <View style={{ ...COL.regiao, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.body, color: p.regiao ? color.text.secondary : color.text.muted }} numberOfLines={1}>
          {p.regiao || "—"}
        </Text>
      </View>
      <View style={{ ...COL.nichos, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <Text style={{ ...type.caption, color: color.text.muted }} numberOfLines={1}>
          {p.niches_aplicaveis.length === 0 ? "Todos" : `${p.niches_aplicaveis.length} nicho(s)`}
        </Text>
      </View>
      <View style={{ ...COL.status, paddingHorizontal: space[3], paddingVertical: space[3] }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          <Badge label={p.ativo ? "Ativo" : "Inativo"} tone={p.ativo ? "success" : "danger"} />
          {p.indicado_desenvolvimento ? <Badge label="Dev (Fase 9)" tone="info" /> : null}
        </View>
      </View>
      <View style={{ ...COL.acoes, paddingHorizontal: space[3], paddingVertical: space[2] }}>
        <Button label={p.ativo ? "Desativar" : "Ativar"} variant={p.ativo ? "outline" : "primary"} size="sm" onPress={onToggleAtivo} style={{ width: 110 }} />
      </View>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: "info" | "danger" | "success" }) {
  const tones = {
    info: { bg: color.state.infoBg, fg: color.state.info },
    danger: { bg: color.state.dangerBg, fg: color.state.danger },
    success: { bg: color.state.successBg, fg: color.state.success },
  }[tone];
  return (
    <View style={{ backgroundColor: tones.bg, borderRadius: 999, paddingHorizontal: space[2], paddingVertical: 2 }}>
      <Text style={{ ...type.caption, color: tones.fg, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
