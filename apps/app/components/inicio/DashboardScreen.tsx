import { useRouter } from "expo-router";
import { ActivityIndicator, Image, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { breakpoint, Button, Card, chart, CollapsibleSection, color, IconBadge, moduleAccent, MODULE_ACCENT_CYCLE, radius, space, type } from "@serdono/ui";
import { FASES_JORNADA, maskCnpj, numeroFase, type JornadaFaseCore } from "@serdono/core";
import { signOut } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { formatMoney } from "../diagnostico/labels";
import { FaseIcon } from "./FaseIcon";
import { NovidadeModuloPopup } from "./NovidadeModuloPopup";
import { PlanoAcaoResumoCard } from "./PlanoAcaoResumoCard";
import { RaioXResumoCard } from "./RaioXResumoCard";
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
      <NovidadeModuloPopup />

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
          { label: "Sobre", onPress: () => router.push("/sobre") },
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
            cnpj={v.jornada.cnpj}
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
          // Sanfona (pedido do dono do produto, 09/08/2026): "Ponto de
          // equilíbrio" saiu do lugar de "Clientes conquistados" (que agora é
          // a 2ª coluna, no lugar dela) — o número já vive nos KPIs da tela do
          // módulo Financeiro/Raio-X, repetir aqui virou redundante. O bloco
          // inteiro (antes solto na tela) ganhou sanfona própria, fechada por
          // padrão, mesmo espírito de "ganhar espaço" já aplicado em "Dicas da
          // Mary"/"Seus módulos" — e fica ACIMA de "Etapas da Jornada", não
          // mais abaixo dela.
          <CollapsibleSection title="Seus números" accent="gold">
            <View style={{ flexDirection: "row", flexWrap: compact ? "wrap" : "nowrap", gap: space[4] }}>
              <KpiCard
                titulo="Sua primeira venda"
                valor={v.valorPrimeiraVenda != null ? formatMoney(v.valorPrimeiraVenda) : null}
                vazio="Ainda não registrada"
                apoio={v.valorPrimeiraVenda != null ? "registrada na Jornada" : "registre quando fechar a primeira"}
                compact={compact}
              />
              <KpiCard
                titulo="Clientes conquistados"
                valor={String(v.clientesConquistados)}
                apoio={v.metaClientes != null ? `de uma meta de ${v.metaClientes}` : "defina sua meta na fase Clientes"}
                progresso={v.metaClientes ? Math.min(1, v.clientesConquistados / v.metaClientes) : undefined}
                compact={compact}
              />
            </View>
          </CollapsibleSection>
        ) : null}

        {v.jornada ? (
          // Sanfona (pedido do dono do produto, 08/08/2026): fechada por
          // padrão pra quem já concluiu a Jornada (não precisa ver o mapa de
          // fases toda vez que abre a Início), aberta por padrão pra quem
          // ainda tem etapa pendente — assim já enxerga de cara que falta
          // andar, sem precisar tocar pra descobrir. Abrir/fechar continua
          // manual a qualquer momento; isto só decide o estado inicial.
          // Renomeada "Módulos da jornada" → "Etapas da Jornada" (pedido do
          // dono do produto, 09/08/2026) — nome mais claro do que é o
          // conteúdo (o mapa de fases/etapas, não outro catálogo de módulo).
          <CollapsibleSection
            title="Etapas da Jornada"
            accent="brand"
            rightLabel={
              v.progresso?.concluida
                ? "Concluída"
                : `${v.fasesResumo.filter((f) => f.total > 0 && f.concluidas === f.total).length}/${v.fasesResumo.length} fases`
            }
            defaultExpanded={!(v.progresso?.concluida ?? false)}
          >
            <GradeFases fases={v.fasesResumo} faseAtual={v.progresso?.faseEfetiva ?? null} onPress={() => router.push("/jornada")} compact={compact} />
          </CollapsibleSection>
        ) : null}

        {v.jornada && v.progresso && !v.progresso.concluida ? (
          <ProximaEtapa faseEfetiva={v.progresso.faseEfetiva} fasesResumo={v.fasesResumo} onPress={() => router.push("/jornada")} />
        ) : null}

        {/* Resumo do Raio-X Financeiro (pedido do dono do produto,
            09/08/2026) — só o comparativo em barras + o comentário da Mary,
            posicionado ACIMA do Plano de Ação Mensal. Some sozinho se nunca
            houve fechamento (RN-2, ver `RaioXResumoCard.tsx`). */}
        <RaioXResumoCard />

        <PlanoAcaoResumoCard />

        {v.marcos.length > 0 ? <LinhaDoTempo marcos={v.marcos} total={v.totalEtapasConcluidas} /> : null}

        {/* "Converse comigo" saiu da Início (pedido do dono do produto,
            08/08/2026) — virou o botão flutuante da Mary, presente em toda
            tela protegida (`MaryFloatingButton.tsx`), não só aqui. */}

        {/* "Seus módulos" removido do Início (pedido do dono do produto,
            08/08/2026) — já existe no menu lateral (DS-22, `AppDrawer`), essa
            seção era um segundo caminho pro mesmo destino. */}

        {/* "Dicas da Mary" removido da Início (pedido do dono do produto,
            09/08/2026) — virou aba própria na barra do app instalado
            (`MobileTabBar.tsx`, no lugar da antiga aba "Mary", que era
            redundante com o botão flutuante). Repetir o card aqui virou o
            mesmo problema que motivou tirar "Seus módulos": um segundo
            caminho pro destino que a aba já cobre — e a Início ganhou espaço
            de volta pra outro card, se precisar. */}
      </ScrollView>
    </View>
  );
}

