import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { breakpoint, Button, Card, chart, color, Logo, MaryAvatar, radius, space, type } from "@serdono/ui";
import { CONTEUDO_TIPO_LABEL, signOut, type BibliotecaConteudo, type ConteudoTipo } from "@serdono/supabase";
import { formatMoney } from "../diagnostico/labels";
import { useDashboard, type FaseResumo, type Marco } from "./useDashboard";

/**
 * Painel do empreendedor (SDD-50) — a tela inicial pós-login para quem não
 * quer entrar direto na Jornada. Conceito aprovado pelo dono do produto:
 * identidade do negócio em destaque + linha do tempo narrativa dos marcos
 * reais, em vez de um painel de BI denso (o produto é orientador, não ERP —
 * PRD §9.12 — então não temos dado operacional pra sustentar aquilo).
 */
export function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < breakpoint.medium;
  const v = useDashboard();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (v.loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  const primeiroNome = v.nomeUsuario?.trim().split(" ")[0] ?? null;

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
          <HeaderLink label="Minha Jornada" onPress={() => router.push("/jornada")} />
          <HeaderLink label="Meu perfil" onPress={() => router.push("/perfil")} />
          <HeaderLink label="Sair" onPress={handleSignOut} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.jornada ? (
          <HeroNegocio
            nomeEmpresa={v.jornada.nome_empresa_escolhido}
            nicheName={v.nicheName}
            regime={v.jornada.regime_formalizacao}
            logoUrl={v.logoUrl}
            percentual={v.progresso?.percentual ?? 0}
            concluida={v.progresso?.concluida ?? false}
            primeiroNome={primeiroNome}
            compact={compact}
          />
        ) : (
          <Card variant="brand" padding={6}>
            <Text style={{ ...type.h2, color: color.text.onBrand, marginBottom: space[2] }}>
              {primeiroNome ? `Boas-vindas, ${primeiroNome}!` : "Boas-vindas!"}
            </Text>
            <Text style={{ ...type.body, color: color.bg.brandSubtle, marginBottom: space[4] }}>
              Sua Jornada Empreendedora ainda não começou. É por lá que a gente escolhe o nicho e monta seu negócio
              passo a passo.
            </Text>
            <Button label="Começar minha Jornada" variant="primary" onPress={() => router.push("/jornada")} style={{ alignSelf: "flex-start" }} />
          </Card>
        )}

        {v.jornada ? (
          <View style={{ flexDirection: compact ? "column" : "row", gap: space[4] }}>
            <KpiCard
              titulo="Sua primeira venda"
              valor={v.valorPrimeiraVenda != null ? formatMoney(v.valorPrimeiraVenda) : null}
              vazio="Ainda não registrada"
              apoio={v.valorPrimeiraVenda != null ? "registrada na Jornada" : "registre quando fechar a primeira"}
            />
            <KpiCard
              titulo="Ponto de equilíbrio"
              valor={v.pontoEquilibrio != null ? formatMoney(v.pontoEquilibrio) : null}
              vazio="Ainda não calculado"
              apoio={v.pontoEquilibrio != null ? "faturamento mínimo por mês" : "preencha a calculadora do Financeiro"}
            />
            <KpiCard
              titulo="Clientes conquistados"
              valor={String(v.clientesConquistados)}
              apoio={v.metaClientes != null ? `de uma meta de ${v.metaClientes}` : "defina sua meta na fase Clientes"}
              progresso={v.metaClientes ? Math.min(1, v.clientesConquistados / v.metaClientes) : undefined}
            />
          </View>
        ) : null}

        <View style={{ flexDirection: compact ? "column" : "row", gap: space[4], alignItems: "flex-start" }}>
          <View style={{ flex: compact ? undefined : 2, width: "100%", gap: space[4] }}>
            {v.marcos.length > 0 ? <LinhaDoTempo marcos={v.marcos} total={v.totalEtapasConcluidas} /> : null}
            {v.jornada ? <OndeVoceChegou fases={v.fasesResumo} onPress={() => router.push("/jornada")} /> : null}
          </View>

          <View style={{ flex: compact ? undefined : 1, width: "100%", gap: space[4] }}>
            <CardMary onPress={() => router.push("/assistente")} />
            <CardModulos modulos={v.modulos} onPress={() => router.push("/modulos")} />
          </View>
        </View>

        <CardBiblioteca conteudos={v.conteudos} />
      </ScrollView>
    </View>
  );
}

function HeaderLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
      <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>{label}</Text>
    </Pressable>
  );
}

const REGIME_LABEL: Record<string, string> = { mei: "MEI", formal: "Empresa formal" };

