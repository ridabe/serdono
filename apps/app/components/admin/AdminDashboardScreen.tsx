import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { Card, IconBadge, Logo, MODULE_ACCENT_CYCLE, chart, color, radius, space, type } from "@serdono/ui";
import {
  FASE_LABEL,
  FASE_ORDER,
  signOut,
  type AdocaoModulo,
  type CrescimentoDia,
  type DicaRanking,
  type FunilFase,
  type IaUsageDia,
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
          <KpiCard label="Usuários totais" value={stats?.total_usuarios} onPress={() => router.push("/admin/usuarios")} />
          <KpiCard label="Novos usuários (7 dias)" value={stats?.novos_usuarios_7d} onPress={() => router.push("/admin/usuarios")} />
          <KpiCard label="Diagnósticos concluídos" value={stats?.diagnosticos_concluidos} />
          <KpiCard label="Nichos destravados" value={stats?.nichos_destravados} />
          <KpiCard
            label="Usuários bloqueados"
            value={stats?.usuarios_bloqueados}
            tone={stats && stats.usuarios_bloqueados > 0 ? "danger" : undefined}
            onPress={() => router.push("/admin/usuarios")}
          />
        </View>

        {/* ---- Atalhos rápidos (logo no topo — é a navegação principal do painel) ---- */}
        <QuickShortcuts onNavigate={(href) => router.push(href as never)} />

        {/* ---- Crescimento + Alertas ---- */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
          <Card variant="default" padding={5} style={{ flexGrow: 2, minWidth: 320 }}>
            <CardTitle title="Crescimento de usuários" linkLabel="Ver usuários" onPress={() => router.push("/admin/usuarios")} />
            <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
              Cadastros novos por dia, últimos 30 dias — passe o mouse (ou toque) num ponto pra ver o dia
            </Text>
            <GrowthChart pontos={crescimento} />
          </Card>

          <Card variant="default" padding={5} style={{ flexGrow: 1, minWidth: 260 }}>
            <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Alertas</Text>
            <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[2] }}>Sinais que pedem atenção</Text>
            {loading ? null : alertas.length === 0 ? (
              <Text style={{ ...type.body, color: color.text.muted }}>Nenhum alerta no momento.</Text>
            ) : (
              alertas.map((a, i) => <AlertRow key={i} alerta={a} onNavigate={a.href ? () => router.push(a.href as never) : undefined} />)
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
            <CardTitle title="Adoção por módulo" linkLabel="Ver módulos" onPress={() => router.push("/admin/modulos")} />
            <RankingModulos modulos={modulos} totalUsuarios={stats?.total_usuarios ?? 0} />
          </Card>

          <Card variant="default" padding={5} style={{ flexGrow: 1, minWidth: 260 }}>
            <CardTitle title="Fornecedores por categoria" linkLabel="Ver fornecedores" onPress={() => router.push("/admin/fornecedores")} />
            <DonutChart dados={fornecedores.map((f) => ({ label: f.categoria, valor: f.total }))} />
          </Card>

          <Card variant="default" padding={5} style={{ flexGrow: 1, minWidth: 260 }}>
            <CardTitle title="Dicas mais acessadas" linkLabel="Ver dicas" onPress={() => router.push("/admin/dicas")} />
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
              <DonutChart dados={iaPorFuncao.map((d) => ({ label: d.funcao, valor: d.tokens }))} unidade=" tk" />
            </View>
          </View>
        </Card>

      </ScrollView>
    </View>
  );
}

// ============================================================================
// KPI
// ============================================================================
function KpiCard({ label, value, tone, onPress }: { label: string; value?: number; tone?: "danger"; onPress?: () => void }) {
  const content = (
    <Card variant="outline" padding={4} style={{ minWidth: 160, flexGrow: 1 }}>
      <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "600" }}>{label}</Text>
      <Text style={{ ...type.h1, color: tone === "danger" && value ? color.state.danger : color.bg.brand, marginTop: space[1] }}>
        {value != null ? formatNumber(value) : "—"}
      </Text>
    </Card>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ minWidth: 160, flexGrow: 1 }}>
      {content}
    </Pressable>
  );
}