const REGIME_LABEL: Record<string, string> = { mei: "MEI", formal: "Empresa formal" };

function HeroNegocio({
  nomeEmpresa,
  nicheName,
  regime,
  cnpj,
  logoUrl,
  percentual,
  concluida,
  primeiroNome,
  compact,
}: {
  nomeEmpresa: string | null;
  nicheName: string | null;
  regime: string | null;
  cnpj: string | null;
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
  const detalhes = [nicheName, regime ? REGIME_LABEL[regime] : null, cnpj ? maskCnpj(cnpj) : null].filter(Boolean).join(" · ");

  return (
    // Layout compactado (pedido do dono do produto, 08/08/2026): antes, no
    // celular, logo/nome/anel de progresso empilhavam em 3 blocos verticais
    // separados (`flexDirection: compact ? "column" : "row"` misturando os
    // três) e o card sozinho tomava quase metade da tela. Agora logo+nome
    // sempre ficam lado a lado (nunca empilham, nem no celular — o logo não
    // pode diminuir de tamanho), o status vem numa linha própria embaixo
    // deles, e só depois vem o anel de progresso — 3 blocos empilhados vira
    // 2, e o mais alto dos dois (logo+nome) é bem mais raso que antes.
    <Card variant="brand" padding={6}>
      <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[3] }}>
        {primeiroNome ? `OI, ${primeiroNome.toUpperCase()}` : "SEU NEGÓCIO"}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: space[4] }}>
        <View style={{ width: 64, height: 64, borderRadius: radius.lg, backgroundColor: color.action.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityLabel={`Logo de ${nome}`} />
          ) : (
            <Text style={{ ...type.h2, color: color.text.onAction }}>{iniciais}</Text>
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...type.h1, color: color.text.onBrand }} numberOfLines={compact ? 2 : 1}>
            {nome}
          </Text>
          {detalhes ? (
            <Text style={{ ...type.body, color: color.bg.brandSubtle, marginTop: space[1] }} numberOfLines={1}>
              {detalhes}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space[4] }}>
        <View style={{ backgroundColor: concluida ? color.state.success : "rgba(255,255,255,0.16)", borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: 4 }}>
          <Text style={{ ...type.caption, color: color.text.onBrand, fontWeight: "700" }}>
            {concluida ? "Jornada concluída" : "Jornada em andamento"}
          </Text>
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
  compact,
}: {
  titulo: string;
  valor: string | null;
  vazio?: string;
  apoio: string;
  progresso?: number;
  compact: boolean;
}) {
  const temValor = valor != null;
  return (
    // Celular: `flexBasis`/`flexGrow` em vez de `flex:1` — dentro de um
    // container `flexWrap`, `flex:1` (flexBasis 0%) faz cada card tentar
    // dividir a largura só com quem estiver na MESMA linha, o que dá 3
    // colunas iguais se os 3 couberem; `flexBasis: "47%"` força 2 por linha
    // de propósito (o card "Clientes conquistados" sobra sozinho na 2ª linha
    // e ocupa a largura toda, o que é aceitável).
    <Card variant="default" padding={5} style={compact ? { flexBasis: "47%", flexGrow: 1, minWidth: 140 } : { flex: 1, minWidth: 0 }}>
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

/**
 * Linha do tempo virou trilha horizontal rolável (pedido do dono do produto,
 * 08/08/2026) — antes empilhava um marco embaixo do outro (até 6, cada um
 * com 2 linhas de texto), ocupando bastante altura de tela à toa. Formato
 * "desenho de workflow": nó redondo + linha conectora, texto abaixo.
 * Ordem invertida pra leitura da esquerda pra direita (mais antigo primeiro)
 * — `marcos` chega mais-recente-primeiro (ordem de exibição antiga, coluna),
 * que não faz sentido pra leitura horizontal de linha do tempo.
 */
function LinhaDoTempo({ marcos, total }: { marcos: Marco[]; total: number }) {
  const cronologica = [...marcos].reverse();
  return (
    <Card variant="default" padding={5}>
      {/* `flexShrink: 1` nos dois textos + `flexWrap: "wrap"` na linha —
          sem isso, no app nativo (Yoga, `flexShrink` nasce em 0 por padrão,
          diferente do flexbox da web) o texto do total não encolhe nem quebra
          linha quando não cabe: ele estoura pra fora do card em vez de ficar
          contido, mesmo quando o preview web mostra tudo cabendo certinho. */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: space[1],
          marginBottom: space[4],
        }}
      >
        <Text style={{ ...type.h3, color: color.text.primary, flexShrink: 1 }}>Sua linha do tempo</Text>
        <Text style={{ ...type.caption, color: color.text.muted, flexShrink: 1 }}>{total} etapas concluídas</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space[1] }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {cronologica.map((m, i) => {
            const ultimo = i === cronologica.length - 1;
            return (
              <View key={m.id} style={{ width: 130, alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                  <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? "transparent" : color.border.default }} />
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: radius.full,
                      backgroundColor: ultimo ? chart.accent : chart.series,
                      flexShrink: 0,
                    }}
                  />
                  <View style={{ flex: 1, height: 2, backgroundColor: ultimo ? "transparent" : color.border.default }} />
                </View>
                <Text numberOfLines={2} style={{ ...type.caption, fontWeight: "700", color: color.text.primary, textAlign: "center", marginTop: space[2] }}>
                  {m.titulo}
                </Text>
                <Text style={{ ...type.caption, fontSize: 10.5, color: color.text.muted, textAlign: "center", marginTop: 2 }} numberOfLines={1}>
                  {formatarData(m.concluidoEm)} · {m.fase}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Card>
  );
}

/** Card de destaque da fase que a pessoa está resolvendo agora — pedido do dono do produto (estilo "próxima etapa" mais visual, 08/08/2026, DS-23). */
function ProximaEtapa({
  faseEfetiva,
  fasesResumo,
  onPress,
}: {
  faseEfetiva: JornadaFaseCore;
  fasesResumo: FaseResumo[];
  onPress: () => void;
}) {
  // Número da fase vem de `numeroFase` (packages/core) — nunca hardcoded
  // aqui nem em nenhuma tela (achado real de inconsistência, SPEC.md SDD-82).
  const ordinal = numeroFase(faseEfetiva);
  const resumo = fasesResumo.find((f) => f.fase === faseEfetiva);
  const accent = MODULE_ACCENT_CYCLE[FASES_JORNADA.indexOf(faseEfetiva) % MODULE_ACCENT_CYCLE.length];
  // Nunca inventar um resumo de tarefa — só o dado real de progresso já carregado.
  const apoio = resumo && resumo.total > 0 ? `${resumo.concluidas} de ${resumo.total} etapas concluídas nesta fase` : "Vamos começar essa fase";

  return (
    <Card variant="default" padding={5}>
      {/* "Fase", nunca "Etapa" — "etapa" já é outro conceito no produto (um
          item de checklist DENTRO de uma fase, `jornada_etapas`). Usar os
          dois termos pra "a mesma coisa" é exatamente a inconsistência que
          o dono do produto reportou (SDD-82). */}
      <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[3] }}>PRÓXIMA FASE</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space[4] }}>
        <IconBadge accent={accent} size={56}>
          <FaseIcon fase={faseEfetiva} color={moduleAccent[accent].fg} size={26} />
        </IconBadge>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
            Fase {ordinal}: {resumo?.label ?? faseEfetiva}
          </Text>
          <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{apoio}</Text>
        </View>
        <Button label="Continuar" variant="primary" size="sm" onPress={onPress} />
      </View>
    </Card>
  );
}