function HeroNegocio({
  nomeEmpresa,
  nicheName,
  regime,
  logoUrl,
  percentual,
  concluida,
  primeiroNome,
  compact,
}: {
  nomeEmpresa: string | null;
  nicheName: string | null;
  regime: string | null;
  logoUrl: string | null;
  percentual: number;
  concluida: boolean;
  primeiroNome: string | null;
  compact: boolean;
}) {
  const nome = nomeEmpresa ?? nicheName ?? "Seu negócio";
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const detalhes = [nicheName, regime ? REGIME_LABEL[regime] : null].filter(Boolean).join(" · ");

  return (
    <Card variant="brand" padding={6}>
      <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[3] }}>
        {primeiroNome ? `OI, ${primeiroNome.toUpperCase()}` : "SEU NEGÓCIO"}
      </Text>
      <View style={{ flexDirection: compact ? "column" : "row", alignItems: compact ? "flex-start" : "center", gap: space[5] }}>
        <View style={{ width: 64, height: 64, borderRadius: radius.lg, backgroundColor: color.action.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityLabel={`Logo de ${nome}`} />
          ) : (
            <Text style={{ ...type.h2, color: color.text.onAction }}>{iniciais}</Text>
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...type.h1, color: color.text.onBrand }}>{nome}</Text>
          {detalhes ? <Text style={{ ...type.body, color: color.bg.brandSubtle, marginTop: space[1] }}>{detalhes}</Text> : null}
          <View style={{ flexDirection: "row", marginTop: space[3] }}>
            <View style={{ backgroundColor: concluida ? color.state.success : "rgba(255,255,255,0.16)", borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: 4 }}>
              <Text style={{ ...type.caption, color: color.text.onBrand, fontWeight: "700" }}>
                {concluida ? "Jornada concluída" : "Jornada em andamento"}
              </Text>
            </View>
          </View>
        </View>

        <AnelProgresso percentual={percentual} />
      </View>
    </Card>
  );
}

