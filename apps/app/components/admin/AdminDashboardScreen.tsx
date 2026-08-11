import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { Card, Logo, chart, color, space, type } from "@serdono/ui";
import {
  FASE_LABEL,
  FASE_ORDER,
  signOut,
  type AdocaoModulo,
  type CrescimentoDia,
  type DicaRanking,
  type FunilFase,
  type IaUsageDia,
  type IaUsagePorFuncao,
} from "@serdono/supabase";
import { useAdminDashboard, type Alerta, type AlertaSeveridade } from "./useAdminDashboard";

/**
 * Dashboard Admin — "Torre de Controle" (tema claro, DS já existente do
 * produto — nunca dark mode, fora do escopo do MVP por §2.4 do Design
 * System). Substitui os 5 cards simples de antes por observação real do
 * sistema: crescimento de usuários, funil da Jornada por fase, alertas
 * derivados de dado real (nunca inventados), rankings (módulos, fornecedores,
 * dicas) e uso de IA (tokens por chamada — mesma funcionalidade já existente
 * no admin do StrivePersonal, pedido explícito do dono do produto).
 *
 * Cada card consome uma RPC nova em `packages/supabase/adminDashboard.ts` —
 * ver a migration irmã pra saber exatamente o que é dado real vs. o que
 * ainda depende de mais uso do produto pra ter volume (ex.: funil da Jornada
 * com poucas jornadas ainda vai parecer "vazio", não é bug).
 */
