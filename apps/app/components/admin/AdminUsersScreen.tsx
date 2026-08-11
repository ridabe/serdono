import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, ConfirmModal, Input, Logo, color, space, type } from "@serdono/ui";
import type { AdminUser } from "@serdono/supabase";
import { useAdminUsers } from "./useAdminUsers";

// Ações fica largura fixa (a única que precisa caber os 5 botões numa linha
// só); as outras 4 colunas dividem em flex o espaço que sobrar da página —
// é isso que faz a tabela ocupar a largura toda em vez de ficar encolhida
// bem menor que a página com espaço morto do lado direito.
const COL = {
  nome: { flex: 1.1, minWidth: 140 },
  email: { flex: 1.3, minWidth: 170 },
  status: { flex: 1, minWidth: 160 },
  acesso: { flex: 0.8, minWidth: 120 },
  acoes: { width: 640 },
};

// Largura fixa por botão de ação — sem isso "Bloquear" (mais curto) e
// "Desbloquear" (mais longo), ou "Tornar admin"/"Remover admin", empurram o
// resto da linha em quantidades diferentes, e o mesmo botão em linhas
// diferentes não fica alinhado verticalmente com o de cima/baixo.
const ACAO_W = { toggleBloqueio: 120, reenviarSenha: 140, toggleAdmin: 140, modulos: 90, excluir: 90 };