/**
 * Título de card com link pra tela dona daquele dado — padrão a repetir em
 * todo card do dashboard que resume uma entidade administrável (usuários,
 * módulos, fornecedores, dicas...).
 */
function CardTitle({ title, linkLabel, onPress }: { title: string; linkLabel: string; onPress: () => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ ...type.h3, color: color.text.primary }}>{title}</Text>
      <Pressable onPress={onPress} accessibilityRole="link" style={{ minHeight: 32, justifyContent: "center" }}>
        <Text style={{ ...type.caption, color: color.action.secondary, fontWeight: "700" }}>{linkLabel} →</Text>
      </Pressable>
    </View>
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
// (`chart.series`/`chart.seriesFill`, §12 do Design System). Interativo: uma
// coluna invisível por dia sobre o SVG reage a hover (web) e toque
// (nativo/web) — mostra o dia + valor exato num tooltip e realça o ponto,
// em vez de deixar o admin adivinhar o número pela altura da linha.
// ============================================================================
function GrowthChart({ pontos }: { pontos: CrescimentoDia[] }) {
  const LARGURA = 640;
  const ALTURA = 160;
  const PAD = 10;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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
  const destacado = hoverIndex ?? ultimoIndex;
  const pontoDestacado = pontos[destacado];
  const pctEsquerda = ultimoIndex > 0 ? (destacado / ultimoIndex) * 100 : 50;

  return (
    <View>
      <View style={{ position: "relative" }}>
        <Svg width="100%" height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
          {[0, 0.5, 1].map((f) => (
            <Line key={f} x1={PAD} y1={PAD + alturaUtil * f} x2={LARGURA - PAD} y2={PAD + alturaUtil * f} stroke={chart.grid} strokeWidth={1} />
          ))}
          <Path d={area} fill={chart.seriesFill} stroke="none" />
          <Path d={linha} fill="none" stroke={chart.series} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {hoverIndex != null ? (
            <Line x1={x(hoverIndex)} y1={PAD} x2={x(hoverIndex)} y2={ALTURA - PAD} stroke={chart.axis} strokeWidth={1} strokeDasharray="3 3" />
          ) : null}
          <Circle
            cx={x(destacado)}
            cy={y(pontoDestacado.novos_usuarios)}
            r={hoverIndex != null ? 5 : 4}
            fill={chart.accent}
            stroke={color.bg.surface}
            strokeWidth={2}
          />
        </Svg>

        {/* Colunas invisíveis, uma por dia — hover na web, toque em qualquer plataforma. */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row" }}>
          {pontos.map((_, i) => (
            <Pressable
              key={i}
              onHoverIn={() => setHoverIndex(i)}
              onHoverOut={() => setHoverIndex(null)}
              onPressIn={() => setHoverIndex(i)}
              style={{ flex: 1 }}
            />
          ))}
        </View>

        {/* Tooltip — segue a coluna com o mouse/toque, clampado nas bordas do card. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: `${Math.min(Math.max(pctEsquerda, 10), 90)}%`,
            transform: [{ translateX: -50 }],
            backgroundColor: color.bg.brand,
            borderRadius: 6,
            paddingHorizontal: space[2],
            paddingVertical: 4,
            opacity: hoverIndex != null ? 1 : 0,
          }}
        >
          <Text style={{ ...type.caption, color: color.text.onBrand, fontWeight: "700" }}>
            {new Date(pontoDestacado.dia).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · {formatNumber(pontoDestacado.novos_usuarios)}
          </Text>
        </View>
      </View>
    </View>
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

function AlertRow({ alerta, onNavigate }: { alerta: Alerta; onNavigate?: () => void }) {
  const conteudo = (
    <View style={{ flexDirection: "row", gap: space[3], paddingVertical: space[2], borderTopWidth: 1, borderTopColor: color.bg.surfaceAlt }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ALERTA_COR[alerta.severidade], marginTop: 6 }} />
      <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>{alerta.texto}</Text>
      {onNavigate ? <Text style={{ ...type.caption, color: color.action.secondary, fontWeight: "700" }}>Ver →</Text> : null}
    </View>
  );
  if (!onNavigate) return conteudo;
  return (
    <Pressable onPress={onNavigate} accessibilityRole="link">
      {conteudo}
    </Pressable>
  );
}

// ============================================================================
// Cor por magnitude — passo da rampa ordinal (DS-19) proporcional ao valor
// da barra, nunca uma cor arbitrária por categoria: estes gráficos comparam
// grandeza (% de jornada, adoção de módulo), não identidade de série.
// ============================================================================
function corPorMagnitude(valor: number, max: number): string {
  const frac = max > 0 ? valor / max : 0;
  const idx = Math.min(chart.ramp.length - 1, Math.floor(frac * chart.ramp.length));
  return chart.ramp[idx];
}

function truncar(texto: string, max = 14): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

// ============================================================================
// Barra vertical genérica — eixo Y com grade/rótulo de valor, eixo X com o
// rótulo de cada barra (truncado), cor por magnitude via `corPorMagnitude`.
// ============================================================================
function VerticalBarChart({
  dados,
  sufixo = "",
  vazio,
}: {
  dados: { chave: string; label: string; valor: number; legenda?: string }[];
  sufixo?: string;
  vazio: string;
}) {
  if (dados.length === 0) return <Text style={{ ...type.body, color: color.text.muted }}>{vazio}</Text>;

  const ALTURA_BARRAS = 130;
  const max = Math.max(...dados.map((d) => d.valor), 1);

  return (
    <View style={{ flexDirection: "row" }}>
      {/* Eixo Y — máximo, metade, zero. */}
      <View style={{ width: 36, height: ALTURA_BARRAS, justifyContent: "space-between", paddingBottom: 2 }}>
        <Text style={{ ...type.caption, color: color.text.muted, fontSize: 10 }}>
          {formatNumber(Math.round(max))}
          {sufixo}
        </Text>
        <Text style={{ ...type.caption, color: color.text.muted, fontSize: 10 }}>
          {formatNumber(Math.round(max / 2))}
          {sufixo}
        </Text>
        <Text style={{ ...type.caption, color: color.text.muted, fontSize: 10 }}>0{sufixo}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: ALTURA_BARRAS,
            gap: space[2],
            borderLeftWidth: 1,
            borderBottomWidth: 1,
            borderColor: color.border.default,
            paddingLeft: space[1],
          }}
        >
          {dados.map((d) => (
            <View key={d.chave} style={{ flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
              <Text style={{ ...type.caption, color: color.text.primary, fontWeight: "700", fontSize: 10, marginBottom: 2 }}>
                {formatNumber(d.valor)}
                {sufixo}
              </Text>
              <View
                style={{
                  width: "60%",
                  minWidth: 10,
                  height: Math.max((d.valor / max) * (ALTURA_BARRAS - 30), d.valor > 0 ? 4 : 0),
                  backgroundColor: corPorMagnitude(d.valor, max),
                  borderRadius: 3,
                }}
              />
            </View>
          ))}
        </View>

        {/* Eixo X — rótulo de cada barra. */}
        <View style={{ flexDirection: "row", gap: space[2], marginTop: 4, paddingLeft: space[1] }}>
          {dados.map((d) => (
            <Text key={d.chave} style={{ flex: 1, ...type.caption, color: color.text.muted, fontSize: 10, textAlign: "center" }} numberOfLines={2}>
              {d.legenda ?? truncar(d.label)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Pizza/donut — composição (a soma das fatias é o total, ex.: fornecedores
// por categoria, tokens de IA por função). Cor vem de `chart.dashboardCategorical`
// (DS-25) — segundo e único outro caso do produto com identidade de série,
// nunca reaproveitar pra gráfico de magnitude. Categoria além da 5ª dobra em
// "Outras" (`chart.dashboardOther`, neutro) — nunca gera uma 6ª cor.
// ============================================================================
function DonutChart({ dados, unidade = "" }: { dados: { label: string; valor: number }[]; unidade?: string }) {
  const comValor = dados.filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor);
  if (comValor.length === 0) return <Text style={{ ...type.body, color: color.text.muted }}>Sem dado ainda.</Text>;

  const MAX_FATIAS = 5;
  const principais = comValor.slice(0, MAX_FATIAS);
  const resto = comValor.slice(MAX_FATIAS).reduce((soma, d) => soma + d.valor, 0);
  const fatias = resto > 0 ? [...principais, { label: "Outras", valor: resto }] : principais;
  const cores = fatias.map((_, i) => (i < principais.length ? chart.dashboardCategorical[i] : chart.dashboardOther));

  const total = fatias.reduce((s, d) => s + d.valor, 0);
  const SIZE = 140;
  const STROKE = 24;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  let acumulado = 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space[4], flexWrap: "wrap" }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={color.bg.surfaceAlt} strokeWidth={STROKE} fill="none" />
        {fatias.map((d, i) => {
          const frac = d.valor / total;
          const dashoffset = -acumulado * C;
          acumulado += frac;
          return (
            <Circle
              key={d.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={cores[i]}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${frac * C} ${C}`}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          );
        })}
        <SvgText x={SIZE / 2} y={SIZE / 2 - 2} textAnchor="middle" fontSize={18} fontWeight="700" fill={color.text.primary}>
          {formatNumber(total)}
        </SvgText>
        <SvgText x={SIZE / 2} y={SIZE / 2 + 16} textAnchor="middle" fontSize={10} fill={color.text.muted}>
          total{unidade}
        </SvgText>
      </Svg>

      <View style={{ gap: space[2], flex: 1, minWidth: 140 }}>
        {fatias.map((d, i) => (
          <View key={d.label} style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cores[i] }} />
            <Text style={{ ...type.caption, color: color.text.secondary, flex: 1 }} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={{ ...type.caption, color: color.text.primary, fontWeight: "700" }}>{Math.round((d.valor / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Funil da Jornada — barra vertical, ordem fixa das fases, cor por magnitude.
// ============================================================================
function FunilJornada({ funil }: { funil: FunilFase[] }) {
  const porFase = new Map(funil.map((f) => [f.fase, f]));
  const fases = FASE_ORDER.map((f) => porFase.get(f)).filter((f): f is FunilFase => !!f);

  const dados = fases.map((f) => ({
    chave: f.fase,
    label: FASE_LABEL[f.fase] ?? f.fase,
    valor: f.total_jornadas > 0 ? Math.round((f.alcancaram / f.total_jornadas) * 100) : 0,
  }));

  return <VerticalBarChart dados={dados} sufixo="%" vazio="Nenhuma jornada com etapa concluída ainda." />;
}

// ============================================================================
// Adoção por módulo — barra vertical, cor por magnitude (% de usuários).
// ============================================================================
function RankingModulos({ modulos, totalUsuarios }: { modulos: AdocaoModulo[]; totalUsuarios: number }) {
  // Clamp de exibição: `habilitados` pode passar de `totalUsuarios` quando existe
  // `user_modules` de conta que já não está mais em `public.users` (dado real,
  // não bug desta tela) — nunca mostrar porcentagem acima de 100%.
  const dados = modulos.map((m) => ({
    chave: m.modulo,
    label: m.modulo,
    valor: totalUsuarios > 0 ? Math.min(Math.round((m.habilitados / totalUsuarios) * 100), 100) : 0,
  }));

  return <VerticalBarChart dados={dados} sufixo="%" vazio="Sem dado ainda." />;
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
// Série temporal (dia após dia) — continua monocromática de propósito: cor
// por categoria aqui sugeriria identidade entre dias, que não existe
// (DS-19). Eixo Y mostra o máximo; eixo X mostra o primeiro/meio/último dia.
function IaUsageBarChart({ pontos }: { pontos: IaUsageDia[] }) {
  if (pontos.length === 0) return <Text style={{ ...type.body, color: color.text.muted }}>Sem dado ainda.</Text>;
  const max = Math.max(...pontos.map((p) => p.chamadas), 1);
  const meio = Math.floor(pontos.length / 2);

  function rotuloDia(iso: string): string {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ width: 28, height: 64, justifyContent: "space-between" }}>
        <Text style={{ ...type.caption, color: color.text.muted, fontSize: 10 }}>{formatNumber(max)}</Text>
        <Text style={{ ...type.caption, color: color.text.muted, fontSize: 10 }}>0</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 3,
            height: 64,
            borderLeftWidth: 1,
            borderBottomWidth: 1,
            borderColor: color.border.default,
            paddingLeft: 4,
          }}
        >
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
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingLeft: 4 }}>
          <Text style={{ ...type.caption, color: color.text.muted, fontSize: 10 }}>{rotuloDia(pontos[0].dia)}</Text>
          <Text style={{ ...type.caption, color: color.text.muted, fontSize: 10 }}>{rotuloDia(pontos[meio].dia)}</Text>
          <Text style={{ ...type.caption, color: color.text.muted, fontSize: 10 }}>{rotuloDia(pontos[pontos.length - 1].dia)}</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Atalhos rápidos — grade densa de tiles (ícone + título + 1 linha), logo
// abaixo dos KPIs. Antes eram cards largura-cheia lá no rodapé: só 2 por
// linha, altos, e fora da primeira dobra (pedido do dono do produto:
// "preciso correr a página até o final pra acessar").
// ============================================================================
type ShortcutHref =
  | "/admin/usuarios"
  | "/admin/assinaturas"
  | "/admin/abacatepay"
  | "/admin/modulos"
  | "/admin/fornecedores"
  | "/admin/nichos"
  | "/admin/leads"
  | "/admin/dicas"
  | "/admin/versao";

const SHORTCUTS: { icon: string; title: string; description: string; href: ShortcutHref }[] = [
  { icon: "👥", title: "Usuários", description: "Contas, bloqueios e promoção de admins", href: "/admin/usuarios" },
  { icon: "💳", title: "Assinaturas", description: "Planos, receita estimada e inadimplência", href: "/admin/assinaturas" },
  { icon: "🥑", title: "AbacatePay", description: "Produtos, cupons, webhooks, saques e PIX", href: "/admin/abacatepay" },
  { icon: "🧩", title: "Módulos", description: "Catálogo e liberação por usuário", href: "/admin/modulos" },
  { icon: "🤝", title: "Fornecedores", description: "Parceiros sugeridos na Fase 8 da Jornada", href: "/admin/fornecedores" },
  { icon: "✨", title: "Nichos gerados pela IA", description: "Revisar ramos criados fora do catálogo", href: "/admin/nichos" },
  { icon: "📖", title: "Leads do e-book", description: "Cadastros da landing /ebook", href: "/admin/leads" },
  { icon: "💡", title: "Dicas da Mary", description: "Conteúdos de estudo (PDF, vídeo, links)", href: "/admin/dicas" },
  { icon: "📱", title: "Versão do App", description: "Publicação e atualização obrigatória", href: "/admin/versao" },
];

function QuickShortcuts({ onNavigate }: { onNavigate: (href: ShortcutHref) => void }) {
  return (
    <View>
      <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Atalhos rápidos</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
        {SHORTCUTS.map((s, i) => (
          <ShortcutTile
            key={s.href}
            icon={s.icon}
            accent={MODULE_ACCENT_CYCLE[i % MODULE_ACCENT_CYCLE.length]}
            title={s.title}
            description={s.description}
            onPress={() => onNavigate(s.href)}
          />
        ))}
      </View>
    </View>
  );
}

function ShortcutTile({
  icon,
  accent,
  title,
  description,
  onPress,
}: {
  icon: string;
  accent: (typeof MODULE_ACCENT_CYCLE)[number];
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      // flexBasis fixo + flexGrow: preenche a linha por igual, sem esticar
      // além de `maxWidth` (o defeito antigo: 2 tiles ocupando 50% cada).
      style={{ flexGrow: 1, flexBasis: 230, maxWidth: 340, minHeight: 44 }}
    >
      {/* `hovered` só existe no react-native-web — tipado como any, mesmo padrão do NavBar da home. */}
      {({ hovered }: any) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space[3],
            padding: space[3],
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: hovered ? color.action.primary : color.border.default,
            backgroundColor: hovered ? color.action.primarySubtle : color.bg.surface,
          }}
        >
          <IconBadge accent={accent} size={40}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
          </IconBadge>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
              {title}
            </Text>
            <Text style={{ ...type.caption, color: color.text.muted }} numberOfLines={2}>
              {description}
            </Text>
          </View>
          <Text style={{ ...type.body, color: hovered ? color.action.primaryHover : color.text.muted }}>›</Text>
        </View>
      )}
    </Pressable>
  );
}