function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function AdminDashboardScreen() {
  const router = useRouter();
  const { stats, crescimento, modulos, fornecedores, funil, dicas, iaTotais, iaPorDia, iaPorFuncao, alertas, loading, error } =
    useAdminDashboard();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <Pressable onPress={() => router.push("/perfil")} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Meu perfil</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/sobre")} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Sobre</Text>
          </Pressable>
          <Pressable onPress={handleSignOut} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Sair</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[6] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Painel administrativo</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>Observação, métricas e controle de todo o sistema.</Text>
        </View>

        {error ? (
          <Text style={{ ...type.caption, color: color.state.danger }}>Não consegui carregar as métricas: {error}</Text>
        ) : null}

        {/* ---- KPIs principais ---- */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
          <KpiCard label="Usuários totais" value={stats?.total_usuarios} />
          <KpiCard label="Novos usuários (7 dias)" value={stats?.novos_usuarios_7d} />
          <KpiCard label="Diagnósticos concluídos" value={stats?.diagnosticos_concluidos} />
          <KpiCard label="Nichos destravados" value={stats?.nichos_destravados} />
          <KpiCard label="Usuários bloqueados" value={stats?.usuarios_bloqueados} tone={stats && stats.usuarios_bloqueados > 0 ? "danger" : undefined} />
        </View>

        {/* ---- Crescimento + Alertas ---- */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
          <Card variant="default" padding={5} style={{ flexGrow: 2, minWidth: 320 }}>
            <Text style={{ ...type.h3, color: color.text.primary }}>Crescimento de usuários</Text>
            <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>Cadastros novos por dia, últimos 30 dias</Text>
            <GrowthChart pontos={crescimento} />
          </Card>

          <Card variant="default" padding={5} style={{ flexGrow: 1, minWidth: 260 }}>
            <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Alertas</Text>
            <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[2] }}>Sinais que pedem atenção</Text>
            {loading ? null : alertas.length === 0 ? (
              <Text style={{ ...type.body, color: color.text.muted }}>Nenhum alerta no momento.</Text>
            ) : (
              alertas.map((a, i) => <AlertRow key={i} alerta={a} />)
            )}
          </Card>
        </View>

        {/* ---- Funil da Jornada ---- */}
        <Card variant="default" padding={5}>
          <Text style={{ ...type.h3, color: color.text.primary }}>Funil da Jornada Empreendedora</Text>
          <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
            % de jornadas que já concluíram ao menos 1 etapa em cada fase
          </Text>
          <FunilJornada funil={funil} />
        </Card>

        {/* ---- Rankings ---- */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
          <Card variant="default" padding={5} style={{ flexGrow: 1, minWidth: 260 }}>
            <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Adoção por módulo</Text>
            <RankingModulos modulos={modulos} totalUsuarios={stats?.total_usuarios ?? 0} />
          </Card>

          <Card variant="default" padding={5} style={{ flexGrow: 1, minWidth: 260 }}>
            <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Fornecedores por categoria</Text>
            <RankingBarras dados={fornecedores.map((f) => ({ label: f.categoria, valor: f.total }))} />
          </Card>

          <Card variant="default" padding={5} style={{ flexGrow: 1, minWidth: 260 }}>
            <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Dicas mais acessadas</Text>
            <RankingDicas dicas={dicas} />
          </Card>
        </View>

        {/* ---- Tokens de IA ---- */}
        <Card variant="default" padding={5}>
          <Text style={{ ...type.h3, color: color.text.primary }}>Tokens de IA</Text>
          <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[4] }}>
            Consumo de LLM em todas as gerações do produto (Anthropic + OpenAI)
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginBottom: space[4] }}>
            <MiniStat label="Chamadas totais" value={iaTotais ? formatNumber(iaTotais.total_chamadas) : "—"} />
            <MiniStat label="Tokens totais" value={iaTotais ? formatNumber(iaTotais.total_tokens) : "—"} />
            <MiniStat label="Chamadas (7 dias)" value={iaTotais ? formatNumber(iaTotais.chamadas_7d) : "—"} />
            <MiniStat label="Tokens (7 dias)" value={iaTotais ? formatNumber(iaTotais.tokens_7d) : "—"} />
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[5] }}>
            <View style={{ flexGrow: 1, minWidth: 260 }}>
              <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "600", marginBottom: space[2] }}>
                Chamadas por dia (14 dias)
              </Text>
              <IaUsageBarChart pontos={iaPorDia} />
            </View>
            <View style={{ flexGrow: 1, minWidth: 220 }}>
              <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "600", marginBottom: space[2] }}>Por função</Text>
              <RankingFuncoesIa dados={iaPorFuncao} />
            </View>
          </View>
        </Card>

        {/* ---- Atalhos rápidos ---- */}
        <View>
          <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Atalhos rápidos</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
            <NavCard
              title="Usuários"
              description="Adicionar, bloquear, reenviar senha e promover administradores."
              onPress={() => router.push("/admin/usuarios")}
            />
            <NavCard
              title="Módulos"
              description="Catálogo de módulos do sistema e liberação por usuário."
              onPress={() => router.push("/admin/modulos")}
            />
            <NavCard
              title="Fornecedores"
              description="Base de parceiros sugerida ao empreendedor na Fase 8 da Jornada, filtrada por nicho."
              onPress={() => router.push("/admin/fornecedores")}
            />
            <NavCard
              title="Dicas da Mary"
              description="Categorias de estudo com PDF, vídeo e links — liberado a todo usuário, sem gate de módulo."
              onPress={() => router.push("/admin/dicas")}
            />
            <NavCard
              title="Versão do App"
              description="Versão publicada, versão mínima suportada, atualização obrigatória e link da Play Store."
              onPress={() => router.push("/admin/versao")}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// KPI
// ============================================================================
function KpiCard({ label, value, tone }: { label: string; value?: number; tone?: "danger" }) {
  return (
    <Card variant="outline" padding={4} style={{ minWidth: 160, flexGrow: 1 }}>
      <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "600" }}>{label}</Text>
      <Text style={{ ...type.h1, color: tone === "danger" && value ? color.state.danger : color.bg.brand, marginTop: space[1] }}>
        {value != null ? formatNumber(value) : "—"}
      </Text>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ minWidth: 140, flexGrow: 1 }}>
      <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "600" }}>{label}</Text>
      <Text style={{ ...type.h2, color: color.text.primary }}>{value}</Text>
    </View>
  );
}

