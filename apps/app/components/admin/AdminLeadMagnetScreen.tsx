import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Card, ConfirmModal, Input, Logo, color, radius, space, type } from "@serdono/ui";
import type { AdminLeadMagnetPatch, AdminLeadMagnetRow } from "@serdono/supabase";
import { EBOOK } from "../../data/ebook";
import { useAdminLeadMagnet } from "./useAdminLeadMagnet";

function formatDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Painel Admin — leads da landing do e-book (SDD-140). Lista quem preencheu
 * o formulário de 5 perguntas e baixou a isca (SDD-139): contato + respostas,
 * com busca server-side, paginação por offset, editar/excluir por linha,
 * exclusão em lote e "copiar e-mails" — este último é o gancho pro envio de
 * e-mail em massa quando essa área existir.
 */
export function AdminLeadMagnetScreen() {
  const router = useRouter();
  const {
    rows,
    total,
    pagina,
    totalPaginas,
    hasPrev,
    hasNext,
    setPagina,
    buscaInput,
    setBuscaInput,
    loading,
    error,
    feedback,
    actingOn,
    selecionados,
    selecionadosCount,
    paginaTodaSelecionada,
    toggleSelecionado,
    selecionarPagina,
    limparSelecao,
    salvarEdicao,
    excluir,
    excluirSelecionados,
    copiarEmails,
  } = useAdminLeadMagnet();

  const [editando, setEditando] = useState<AdminLeadMagnetRow | null>(null);
  const [excluindo, setExcluindo] = useState<AdminLeadMagnetRow | null>(null);
  const [confirmandoLote, setConfirmandoLote] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const [emailsTexto, setEmailsTexto] = useState<string | null>(null);

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
        <Pressable
          onPress={() => router.push("/admin")}
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Painel</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Leads do e-book</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Quem preencheu o formulário e baixou o guia “{EBOOK.titulo}” na landing{" "}
            <Text style={{ ...type.bodyStrong }}>/ebook</Text>.
          </Text>
        </View>

        {error ? <Text style={{ ...type.caption, color: color.state.danger }}>{error}</Text> : null}
        {feedback ? <Text style={{ ...type.caption, color: color.state.success }}>{feedback}</Text> : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
          <Kpi label="Total de cadastros" value={String(total)} />
          <Kpi label="Nesta página" value={String(rows.length)} />
          <Kpi label="Selecionados" value={String(selecionadosCount)} />
        </View>

        {/* ---- Envio de e-mail em massa (preparado, SDD-140) ---- */}
        <Card variant="outline" padding={5}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>
            Envio de e-mail em massa
          </Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
            A área de disparo pra todos os cadastrados desta lista ainda não existe. Quando existir, ela vai
            consumir estes mesmos leads. Por enquanto dá pra copiar todos os e-mails pra usar numa ferramenta
            externa.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
            <Button
              label={copiando ? "Buscando..." : "Ver / copiar e-mails de todos"}
              variant="secondary"
              size="sm"
              loading={copiando}
              onPress={async () => {
                setCopiando(true);
                try {
                  const res = await copiarEmails();
                  setEmailsTexto(res.texto || "(nenhum e-mail cadastrado)");
                } catch {
                  /* erro já vai pro estado via hook */
                } finally {
                  setCopiando(false);
                }
              }}
            />
            <Button label="Enviar e-mail em massa (em breve)" variant="soft" size="sm" disabled onPress={() => {}} />
          </View>

          {emailsTexto !== null ? (
            <View style={{ marginTop: space[3] }}>
              <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[1] }}>
                Toque na caixa, selecione tudo e copie:
              </Text>
              <TextInput
                value={emailsTexto}
                editable={false}
                selectTextOnFocus
                multiline
                style={{
                  minHeight: 72,
                  maxHeight: 160,
                  borderWidth: 1,
                  borderColor: color.border.default,
                  borderRadius: radius.md,
                  padding: space[3],
                  fontSize: 13,
                  lineHeight: 18,
                  color: color.text.secondary,
                  backgroundColor: color.bg.surfaceAlt,
                }}
              />
            </View>
          ) : null}
        </Card>

        {/* ---- Busca ---- */}
        <View style={{ maxWidth: 360 }}>
          <Input
            label="Buscar"
            value={buscaInput}
            onChangeText={setBuscaInput}
            placeholder="Nome, e-mail ou telefone"
            autoCapitalize="none"
          />
        </View>

        {/* ---- Barra de seleção ---- */}
        {selecionadosCount > 0 ? (
          <Card variant="default" padding={4}>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: space[2] }}
            >
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
                {selecionadosCount} selecionado{selecionadosCount === 1 ? "" : "s"}
              </Text>
              <View style={{ flexDirection: "row", gap: space[2] }}>
                <Button label="Limpar seleção" variant="ghost" size="sm" onPress={limparSelecao} />
                <Button
                  label="Excluir selecionados"
                  variant="danger"
                  size="sm"
                  loading={actingOn === "__bulk__"}
                  onPress={() => setConfirmandoLote(true)}
                />
              </View>
            </View>
          </Card>
        ) : null}

        {/* ---- Tabela ---- */}
        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : rows.length === 0 ? (
          <Card variant="outline" padding={5}>
            <Text style={{ ...type.body, color: color.text.secondary }}>
              {buscaInput ? "Nenhum lead bate com a busca." : "Ainda não há cadastros nesta lista."}
            </Text>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
            <View
              style={{
                borderRadius: radius.lg,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: color.border.default,
              }}
            >
              {/* Cabeçalho */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: color.bg.surfaceAlt,
                  borderBottomWidth: 1,
                  borderBottomColor: color.border.default,
                }}
              >
                <CheckCell onPress={selecionarPagina} checked={paginaTodaSelecionada} header />
                <HeaderCell style={{ width: 150 }} label="Nome" />
                <HeaderCell style={{ width: 210 }} label="E-mail" />
                <HeaderCell style={{ width: 130 }} label="Telefone" />
                <HeaderCell style={{ width: 190 }} label="Momento" />
                <HeaderCell style={{ width: 170 }} label="Vontade" />
                <HeaderCell style={{ width: 170 }} label="Tem ideia" />
                <HeaderCell style={{ width: 160 }} label="Capital de giro" />
                <HeaderCell style={{ width: 160 }} label="Prazo" />
                <HeaderCell style={{ width: 140 }} label="Cadastro" />
                <HeaderCell style={{ width: 150 }} label="Ações" />
              </View>

              {rows.map((lead, i) => (
                <View
                  key={lead.id}
                  style={{
                    flexDirection: "row",
                    backgroundColor: selecionados.has(lead.id)
                      ? color.action.primarySubtle
                      : i % 2 === 1
                        ? color.bg.surfaceAlt
                        : color.bg.surface,
                    borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                    borderBottomColor: color.border.default,
                  }}
                >
                  <CheckCell onPress={() => toggleSelecionado(lead.id)} checked={selecionados.has(lead.id)} />
                  <Cell style={{ width: 150 }}>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={2}>
                      {lead.nome || "(sem nome)"}
                    </Text>
                  </Cell>
                  <Cell style={{ width: 210 }}>
                    <Text style={{ ...type.body, color: color.text.secondary }} numberOfLines={1}>
                      {lead.email}
                    </Text>
                  </Cell>
                  <Cell style={{ width: 130 }}>
                    <Text style={{ ...type.body, color: color.text.secondary }} numberOfLines={1}>
                      {lead.telefone || "—"}
                    </Text>
                  </Cell>
                  <RespostaCell texto={lead.q_momento} />
                  <RespostaCell texto={lead.q_vontade} />
                  <RespostaCell texto={lead.q_tem_ideia} />
                  <RespostaCell texto={lead.q_capital_giro} width={160} />
                  <RespostaCell texto={lead.q_prazo} width={160} />
                  <Cell style={{ width: 140 }}>
                    <Text style={{ ...type.caption, color: color.text.muted }}>{formatDataHora(lead.created_at)}</Text>
                  </Cell>
                  <Cell style={{ width: 150 }}>
                    <View style={{ flexDirection: "row", gap: space[2] }}>
                      <Button label="Editar" variant="soft" size="sm" onPress={() => setEditando(lead)} />
                      <Button
                        label="Excluir"
                        variant="ghost"
                        size="sm"
                        loading={actingOn === lead.id}
                        onPress={() => setExcluindo(lead)}
                      />
                    </View>
                  </Cell>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ---- Paginação ---- */}
        {rows.length > 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: space[2] }}>
            <Text style={{ ...type.caption, color: color.text.muted }}>
              Página {pagina} de {totalPaginas} · {total} cadastro{total === 1 ? "" : "s"}
            </Text>
            <View style={{ flexDirection: "row", gap: space[2] }}>
              <Button label="← Anterior" variant="outline" size="sm" disabled={!hasPrev} onPress={() => setPagina(pagina - 1)} />
              <Button label="Próxima →" variant="outline" size="sm" disabled={!hasNext} onPress={() => setPagina(pagina + 1)} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {editando ? (
        <EditarLeadModal
          lead={editando}
          loading={actingOn === editando.id}
          onCancel={() => setEditando(null)}
          onSalvar={async (patch) => {
            await salvarEdicao(editando.id, patch);
            setEditando(null);
          }}
        />
      ) : null}

      <ConfirmModal
        visible={!!excluindo}
        title="Excluir cadastro"
        message={
          excluindo
            ? `Remover ${excluindo.nome || excluindo.email} da lista? Essa ação não tem volta.`
            : ""
        }
        confirmLabel="Excluir"
        loading={!!excluindo && actingOn === excluindo.id}
        onConfirm={async () => {
          if (excluindo) await excluir(excluindo.id);
          setExcluindo(null);
        }}
        onCancel={() => setExcluindo(null)}
      />

      <ConfirmModal
        visible={confirmandoLote}
        title="Excluir selecionados"
        message={`Remover ${selecionadosCount} cadastro${selecionadosCount === 1 ? "" : "s"} da lista? Essa ação não tem volta.`}
        confirmLabel="Excluir todos"
        loading={actingOn === "__bulk__"}
        onConfirm={async () => {
          await excluirSelecionados();
          setConfirmandoLote(false);
        }}
        onCancel={() => setConfirmandoLote(false)}
      />
    </View>
  );
}

