import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, Logo, color, space, type } from "@serdono/ui";
import { labelPlano, type Plano } from "@serdono/core";
import type { AdminAssinaturaRow, AdminPlanoUsuario } from "@serdono/supabase";
import { useAdminAssinaturas } from "./useAdminAssinaturas";

function formatMoney(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;
}

function formatData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Aguardando pagamento",
  ativa: "Ativa",
  cancelada: "Cancelada",
  inadimplente: "Inadimplente",
};

const STATUS_TONE: Record<string, "info" | "danger" | "warning" | "success"> = {
  pendente: "info",
  ativa: "success",
  cancelada: "warning",
  inadimplente: "danger",
};

/**
 * Painel Admin de Assinaturas (pedido do dono do produto, 17/08/2026) — MRR
 * real vs. potencial, planos mais assinados, inadimplência (via sincronização
 * sob demanda com a AbacatePay — a doc dela não expõe evento de webhook pra
 * cobrança que falhou, ver `admin-assinaturas-sincronizar`), e a ação
 * "Definir plano" que cobre tanto conceder um plano de cortesia ("brinde")
 * quanto corrigir manualmente — as duas coisas nascem `origem: concedido_admin`
 * (nunca contam como receita real, só potencial).
 */
export function AdminAssinaturasScreen() {
  const router = useRouter();
  const {
    resumo,
    porPlano,
    usuarios,
    historico,
    query,
    setQuery,
    filtroStatus,
    setFiltroStatus,
    loading,
    actingOn,
    sincronizando,
    error,
    feedback,
    definirPlano,
    sincronizar,
  } = useAdminAssinaturas();
  const [editando, setEditando] = useState<AdminPlanoUsuario | null>(null);

  const porPlanoMap = new Map(porPlano.map((p) => [p.plano, p]));

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

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[6] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Assinaturas</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Controle de planos, receita estimada e inadimplência.
          </Text>
        </View>

        {error ? <Text style={{ ...type.caption, color: color.state.danger }}>{error}</Text> : null}
        {feedback ? <Text style={{ ...type.caption, color: color.state.success }}>{feedback}</Text> : null}

        {/* ---- KPIs ---- */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
          <KpiCard label="MRR real (pago)" value={resumo ? formatMoney(resumo.mrr_real_centavos) : "—"} />
          <KpiCard label="MRR potencial (com cortesias)" value={resumo ? formatMoney(resumo.mrr_potencial_centavos) : "—"} />
          <KpiCard label="Assinantes pagos" value={resumo ? String(resumo.ativos_pagos) : "—"} />
          <KpiCard label="Cortesias ativas" value={resumo ? String(resumo.ativos_cortesia) : "—"} />
          <KpiCard label="Inadimplentes" value={resumo ? String(resumo.inadimplentes) : "—"} tone={resumo && resumo.inadimplentes > 0 ? "danger" : undefined} />
          <KpiCard label="No plano Gratuito" value={resumo ? String(resumo.gratuitos) : "—"} />
        </View>

        {/* ---- Planos mais assinados ---- */}
        <Card variant="default" padding={5}>
          <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Planos mais assinados</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
            {(["essencial", "master"] as const).map((plano) => {
              const dados = porPlanoMap.get(plano);
              return (
                <Card key={plano} variant="outline" padding={4} style={{ minWidth: 220, flexGrow: 1 }}>
                  <Text style={{ ...type.overline, color: color.text.muted }}>{labelPlano(plano).toUpperCase()}</Text>
                  <Text style={{ ...type.h2, color: color.bg.brand, marginTop: space[1] }}>{dados?.ativos ?? 0} pagos</Text>
                  <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>
                    {dados?.ativos_cortesia ?? 0} de cortesia · {formatMoney(dados?.receita_real_centavos ?? 0)}/mês real
                  </Text>
                </Card>
              );
            })}
          </View>
        </Card>

        {/* ---- Sincronizar ---- */}
        <Card variant="outline" padding={5}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Sincronizar com a AbacatePay</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
            A AbacatePay não avisa por webhook quando uma cobrança recorrente falha — só rodando esta verificação a
            gente descobre quem parou de pagar e marca como inadimplente.
          </Text>
          <Button label="Sincronizar agora" variant="secondary" loading={sincronizando} onPress={sincronizar} />
        </Card>

        {/* ---- Usuários e planos ---- */}
        <View>
          <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Usuários e planos</Text>
          <View style={{ marginBottom: space[4], maxWidth: 360 }}>
            <Input label="Buscar" value={query} onChangeText={setQuery} placeholder="Nome ou e-mail" autoCapitalize="none" />
          </View>

          {loading ? (
            <ActivityIndicator color={color.bg.brand} />
          ) : usuarios.length === 0 ? (
            <Text style={{ ...type.body, color: color.text.muted }}>Nenhum usuário encontrado.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
              <View style={{ width: "100%", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: color.border.default }}>
                <View style={{ flexDirection: "row", backgroundColor: color.bg.surfaceAlt, borderBottomWidth: 1, borderBottomColor: color.border.default }}>
                  <HeaderCell style={{ flex: 1.2, minWidth: 160 }} label="Nome" />
                  <HeaderCell style={{ flex: 1.4, minWidth: 190 }} label="E-mail" />
                  <HeaderCell style={{ flex: 1, minWidth: 160 }} label="Plano" />
                  <HeaderCell style={{ width: 160 }} label="Ações" />
                </View>
                {usuarios.map((u, i) => (
                  <View
                    key={u.user_id}
                    style={{
                      flexDirection: "row",
                      backgroundColor: i % 2 === 1 ? color.bg.surfaceAlt : color.bg.surface,
                      borderBottomWidth: 1,
                      borderBottomColor: color.border.default,
                    }}
                  >
                    <Cell style={{ flex: 1.2, minWidth: 160 }}>
                      <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
                        {u.nome || "(sem nome)"}
                      </Text>
                    </Cell>
                    <Cell style={{ flex: 1.4, minWidth: 190 }}>
                      <Text style={{ ...type.body, color: color.text.secondary }} numberOfLines={1}>
                        {u.email}
                      </Text>
                    </Cell>
                    <Cell style={{ flex: 1, minWidth: 160 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        <Badge label={labelPlano(u.plano_atual as Plano)} tone={u.plano_atual === "gratuito" ? "info" : "success"} />
                        {u.origem === "concedido_admin" ? <Badge label="Cortesia" tone="warning" /> : null}
                      </View>
                    </Cell>
                    <Cell style={{ width: 160 }}>
                      <Button
                        label="Definir plano"
                        variant="soft"
                        size="sm"
                        loading={actingOn === u.user_id}
                        onPress={() => setEditando(u)}
                      />
                    </Cell>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* ---- Histórico de assinaturas ---- */}
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space[3] }}>
            <Text style={{ ...type.h3, color: color.text.primary }}>Histórico de assinaturas</Text>
            <View style={{ flexDirection: "row", gap: space[2] }}>
              <FiltroChip label="Todas" active={filtroStatus === null} onPress={() => setFiltroStatus(null)} />
              <FiltroChip label="Ativas" active={filtroStatus === "ativa"} onPress={() => setFiltroStatus("ativa")} />
              <FiltroChip label="Inadimplentes" active={filtroStatus === "inadimplente"} onPress={() => setFiltroStatus("inadimplente")} />
              <FiltroChip label="Canceladas" active={filtroStatus === "cancelada"} onPress={() => setFiltroStatus("cancelada")} />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={color.bg.brand} />
          ) : historico.length === 0 ? (
            <Card variant="outline" padding={5}>
              <Text style={{ ...type.body, color: color.text.secondary }}>Nenhuma assinatura encontrada.</Text>
            </Card>
          ) : (
            <View style={{ gap: space[2] }}>
              {historico.map((a) => (
                <HistoricoRow key={a.id} assinatura={a} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {editando ? (
        <DefinirPlanoModal
          usuario={editando}
          loading={actingOn === editando.user_id}
          onCancel={() => setEditando(null)}
          onSalvar={async (plano, nota) => {
            await definirPlano(editando.user_id, plano, nota);
            setEditando(null);
          }}
        />
      ) : null}
    </View>
  );
}

// ============================================================================
function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <Card variant="outline" padding={4} style={{ minWidth: 180, flexGrow: 1 }}>
      <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "600" }}>{label}</Text>
      <Text style={{ ...type.h2, color: tone === "danger" ? color.state.danger : color.bg.brand, marginTop: space[1] }}>{value}</Text>
    </Card>
  );
}

function HeaderCell({ style, label }: { style: { flex?: number; minWidth?: number; width?: number }; label: string }) {
  return (
    <View style={{ ...style, paddingHorizontal: space[3], paddingVertical: space[3] }}>
      <Text style={{ ...type.overline, color: color.text.muted }}>{label}</Text>
    </View>
  );
}

function Cell({ style, children }: { style: { flex?: number; minWidth?: number; width?: number }; children: React.ReactNode }) {
  return <View style={{ ...style, paddingHorizontal: space[3], paddingVertical: space[3], justifyContent: "center" }}>{children}</View>;
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

function FiltroChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        paddingHorizontal: space[3],
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: active ? color.bg.brand : color.bg.surfaceAlt,
      }}
    >
      <Text style={{ ...type.caption, color: active ? color.text.onBrand : color.text.secondary, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function HistoricoRow({ assinatura: a }: { assinatura: AdminAssinaturaRow }) {
  return (
    <Card variant="outline" padding={4}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: space[2] }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
            {a.nome}
          </Text>
          <Text style={{ ...type.caption, color: color.text.muted }} numberOfLines={1}>
            {a.email}
          </Text>
          {a.nota ? (
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2, fontStyle: "italic" }} numberOfLines={2}>
              "{a.nota}"
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
          <Badge label={labelPlano(a.plano as Plano)} tone="info" />
          <Badge label={STATUS_LABEL[a.status] ?? a.status} tone={STATUS_TONE[a.status] ?? "info"} />
          {a.origem === "concedido_admin" ? <Badge label="Cortesia" tone="warning" /> : null}
        </View>
        <View style={{ alignItems: "flex-end", minWidth: 110 }}>
          <Text style={{ ...type.bodyStrong, color: color.text.secondary }}>{formatMoney(a.preco_centavos)}/mês</Text>
          <Text style={{ ...type.caption, color: color.text.muted }}>desde {formatData(a.created_at)}</Text>
        </View>
      </View>
    </Card>
  );
}

// ============================================================================
// Modal "Definir plano" — cobre cortesia ("brinde") e correção manual, as
// duas viram a mesma ação (Edge Function `admin-plano-definir`).
// ============================================================================
const PLANOS: Plano[] = ["gratuito", "essencial", "master"];

function DefinirPlanoModal({
  usuario,
  loading,
  onCancel,
  onSalvar,
}: {
  usuario: AdminPlanoUsuario;
  loading: boolean;
  onCancel: () => void;
  onSalvar: (plano: Plano, nota?: string) => void;
}) {
  const [plano, setPlano] = useState<Plano>((usuario.plano_atual as Plano) ?? "gratuito");
  const [nota, setNota] = useState("");

  return (
    <Pressable
      onPress={onCancel}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(17, 24, 39, 0.5)", alignItems: "center", justifyContent: "center", padding: space[5] }}
    >
      <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420 }}>
        <Card variant="default" padding={5}>
          <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Definir plano</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
            {usuario.nome} · {usuario.email}
          </Text>

          <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Plano</Text>
          <View style={{ flexDirection: "row", gap: space[2], marginBottom: space[4] }}>
            {PLANOS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setPlano(p)}
                accessibilityRole="radio"
                accessibilityState={{ selected: plano === p }}
                style={{
                  flex: 1,
                  paddingVertical: space[3],
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: plano === p ? color.border.focus : color.border.default,
                  backgroundColor: plano === p ? color.bg.brand : "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{ ...type.bodyStrong, color: plano === p ? color.text.onBrand : color.text.primary }}>{labelPlano(p)}</Text>
              </Pressable>
            ))}
          </View>

          {plano !== "gratuito" ? (
            <>
              <Input label="Nota (opcional)" value={nota} onChangeText={setNota} placeholder="Ex.: brinde de lançamento, pagou por fora..." />
              <Text style={{ ...type.caption, color: color.text.muted, marginTop: -space[2], marginBottom: space[3] }}>
                Concedido por aqui não passa pelo checkout — nunca conta como receita real, só potencial.
              </Text>
            </>
          ) : null}

          <View style={{ flexDirection: "row", gap: space[3], justifyContent: "flex-end" }}>
            <Button label="Cancelar" variant="ghost" onPress={onCancel} />
            <Button label="Salvar" variant="primary" loading={loading} onPress={() => onSalvar(plano, nota || undefined)} />
          </View>
        </Card>
      </Pressable>
    </Pressable>
  );
}
