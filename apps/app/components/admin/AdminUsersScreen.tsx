import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, Logo, color, space, type } from "@serdono/ui";
import { useAdminUsers } from "./useAdminUsers";

export function AdminUsersScreen() {
  const router = useRouter();
  const { users, query, setQuery, loading, actingOn, error, feedback, invite, toggleBlocked, toggleAdmin, resendPassword, remove } =
    useAdminUsers();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteAsAdmin, setInviteAsAdmin] = useState(false);
  // Confirmação em duas etapas antes de excluir (irreversível) — nenhum
  // clique isolado apaga um usuário de verdade.
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<string | null>(null);

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

        <Input label="Buscar" value={query} onChangeText={setQuery} placeholder="Nome ou e-mail" autoCapitalize="none" />

        {!showInvite ? (
          <Button label="Adicionar usuário" variant="primary" onPress={() => setShowInvite(true)} style={{ marginBottom: space[5] }} />
        ) : (
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
        )}

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}
        {feedback ? <Text style={{ ...type.caption, color: color.state.success, marginBottom: space[3] }}>{feedback}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : (
          <View style={{ gap: space[3] }}>
            {users.map((user) => (
              <Card key={user.id} variant="default" padding={4}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space[2] }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{user.nome || "(sem nome)"}</Text>
                    <Text style={{ ...type.caption, color: color.text.muted }}>{user.email}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: space[1] }}>
                    {user.role === "admin" ? <Badge label="Admin" tone="info" /> : null}
                    {user.bloqueado ? <Badge label="Bloqueado" tone="danger" /> : null}
                  </View>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
                  <Button
                    label={user.bloqueado ? "Desbloquear" : "Bloquear"}
                    variant={user.bloqueado ? "outline" : "danger"}
                    size="sm"
                    loading={actingOn === user.id}
                    onPress={() => toggleBlocked(user)}
                  />
                  <Button label="Reenviar senha" variant="outline" size="sm" loading={actingOn === user.id} onPress={() => resendPassword(user)} />
                  <Button
                    label={user.role === "admin" ? "Remover admin" : "Tornar admin"}
                    variant="outline"
                    size="sm"
                    loading={actingOn === user.id}
                    onPress={() => toggleAdmin(user)}
                  />
                  <Button label="Módulos" variant="ghost" size="sm" onPress={() => router.push(`/admin/usuarios/${user.id}`)} />
                  {confirmandoExclusaoId !== user.id ? (
                    <Button label="Excluir" variant="danger" size="sm" onPress={() => setConfirmandoExclusaoId(user.id)} />
                  ) : null}
                </View>

                {confirmandoExclusaoId === user.id ? (
                  <View
                    style={{
                      marginTop: space[3],
                      backgroundColor: color.state.dangerBg,
                      borderRadius: 8,
                      padding: space[3],
                      gap: space[2],
                    }}
                  >
                    <Text style={{ ...type.caption, color: color.text.primary }}>
                      Excluir {user.nome || user.email || "este usuário"} apaga a conta e todo o dado dele (diagnóstico,
                      jornada, módulos liberados) para sempre. Não dá pra desfazer.
                    </Text>
                    <View style={{ flexDirection: "row", gap: space[2] }}>
                      <Button
                        label="Sim, excluir definitivamente"
                        variant="danger"
                        size="sm"
                        loading={actingOn === user.id}
                        onPress={async () => {
                          await remove(user);
                          setConfirmandoExclusaoId(null);
                        }}
                      />
                      <Button label="Cancelar" variant="ghost" size="sm" onPress={() => setConfirmandoExclusaoId(null)} />
                    </View>
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: "info" | "danger" }) {
  const bg = tone === "info" ? color.state.infoBg : color.state.dangerBg;
  const fg = tone === "info" ? color.state.info : color.state.danger;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: space[2], paddingVertical: 2 }}>
      <Text style={{ ...type.caption, color: fg, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
