import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, Logo, color, space, type } from "@serdono/ui";
import { useAdminFornecedores } from "./useAdminFornecedores";

export function AdminFornecedoresScreen() {
  const router = useRouter();
  const { parceiros, niches, loading, saving, error, create, toggleAtivo } = useAdminFornecedores();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [regiao, setRegiao] = useState("");
  const [contato, setContato] = useState("");
  const [site, setSite] = useState("");
  const [nichesSelecionados, setNichesSelecionados] = useState<string[]>([]);

  function toggleNiche(id: string) {
    setNichesSelecionados((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  }

  async function handleCreate() {
    if (!nome.trim() || !categoria.trim()) return;
    const ok = await create({
      nome: nome.trim(),
      categoria: categoria.trim(),
      descricao: descricao.trim() || undefined,
      regiao: regiao.trim() || undefined,
      contato: contato.trim() || undefined,
      site: site.trim() || undefined,
      niches_aplicaveis: nichesSelecionados,
    });
    if (ok) {
      setNome("");
      setCategoria("");
      setDescricao("");
      setRegiao("");
      setContato("");
      setSite("");
      setNichesSelecionados([]);
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

        {!showForm ? (
          <Button label="Cadastrar parceiro" variant="primary" onPress={() => setShowForm(true)} style={{ marginBottom: space[5] }} />
        ) : (
          <Card variant="outline" padding={5} style={{ marginBottom: space[5] }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Novo parceiro</Text>
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

            <View style={{ flexDirection: "row", gap: space[3] }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setShowForm(false)} />
              <Button label="Cadastrar" variant="primary" loading={saving} onPress={handleCreate} />
            </View>
          </Card>
        )}

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : parceiros.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum parceiro cadastrado ainda.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {parceiros.map((p) => (
              <Card key={p.id} variant="default" padding={4}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.caption, color: color.text.muted }}>{p.categoria.toUpperCase()}</Text>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{p.nome}</Text>
                    {p.descricao ? <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{p.descricao}</Text> : null}
                    {p.regiao ? <Text style={{ ...type.caption, color: color.text.muted }}>Região: {p.regiao}</Text> : null}
                    <Text style={{ ...type.caption, color: color.text.muted }}>
                      {p.niches_aplicaveis.length === 0 ? "Todos os nichos" : `${p.niches_aplicaveis.length} nicho(s) específico(s)`}
                    </Text>
                  </View>
                  <Button label={p.ativo ? "Ativo" : "Inativo"} variant={p.ativo ? "outline" : "danger"} size="sm" onPress={() => toggleAtivo(p)} />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