/** Medidor de razão contra um limite (0–100%) — não é um gráfico de pizza de 2 fatias. */
function AnelProgresso({ percentual }: { percentual: number }) {
  const raio = 30;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = (Math.max(0, Math.min(100, percentual)) / 100) * circunferencia;

  return (
    <View style={{ width: 76, height: 76, alignItems: "center", justifyContent: "center" }}>
      <Svg width={76} height={76} accessibilityLabel={`Progresso da jornada: ${percentual} por cento`}>
        <Circle cx={38} cy={38} r={raio} stroke="rgba(255,255,255,0.20)" strokeWidth={8} fill="none" />
        <Circle
          cx={38}
          cy={38}
          r={raio}
          stroke={chart.accent}
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${preenchido} ${circunferencia}`}
          transform="rotate(-90 38 38)"
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand, fontVariant: ["tabular-nums"] }}>{percentual}%</Text>
      </View>
    </View>
  );
}

function KpiCard({
  titulo,
  valor,
  vazio,
  apoio,
  progresso,
}: {
  titulo: string;
  valor: string | null;
  vazio?: string;
  apoio: string;
  progresso?: number;
}) {
  const temValor = valor != null;
  return (
    <Card variant="default" padding={5} style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ ...type.overline, color: color.text.muted }}>{titulo.toUpperCase()}</Text>
      <Text
        style={{
          ...(temValor ? type.h2 : type.body),
          color: temValor ? color.text.primary : color.text.muted,
          marginTop: space[2],
        }}
      >
        {temValor ? valor : vazio}
      </Text>
      {progresso != null ? (
        <View style={{ height: 6, borderRadius: radius.full, backgroundColor: chart.track, marginTop: space[3], overflow: "hidden" }}>
          <View style={{ width: `${Math.round(progresso * 100)}%`, height: "100%", backgroundColor: chart.series, borderRadius: radius.full }} />
        </View>
      ) : null}
      <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[2] }}>{apoio}</Text>
    </Card>
  );
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function LinhaDoTempo({ marcos, total }: { marcos: Marco[]; total: number }) {
  return (
    <Card variant="default" padding={5}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: space[4] }}>
        <Text style={{ ...type.h3, color: color.text.primary }}>Sua linha do tempo</Text>
        <Text style={{ ...type.caption, color: color.text.muted }}>{total} etapas concluídas</Text>
      </View>

      <View style={{ gap: space[4] }}>
        {marcos.map((m, i) => (
          <View key={m.id} style={{ flexDirection: "row", gap: space[3] }}>
            <View style={{ alignItems: "center", width: 14 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: radius.full,
                  backgroundColor: i === 0 ? chart.accent : chart.series,
                  marginTop: 4,
                }}
              />
              {i < marcos.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: color.border.default, marginTop: 2 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: space[1] }}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{m.titulo}</Text>
              <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>
                {formatarData(m.concluidoEm)} · {m.fase}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

/** Barras horizontais de magnitude (concluídas/total por fase) — rampa de matiz única, mais escura conforme avança. */
function OndeVoceChegou({ fases, onPress }: { fases: FaseResumo[]; onPress: () => void }) {
  const comEtapas = fases.filter((f) => f.total > 0);
  if (comEtapas.length === 0) return null;

  return (
    <Card variant="default" padding={5}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space[4] }}>
        <Text style={{ ...type.h3, color: color.text.primary }}>Onde você chegou</Text>
        <Button label="Abrir Jornada" variant="ghost" size="sm" onPress={onPress} />
      </View>

      <View style={{ gap: space[3] }}>
        {comEtapas.map((f, i) => {
          const razao = f.concluidas / f.total;
          const passo = chart.ramp[Math.min(chart.ramp.length - 1, Math.floor((i / comEtapas.length) * chart.ramp.length))];
          return (
            <View key={f.fase} style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
              <Text style={{ ...type.caption, color: color.text.secondary, width: 108 }} numberOfLines={1}>
                {f.label}
              </Text>
              <View style={{ flex: 1, height: 10, borderRadius: radius.full, backgroundColor: chart.track, overflow: "hidden" }}>
                <View style={{ width: `${Math.round(razao * 100)}%`, height: "100%", backgroundColor: passo, borderRadius: radius.full }} />
              </View>
              <Text style={{ ...type.caption, color: color.text.muted, width: 42, textAlign: "right", fontVariant: ["tabular-nums"] }}>
                {f.concluidas}/{f.total}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function CardMary({ onPress }: { onPress: () => void }) {
  return (
    <Card variant="brand" padding={5}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="boas-vindas" size={56} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>Converse comigo</Text>
          <Text style={{ ...type.body, color: color.bg.brandSubtle, marginTop: space[1] }}>
            Posso falar sobre o seu negócio e sobre o caminho que você já percorreu — e tirar dúvidas de
            empreendedorismo, MEI e finanças.
          </Text>
          <Button label="Abrir conversa" variant="primary" size="sm" onPress={onPress} style={{ alignSelf: "flex-start", marginTop: space[3] }} />
        </View>
      </View>
    </Card>
  );
}

function CardModulos({ modulos, onPress }: { modulos: { id: string; nome: string; descricao: string | null }[]; onPress: () => void }) {
  return (
    <Card variant="default" padding={5}>
      <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Seus módulos</Text>
      {modulos.length > 0 ? (
        <View style={{ gap: space[3] }}>
          {modulos.map((m) => (
            <View key={m.id}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{m.nome}</Text>
              {m.descricao ? <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{m.descricao}</Text> : null}
            </View>
          ))}
          <Button label="Ver todos" variant="ghost" size="sm" onPress={onPress} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : (
        // RN-2/RN-29: nada de anunciar módulo que não existe nem prometer plano
        // que ainda não foi definido (PRD §17 segue pendente).
        <Text style={{ ...type.body, color: color.text.secondary }}>
          Além da Jornada, estamos preparando novos módulos pra te acompanhar depois que o negócio estiver de pé.
          Assim que um for liberado pra você, ele aparece aqui.
        </Text>
      )}
    </Card>
  );
}

const TIPO_ACENTO: Record<ConteudoTipo, string> = {
  curso: chart.ramp[4],
  video: chart.ramp[3],
  apostila: chart.ramp[2],
  dica: chart.ramp[1],
};

function CardBiblioteca({ conteudos }: { conteudos: BibliotecaConteudo[] }) {
  return (
    <Card variant="default" padding={5}>
      <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Biblioteca</Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
        Cursos, vídeos, apostilas e dicas para você continuar aprendendo.
      </Text>

      {conteudos.length === 0 ? (
        <Text style={{ ...type.body, color: color.text.muted }}>
          Ainda não publicamos nenhum material aqui. Assim que o primeiro conteúdo entrar no ar, ele aparece nesta
          área.
        </Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
          {conteudos.map((c) => (
            <View key={c.id} style={{ minWidth: 180, flexGrow: 1, flexBasis: 180 }}>
              <View style={{ height: 76, borderRadius: radius.md, backgroundColor: TIPO_ACENTO[c.tipo as ConteudoTipo] ?? chart.ramp[2], overflow: "hidden" }}>
                {c.thumbnail_url ? (
                  <Image source={{ uri: c.thumbnail_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityLabel={c.titulo} />
                ) : null}
              </View>
              <Text style={{ ...type.bodyStrong, color: color.text.primary, marginTop: space[2] }} numberOfLines={2}>
                {c.titulo}
              </Text>
              <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>
                {CONTEUDO_TIPO_LABEL[c.tipo as ConteudoTipo] ?? c.tipo}
                {c.duracao_min ? ` · ${c.duracao_min} min` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