/**
 * Grade colorida com o mapa de todas as fases da Jornada — pedido do dono do
 * produto (visual mais "app nativo", 08/08/2026, DS-23). Um card por fase,
 * com badge de cor + status.
 *
 * **Virou conteúdo de uma `CollapsibleSection` (sanfona), não mais dono do
 * próprio `Card`/título (pedido do dono do produto, 08/08/2026)** — a seção
 * inteira estava tomando bastante altura fixa da Início mesmo pra quem já
 * concluiu a Jornada e não precisa mais olhar aquele mapa toda vez que abre
 * o app. Quem monta o header/estado aberto-ou-fechado agora é
 * `DashboardScreen` (`defaultExpanded = jornada NÃO concluída`), porque só
 * ali existe o dado de progresso geral — este componente só sabe da fase a
 * fase.
 */
function GradeFases({
  fases,
  faseAtual,
  onPress,
  compact,
}: {
  fases: FaseResumo[];
  faseAtual: JornadaFaseCore | null;
  onPress: () => void;
  compact: boolean;
}) {
  return (
    <View style={{ gap: space[4] }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
        {fases.map((f, i) => {
          const status: "concluido" | "andamento" | "pendente" =
            f.total > 0 && f.concluidas === f.total ? "concluido" : f.concluidas > 0 ? "andamento" : "pendente";
          const accent = MODULE_ACCENT_CYCLE[i % MODULE_ACCENT_CYCLE.length];
          const emFoco = f.fase === faseAtual;
          return (
            <View
              key={f.fase}
              style={{
                // Celular: `flexBasis` percentual garante 2 por linha de
                // verdade (largura fixa de 148px + `flexShrink:0` padrão do
                // RN podia estourar a largura disponível e quebrar a grade em
                // 1 coluna só). Fora do celular, mantém a largura fixa que já
                // funcionava bem na coluna mais larga do desktop.
                ...(compact ? { flexBasis: "47%", flexGrow: 1, minWidth: 130 } : { width: 148, flexGrow: 1 }),
                gap: space[2],
                padding: space[3],
                borderRadius: radius.md,
                borderWidth: emFoco ? 2 : 1,
                borderColor: emFoco ? color.action.primaryHover : color.border.default,
              }}
            >
              <IconBadge accent={accent} size={40}>
                <FaseIcon fase={f.fase} color={moduleAccent[accent].fg} size={20} />
              </IconBadge>
              <Text style={{ ...type.bodyStrong, fontSize: 13, color: color.text.primary }} numberOfLines={2}>
                {f.label}
              </Text>
              <StatusPill status={status} />
            </View>
          );
        })}
      </View>
      <Button label="Abrir Jornada" variant="primary" size="sm" onPress={onPress} style={{ alignSelf: "flex-start" }} />
    </View>
  );
}

const STATUS_PILL_LABEL: Record<"concluido" | "andamento" | "pendente", string> = {
  concluido: "Concluído",
  andamento: "Em andamento",
  pendente: "Pendente",
};
// Mesmas cores já documentadas em DESIGN_SYSTEM.md §9.4 (Badge/Tag de status)
// pros equivalentes "concluida"/"em_andamento"/"bloqueada" — reaproveitadas
// aqui, nenhuma cor nova pro pill.
const STATUS_PILL_TONES: Record<"concluido" | "andamento" | "pendente", { bg: string; fg: string }> = {
  concluido: { bg: color.state.successBg, fg: color.state.success },
  andamento: { bg: color.bg.brandSubtle, fg: color.bg.brand },
  pendente: { bg: color.bg.surfaceAlt, fg: color.text.muted },
};

function StatusPill({ status }: { status: "concluido" | "andamento" | "pendente" }) {
  const tones = STATUS_PILL_TONES[status];
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: tones.bg, borderRadius: radius.sm, paddingHorizontal: space[2], paddingVertical: 2 }}>
      <Text style={{ ...type.caption, fontSize: 10.5, fontWeight: "700", color: tones.fg }}>{STATUS_PILL_LABEL[status]}</Text>
    </View>
  );
}