function formatarUltimoAcesso(iso: string | null): string {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminUsersScreen() {
  const router = useRouter();
  const {
    users,
    incompletos,
    query,
    setQuery,
    loading,
    actingOn,
    error,
    feedback,
    invite,
    toggleBlocked,
    toggleAdmin,
    resendPassword,
    remove,
    removeIncompletos,
  } = useAdminUsers();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteAsAdmin, setInviteAsAdmin] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<AdminUser | null>(null);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    await invite({ email: inviteEmail.trim(), nome: inviteNome.trim() || undefined, role: inviteAsAdmin ? "admin" : "user" });
    setInviteEmail("");
    setInviteNome("");
    setInviteAsAdmin(false);
    setShowInvite(false);
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
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Usuários</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Adicionar, bloquear, reenviar senha, promover administradores e excluir contas.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], alignItems: "flex-start", marginBottom: space[4] }}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Input label="Buscar" value={query} onChangeText={setQuery} placeholder="Nome, e-mail ou telefone" autoCapitalize="none" />
          </View>
          {/* marginTop compensa o rótulo do Input (bodyStrong + espaço abaixo) — sem isso os
              botões, que não têm rótulo em cima, ficam mais altos que o campo de busca. */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: type.bodyStrong.lineHeight + space[1] }}>
            <Button label={showInvite ? "Cancelar" : "Adicionar usuário"} variant={showInvite ? "ghost" : "primary"} onPress={() => setShowInvite((v) => !v)} />
            <Button
              label={`Limpar cadastros incompletos (${incompletos.length})`}
              variant="outline"
              disabled={incompletos.length === 0}
              onPress={() => setConfirmandoLimpeza(true)}
            />
          </View>
        </View>

        {showInvite ? (
          <Card variant="outline" padding={5} style={{ marginBottom: space[5] }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Novo usuário</Text>
            <Input label="Nome" value={inviteNome} onChangeText={setInviteNome} placeholder="Nome (opcional)" />
            <Input label="E-mail" value={inviteEmail} onChangeText={setInviteEmail} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" />
            <Pressable
              onPress={() => setInviteAsAdmin((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: inviteAsAdmin }}
              style={{ flexDirection: "row", alignItems: "center", gap: space[2], marginBottom: space[4], minHeight: 44 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: color.border.focus,
                  backgroundColor: inviteAsAdmin ? color.action.secondary : "transparent",
                }}
              />
              <Text style={{ ...type.body, color: color.text.primary }}>Adicionar como administrador</Text>
            </Pressable>
            <View style={{ flexDirection: "row", gap: space[3] }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setShowInvite(false)} />
              <Button label="Enviar convite" variant="primary" loading={actingOn === "new"} onPress={handleInvite} />
            </View>
          </Card>
        ) : null}

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}
        {feedback ? <Text style={{ ...type.caption, color: color.state.success, marginBottom: space[3] }}>{feedback}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : users.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum usuário encontrado.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
            <View style={{ width: "100%", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: color.border.default }}>
              <TableHeaderRow />
              {users.map((user, i) => (
                <UserRow
                  key={user.id}
                  user={user}
                  index={i}
                  acting={actingOn === user.id}
                  onToggleBlocked={() => toggleBlocked(user)}
                  onResendPassword={() => resendPassword(user)}
                  onToggleAdmin={() => toggleAdmin(user)}
                  onModulos={() => router.push(`/admin/usuarios/${user.id}`)}
                  onExcluir={() => setConfirmandoExclusao(user)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmandoExclusao !== null}
        title="Excluir usuário"
        message={
          confirmandoExclusao
            ? `Excluir ${confirmandoExclusao.nome || confirmandoExclusao.email || "este usuário"} apaga a conta e todo o dado dele (diagnóstico, jornada, módulos liberados) para sempre. Não dá pra desfazer.`
            : ""
        }
        confirmLabel="Sim, excluir definitivamente"
        loading={confirmandoExclusao !== null && actingOn === confirmandoExclusao.id}
        onCancel={() => setConfirmandoExclusao(null)}
        onConfirm={async () => {
          if (!confirmandoExclusao) return;
          await remove(confirmandoExclusao);
          setConfirmandoExclusao(null);
        }}
      />

      <ConfirmModal
        visible={confirmandoLimpeza}
        title="Limpar cadastros incompletos"
        message={
          incompletos.length === 1
            ? "1 conta abriu sessão mas nunca terminou o cadastro (sem e-mail) — só ficou diagnóstico/jornada de teste. Excluir de vez, sem volta."
            : `${incompletos.length} contas abriram sessão mas nunca terminaram o cadastro (sem e-mail) — só ficou diagnóstico/jornada de teste. Excluir todas de uma vez, sem volta.`
        }
        confirmLabel={`Sim, excluir ${incompletos.length}`}
        loading={actingOn === "bulk_incompletos"}
        onCancel={() => setConfirmandoLimpeza(false)}
        onConfirm={async () => {
          await removeIncompletos();
          setConfirmandoLimpeza(false);
        }}
      />
    </View>
  );
}

function TableHeaderRow() {
  return (
    <View style={{ flexDirection: "row", backgroundColor: color.bg.surfaceAlt, borderBottomWidth: 1, borderBottomColor: color.border.default }}>
      <HeaderCell colStyle={COL.nome} label="Nome" />
      <HeaderCell colStyle={COL.email} label="E-mail" />
      <HeaderCell colStyle={COL.status} label="Status" />
      <HeaderCell colStyle={COL.acesso} label="Último acesso" />
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

function UserRow({
  user,
  index,
  acting,
  onToggleBlocked,
  onResendPassword,
  onToggleAdmin,
  onModulos,
  onExcluir,
}: {
  user: AdminUser;
  index: number;
  acting: boolean;
  onToggleBlocked: () => void;
  onResendPassword: () => void;
  onToggleAdmin: () => void;
  onModulos: () => void;
  onExcluir: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: index % 2 === 1 ? color.bg.surfaceAlt : color.bg.surface,
        borderBottomWidth: 1,
        borderBottomColor: color.border.default,
      }}
    >
      <View style={{ ...COL.nome, paddingHorizontal: space[3], paddingVertical: space[3], justifyContent: "center" }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
          {user.nome || "(sem nome)"}
        </Text>
      </View>
      <View style={{ ...COL.email, paddingHorizontal: space[3], paddingVertical: space[3], justifyContent: "center" }}>
        <Text style={{ ...type.body, color: user.email ? color.text.secondary : color.text.muted }} numberOfLines={1}>
          {user.email || "— (sessão anônima)"}
        </Text>
      </View>
      <View style={{ ...COL.status, paddingHorizontal: space[3], paddingVertical: space[3], justifyContent: "center", gap: 4 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          {user.role === "admin" ? <Badge label="Admin" tone="info" /> : null}
          {user.bloqueado ? <Badge label="Bloqueado" tone="danger" /> : null}
          {user.is_anonymous ? <Badge label="Cadastro incompleto" tone="warning" /> : null}
          {!user.bloqueado && !user.is_anonymous && user.role !== "admin" ? <Badge label="Ativo" tone="success" /> : null}
        </View>
      </View>
      <View style={{ ...COL.acesso, paddingHorizontal: space[3], paddingVertical: space[3], justifyContent: "center" }}>
        <Text style={{ ...type.caption, color: color.text.muted }}>{formatarUltimoAcesso(user.last_sign_in_at)}</Text>
      </View>
      <View style={{ ...COL.acoes, paddingHorizontal: space[3], paddingVertical: space[2], justifyContent: "center" }}>
        <View style={{ flexDirection: "row", flexWrap: "nowrap", alignItems: "center", gap: space[2] }}>
          <Button
            label={user.bloqueado ? "Desbloquear" : "Bloquear"}
            variant={user.bloqueado ? "soft" : "danger"}
            size="sm"
            loading={acting}
            onPress={onToggleBlocked}
            style={{ width: ACAO_W.toggleBloqueio }}
          />
          <Button
            label="Reenviar senha"
            variant="soft"
            size="sm"
            loading={acting}
            onPress={onResendPassword}
            disabled={!user.email}
            style={{ width: ACAO_W.reenviarSenha }}
          />
          <Button
            label={user.role === "admin" ? "Remover admin" : "Tornar admin"}
            variant="soft"
            size="sm"
            loading={acting}
            onPress={onToggleAdmin}
            style={{ width: ACAO_W.toggleAdmin }}
          />
          <Button label="Módulos" variant="soft" size="sm" onPress={onModulos} style={{ width: ACAO_W.modulos }} />
          <Button label="Excluir" variant="danger" size="sm" onPress={onExcluir} style={{ width: ACAO_W.excluir }} />
        </View>
      </View>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: "info" | "danger" | "warning" | "success" }) {
  const tones = {
    info: { bg: color.state.infoBg, fg: color.state.info },
    danger: { bg: color.state.dangerBg, fg: color.state.danger },
    warning: { bg: color.state.warningBg, fg: color.state.warning },
    success: { bg: color.state.successBg, fg: color.state.success },
  }[tone];
  return (
    <View style={{ backgroundColor: tones.bg, borderRadius: 999, paddingHorizontal: space[2], paddingVertical: 2 }}>
      <Text style={{ ...type.caption, color: tones.fg, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