// ============================================================================
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="outline" padding={4} style={{ minWidth: 150, flexGrow: 1 }}>
      <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "600" }}>{label}</Text>
      <Text style={{ ...type.h2, color: color.bg.brand, marginTop: space[1] }}>{value}</Text>
    </Card>
  );
}

function HeaderCell({ style, label }: { style: { width: number }; label: string }) {
  return (
    <View style={{ ...style, paddingHorizontal: space[3], paddingVertical: space[3] }}>
      <Text style={{ ...type.overline, color: color.text.muted }}>{label}</Text>
    </View>
  );
}

function Cell({ style, children }: { style: { width: number }; children: React.ReactNode }) {
  return (
    <View style={{ ...style, paddingHorizontal: space[3], paddingVertical: space[3], justifyContent: "center" }}>
      {children}
    </View>
  );
}

function RespostaCell({ texto, width = 190 }: { texto: string | null; width?: number }) {
  return (
    <Cell style={{ width }}>
      <Text style={{ ...type.caption, color: color.text.secondary }} numberOfLines={3}>
        {texto || "—"}
      </Text>
    </Cell>
  );
}

function CheckCell({
  checked,
  onPress,
  header = false,
}: {
  checked: boolean;
  onPress: () => void;
  header?: boolean;
}) {
  return (
    <View style={{ width: 44, paddingVertical: space[3], alignItems: "center", justifyContent: "center" }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={header ? "Selecionar todos desta página" : "Selecionar cadastro"}
        hitSlop={8}
        style={{
          width: 20,
          height: 20,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: checked ? color.bg.brand : color.border.default,
          backgroundColor: checked ? color.bg.brand : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Text style={{ color: color.text.onBrand, fontSize: 12, fontWeight: "700" }}>✓</Text> : null}
      </Pressable>
    </View>
  );
}

// ============================================================================
// Modal de edição — contato + as 5 respostas (texto livre, como estão no banco).
// ============================================================================
const PERGUNTAS_EDIT: { campo: keyof AdminLeadMagnetPatch; label: string }[] = [
  { campo: "q_momento", label: "Momento hoje" },
  { campo: "q_vontade", label: "Vontade de empreender" },
  { campo: "q_tem_ideia", label: "Já tem uma ideia" },
  { campo: "q_capital_giro", label: "Capital de giro" },
  { campo: "q_prazo", label: "Prazo" },
];

function EditarLeadModal({
  lead,
  loading,
  onCancel,
  onSalvar,
}: {
  lead: AdminLeadMagnetRow;
  loading: boolean;
  onCancel: () => void;
  onSalvar: (patch: AdminLeadMagnetPatch) => void;
}) {
  const [nome, setNome] = useState(lead.nome ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [telefone, setTelefone] = useState(lead.telefone ?? "");
  const [respostas, setRespostas] = useState<Record<string, string>>({
    q_momento: lead.q_momento ?? "",
    q_vontade: lead.q_vontade ?? "",
    q_tem_ideia: lead.q_tem_ideia ?? "",
    q_capital_giro: lead.q_capital_giro ?? "",
    q_prazo: lead.q_prazo ?? "",
  });
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  function salvar() {
    if (!nome.trim()) return setErroLocal("O nome não pode ficar em branco.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErroLocal("E-mail inválido.");
    onSalvar({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      telefone: telefone.trim() || null,
      q_momento: respostas.q_momento.trim(),
      q_vontade: respostas.q_vontade.trim(),
      q_tem_ideia: respostas.q_tem_ideia.trim(),
      q_capital_giro: respostas.q_capital_giro.trim(),
      q_prazo: respostas.q_prazo.trim(),
    });
  }

  return (
    <Pressable
      onPress={onCancel}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(17, 24, 39, 0.5)",
        alignItems: "center",
        justifyContent: "center",
        padding: space[5],
      }}
    >
      <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "90%" }}>
        <Card variant="default" padding={5}>
          <ScrollView>
            <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Editar cadastro</Text>
            <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[4] }}>
              Cadastrado em {formatDataHora(lead.created_at)}
            </Text>

            <Input label="Nome" value={nome} onChangeText={setNome} />
            <Input label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Input label="Telefone" value={telefone} onChangeText={setTelefone} placeholder="(opcional)" />

            {PERGUNTAS_EDIT.map((p) => (
              <View key={p.campo} style={{ marginBottom: space[3] }}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{p.label}</Text>
                <TextInput
                  value={respostas[p.campo as string]}
                  onChangeText={(v) => setRespostas((r) => ({ ...r, [p.campo]: v }))}
                  multiline
                  placeholderTextColor={color.text.muted}
                  style={{
                    minHeight: 44,
                    borderWidth: 1,
                    borderColor: color.border.default,
                    borderRadius: radius.md,
                    paddingHorizontal: space[4],
                    paddingVertical: space[2],
                    fontSize: 14,
                    lineHeight: 20,
                    color: color.text.primary,
                  }}
                />
              </View>
            ))}

            {erroLocal ? (
              <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[2] }}>{erroLocal}</Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: space[2], justifyContent: "flex-end", marginTop: space[2] }}>
              <Button label="Cancelar" variant="ghost" onPress={onCancel} />
              <Button label="Salvar" variant="primary" loading={loading} onPress={salvar} />
            </View>
          </ScrollView>
        </Card>
      </Pressable>
    </Pressable>
  );
}