// ============================================================================
// Gráfico de crescimento — linha + área, mesmo token de série única do DS
// (`chart.series`/`chart.seriesFill`, §12 do Design System).
// ============================================================================
function GrowthChart({ pontos }: { pontos: CrescimentoDia[] }) {
  const LARGURA = 640;
  const ALTURA = 160;
  const PAD = 10;

  if (pontos.length === 0) {
    return <Text style={{ ...type.body, color: color.text.muted }}>Sem dado ainda.</Text>;
  }

  const valores = pontos.map((p) => p.novos_usuarios);
  const maxY = Math.max(...valores, 1);
  const larguraUtil = LARGURA - PAD * 2;
  const alturaUtil = ALTURA - PAD * 2;
  const ultimoIndex = pontos.length - 1;

  const x = (i: number) => PAD + (ultimoIndex > 0 ? (i / ultimoIndex) * larguraUtil : larguraUtil / 2);
  const y = (v: number) => PAD + alturaUtil - (v / maxY) * alturaUtil;

  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.novos_usuarios).toFixed(1)}`).join(" ");
  const area = `${linha} L${x(ultimoIndex).toFixed(1)},${(ALTURA - PAD).toFixed(1)} L${x(0).toFixed(1)},${(ALTURA - PAD).toFixed(1)} Z`;
  const ultimo = pontos[ultimoIndex];

  return (
    <Svg width="100%" height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
      {[0, 0.5, 1].map((f) => (
        <Line key={f} x1={PAD} y1={PAD + alturaUtil * f} x2={LARGURA - PAD} y2={PAD + alturaUtil * f} stroke={chart.grid} strokeWidth={1} />
      ))}
      <Path d={area} fill={chart.seriesFill} stroke="none" />
      <Path d={linha} fill="none" stroke={chart.series} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={x(ultimoIndex)} cy={y(ultimo.novos_usuarios)} r={4} fill={chart.accent} stroke={color.bg.surface} strokeWidth={2} />
    </Svg>
  );
}

// ============================================================================
// Alertas
// ============================================================================
const ALERTA_COR: Record<AlertaSeveridade, string> = {
  info: color.state.info,
  warning: color.state.warning,
  danger: color.state.danger,
};

function AlertRow({ alerta }: { alerta: Alerta }) {
  return (
    <View style={{ flexDirection: "row", gap: space[3], paddingVertical: space[2], borderTopWidth: 1, borderTopColor: color.bg.surfaceAlt }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ALERTA_COR[alerta.severidade], marginTop: 6 }} />
      <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>{alerta.texto}</Text>
    </View>
  );
}

// ============================================================================
// Funil da Jornada — barras horizontais na ordem fixa das fases.
// ============================================================================
function FunilJornada({ funil }: { funil: FunilFase[] }) {
  const porFase = new Map(funil.map((f) => [f.fase, f]));
  const fases = FASE_ORDER.map((f) => porFase.get(f)).filter((f): f is FunilFase => !!f);

  if (fases.length === 0) {
    return <Text style={{ ...type.body, color: color.text.muted }}>Nenhuma jornada com etapa concluída ainda.</Text>;
  }

  return (
    <View style={{ gap: space[3] }}>
      {fases.map((f) => {
        const pct = f.total_jornadas > 0 ? (f.alcancaram / f.total_jornadas) * 100 : 0;
        return (
          <View key={f.fase} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ ...type.caption, color: color.text.secondary, fontWeight: "600" }}>{FASE_LABEL[f.fase] ?? f.fase}</Text>
              <Text style={{ ...type.caption, color: color.text.muted }}>
                {Math.round(pct)}% · {formatNumber(f.alcancaram)}/{formatNumber(f.total_jornadas)}
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: color.bg.surfaceAlt, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${Math.max(pct, f.alcancaram > 0 ? 2 : 0)}%`, borderRadius: 4, backgroundColor: chart.series }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// Rankings — barras horizontais genéricas
// ============================================================================
function RankingBarras({ dados }: { dados: { label: string; valor: number }[] }) {
  if (dados.length === 0) return <Text style={{ ...type.body, color: color.text.muted }}>Sem dado ainda.</Text>;
  const max = Math.max(...dados.map((d) => d.valor), 1);
  return (
    <View style={{ gap: space[3] }}>
      {dados.map((d) => (
        <View key={d.label} style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ ...type.caption, color: color.text.secondary, fontWeight: "600" }} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={{ ...type.caption, color: color.text.muted }}>{formatNumber(d.valor)}</Text>
          </View>
          <View style={{ height: 7, borderRadius: 4, backgroundColor: color.bg.surfaceAlt, overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${Math.max((d.valor / max) * 100, d.valor > 0 ? 4 : 0)}%`,
                borderRadius: 4,
                backgroundColor: chart.series,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function RankingModulos({ modulos, totalUsuarios }: { modulos: AdocaoModulo[]; totalUsuarios: number }) {
  if (modulos.length === 0) return <Text style={{ ...type.body, color: color.text.muted }}>Sem dado ainda.</Text>;
  return (
    <View style={{ gap: space[3] }}>
      {modulos.map((m) => {
        // Clamp de exibição: `habilitados` pode passar de `totalUsuarios` quando existe
        // `user_modules` de conta que já não está mais em `public.users` (dado real,
        // não bug desta tela) — nunca mostrar porcentagem acima de 100%.
        const pct = totalUsuarios > 0 ? Math.min((m.habilitados / totalUsuarios) * 100, 100) : 0;
        return (
          <View key={m.modulo} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ ...type.caption, color: color.text.secondary, fontWeight: "600" }} numberOfLines={1}>
                {m.modulo}
              </Text>
              <Text style={{ ...type.caption, color: color.text.muted }}>
                {Math.round(pct)}% · {formatNumber(m.habilitados)}
              </Text>
            </View>
            <View style={{ height: 7, borderRadius: 4, backgroundColor: color.bg.surfaceAlt, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${Math.max(pct, m.habilitados > 0 ? 2 : 0)}%`, borderRadius: 4, backgroundColor: chart.series }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RankingDicas({ dicas }: { dicas: DicaRanking[] }) {
  if (dicas.length === 0) return <Text style={{ ...type.body, color: color.text.muted }}>Nenhum acesso registrado ainda.</Text>;
  return (
    <View style={{ gap: space[1] }}>
      {dicas.map((d, i) => (
        <View
          key={d.material_id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: space[2],
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: color.bg.surfaceAlt,
          }}
        >
          <View style={{ flex: 1, marginRight: space[2] }}>
            <Text style={{ ...type.caption, color: color.text.primary, fontWeight: "600" }} numberOfLines={1}>
              {d.titulo}
            </Text>
            <Text style={{ ...type.caption, color: color.text.muted }}>{d.categoria}</Text>
          </View>
          <Text style={{ ...type.bodyStrong, color: color.bg.brand }}>{formatNumber(d.acessos)}</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Uso de IA
// ============================================================================
function IaUsageBarChart({ pontos }: { pontos: IaUsageDia[] }) {
  if (pontos.length === 0) return <Text style={{ ...type.body, color: color.text.muted }}>Sem dado ainda.</Text>;
  const max = Math.max(...pontos.map((p) => p.chamadas), 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 64 }}>
      {pontos.map((p) => (
        <View
          key={p.dia}
          style={{
            flex: 1,
            height: `${Math.max((p.chamadas / max) * 100, p.chamadas > 0 ? 6 : 2)}%`,
            backgroundColor: p.chamadas > 0 ? chart.series : color.bg.surfaceAlt,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

function RankingFuncoesIa({ dados }: { dados: IaUsagePorFuncao[] }) {
  if (dados.length === 0) return <Text style={{ ...type.body, color: color.text.muted }}>Sem dado ainda.</Text>;
  return (
    <View style={{ gap: space[2] }}>
      {dados.slice(0, 5).map((d) => (
        <View key={d.funcao} style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ ...type.caption, color: color.text.secondary }} numberOfLines={1}>
            {d.funcao}
          </Text>
          <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "600" }}>{formatNumber(d.tokens)} tk</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Atalhos
// ============================================================================
function NavCard({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexGrow: 1, minWidth: 240 }}>
      <Card variant="default" padding={5}>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>{title} →</Text>
        <Text style={{ ...type.body, color: color.text.secondary }}>{description}</Text>
      </Card>
    </Pressable>
  );
}
