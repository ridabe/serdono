import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { breakpoint, Button, Card, chart, color, MaryAvatar, radius, space, type } from "@serdono/ui";
import { signOut, type CategoriaComMateriais } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { rotaDoModulo } from "../modulos/rotas";
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
      {/* No app instalado esses três destinos são abas (SDD-53) — o cabeçalho
          fica só com a marca. */}
      <ScreenHeader
        webLinks={[
          { label: "Minha Jornada", onPress: () => router.push("/jornada") },
          // "Módulos" faltava aqui desde que o catálogo existe (SDD-30): na web
          // o único caminho até ele era rolar a página até o card "Seus
          // módulos". Quem liberava um módulo novo e procurava no menu do topo
          // não achava nada — foi exatamente o que o dono do produto relatou em
          // 03/08/2026. No app instalado este link não aparece: lá Módulos é
          // aba (DS-20.1).
          { label: "Módulos", onPress: () => router.push("/modulos") },
          // "Dicas da Mary" (SDD-59) segue o mesmo padrão — nunca deixar a
          // única entrada de uma área livre presa dentro de um card.
          { label: "Dicas da Mary", onPress: () => router.push("/dicas-da-mary") },
          { label: "Meu perfil", onPress: () => router.push("/perfil") },
          { label: "Sair", onPress: handleSignOut },
        ]}
      />

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
            <CardModulos
              modulos={v.modulos}
              onPress={() => router.push("/modulos")}
              onAbrirModulo={(slug) => {
                const rota = rotaDoModulo(slug);
                if (rota) router.push(rota as never);
              }}
            />
          </View>
        </View>

        <CardDicasDaMary
          categorias={v.categoriasDicas}
          onPress={() => router.push("/dicas-da-mary")}
          onAbrirCategoria={(categoriaId) => router.push(`/dicas-da-mary/${categoriaId}`)}
        />
      </ScrollView>
    </View>
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

function CardModulos({
  modulos,
  onPress,
  onAbrirModulo,
}: {
  modulos: { id: string; slug: string; nome: string; descricao: string | null }[];
  onPress: () => void;
  onAbrirModulo: (slug: string) => void;
}) {
  return (
    <Card variant="default" padding={5}>
      <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[3] }}>Seus módulos</Text>
      {modulos.length > 0 ? (
        <View style={{ gap: space[3] }}>
          {/* Cada módulo abre direto — antes o card só listava nomes e o
              usuário tinha que passar pelo catálogo pra chegar em qualquer um. */}
          {modulos.map((m) => {
            const rota = rotaDoModulo(m.slug);
            const conteudo = (
              <>
                <Text style={{ ...type.bodyStrong, color: rota ? color.action.secondary : color.text.primary }}>
                  {m.nome}
                  {rota ? " →" : ""}
                </Text>
                {m.descricao ? (
                  <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{m.descricao}</Text>
                ) : null}
              </>
            );

            return rota ? (
              <Pressable
                key={m.id}
                onPress={() => onAbrirModulo(m.slug)}
                accessibilityRole="link"
                accessibilityLabel={`Abrir ${m.nome}`}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                {conteudo}
              </Pressable>
            ) : (
              <View key={m.id}>{conteudo}</View>
            );
          })}
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

function CardDicasDaMary({
  categorias,
  onPress,
  onAbrirCategoria,
}: {
  categorias: CategoriaComMateriais[];
  onPress: () => void;
  onAbrirCategoria: (categoriaId: string) => void;
}) {
  return (
    <Card variant="default" padding={5}>
      <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Dicas da Mary</Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
        Material por tema — PDF, vídeo e links — livre pra qualquer um, sem depender de módulo liberado.
      </Text>

      {categorias.length === 0 ? (
        <Text style={{ ...type.body, color: color.text.muted }}>
          Ainda não publiquei nenhuma categoria aqui. Assim que a primeira entrar no ar, ela aparece nesta área.
        </Text>
      ) : (
        <View style={{ gap: space[3] }}>
          {categorias.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => onAbrirCategoria(cat.id)}
              accessibilityRole="link"
              accessibilityLabel={`Abrir ${cat.titulo}`}
            >
              <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>{cat.titulo}</Text>
              <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }} numberOfLines={1}>
                {cat.materiais.length} material{cat.materiais.length === 1 ? "" : "is"}
              </Text>
            </Pressable>
          ))}
          <Button label="Ver todas" variant="ghost" size="sm" onPress={onPress} style={{ alignSelf: "flex-start" }} />
        </View>
      )}
    </Card>
  );
}
