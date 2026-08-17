import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { breakpoint, Button, Card, color, MaryAvatar, space, type } from "@serdono/ui";
import { ScreenHeader } from "../shell/ScreenHeader";
import { calcularProgressoJornada, DESCOBERTA_STEPS, FASE_JORNADA_LABEL, FASES_JORNADA, faseJornadaLiberada, type Plano } from "@serdono/core";
import {
  getCurrentSession,
  getJornadaEtapas,
  getMyJornada,
  getPlanoAtual,
  isEtapaEstruturaRelevante,
  signOut,
  supabase,
  type JornadaEtapa,
  type JornadaEtapaStatus,
  type JornadaFase,
  type JornadaInstance,
  type NicheEstruturaInfo,
} from "@serdono/supabase";
import { ClientesScreen } from "./ClientesScreen";
import { EscolherNichoScreen } from "./EscolherNichoScreen";
import { EstruturaScreen } from "./EstruturaScreen";
import { FinanceiroScreen } from "./FinanceiroScreen";
import { FormalizacaoScreen } from "./FormalizacaoScreen";
import { FornecedoresScreen } from "./FornecedoresScreen";
import { JornadaConclusaoScreen, type ResumoFase } from "./JornadaConclusaoScreen";
import { MarketingScreen } from "./MarketingScreen";
import { OrganizacaoScreen } from "./OrganizacaoScreen";
import { PlanejamentoScreen } from "./PlanejamentoScreen";
import { PrimeiraVendaScreen } from "./PrimeiraVendaScreen";
import { ProdutoScreen } from "./ProdutoScreen";
import { StepRail, type RailFaseData } from "./StepRail";
import { ValidacaoIdeiaScreen } from "./ValidacaoIdeiaScreen";
import { dismissMaryIntro, isMaryIntroDismissed } from "./maryIntroSession";

// Ordem reorganizada em 30/07/2026 (decisão do dono do produto, SDD-39):
// Financeiro passou a vir logo após Formalização, antes de Marketing — faz
// mais sentido conhecer a própria saúde financeira antes de gastar com
// divulgação. Estrutura (SDD-40) entra logo depois, ainda antes de
// Marketing — faz sentido ter a base operacional (local, conta, site...)
// minimamente resolvida antes de captar cliente. Fornecedores (SDD-41) vem
// logo depois de Estrutura — só faz sentido negociar fornecedor a sério
// depois de ter CNPJ/conta PJ. Produto (SDD-42) vem logo depois de
// Fornecedores, ainda antes de Marketing — só faz sentido divulgar depois
// de saber o que vai vender e por quanto.
// A ordem das fases, os rótulos e o cálculo de progresso moram em
// `packages/core/jornadaProgresso.ts` desde a SDD-50 — o painel do
// empreendedor mostra o MESMO percentual, e duas contas separadas
// divergiriam. Retenção/Escala saíram do motor em 31/07/2026 (SDD-49):
// viraram módulos independentes do catálogo (SDD-30), não fases.
const FASES = FASES_JORNADA as JornadaFase[];
const FASE_LABEL = FASE_JORNADA_LABEL as Record<JornadaFase, string>;

export function JornadaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < breakpoint.medium;

  // No celular, a trilha vem empilhada ACIMA do conteúdo editável da fase
  // (SDD-76) — sem isso, quem toca numa etapa da trilha não vê nada
  // acontecer e acha que não dá pra clicar, porque o formulário/checklist
  // de verdade está fora da tela, mais abaixo. `scrollToDetail` rola até lá.
  const scrollRef = useRef<ScrollView>(null);
  const detailRef = useRef<View>(null);
  function scrollToDetail() {
    if (!compact) return;
    const scrollView = scrollRef.current;
    // No New Architecture (padrão no Expo SDK 54/RN 0.81), `measureLayout`
    // não aceita mais o node handle numérico de `findNodeHandle` como
    // segundo argumento — precisa da ref do componente nativo em si, senão
    // dispara "ref.measureLayout must be called with a ref to a native
    // component." `getNativeScrollRef()` é o jeito documentado de obter essa
    // ref nativa a partir do `ScrollView` (que por si só é um componente
    // composto, não um host component).
    const nativeScrollNode = scrollView?.getNativeScrollRef?.();
    if (!scrollView || !nativeScrollNode || !detailRef.current) return;
    detailRef.current.measureLayout(
      nativeScrollNode,
      (_x, y) => scrollView.scrollTo({ y: Math.max(y - space[4], 0), animated: true }),
      () => {}
    );
  }

  const [loading, setLoading] = useState(true);
  const [jornada, setJornada] = useState<JornadaInstance | null>(null);
  const [nicheName, setNicheName] = useState<string | null>(null);
  const [nicheEstrutura, setNicheEstrutura] = useState<NicheEstruturaInfo | null>(null);
  const [etapas, setEtapas] = useState<JornadaEtapa[]>([]);
  // Mostra só na primeira tela da Jornada aberta na sessão do app — o
  // fechamento (`dismissMaryIntro`) fica numa flag em memória, não em
  // estado local, porque essa tela remonta a cada navegação pra /jornada.
  const [maryDismissed, setMaryDismissed] = useState(isMaryIntroDismissed());
  // null = acompanhando a fase_atual real; um valor = revisando uma fase já
  // visitada (SDD-40 — Estrutura precisa ficar sempre editável, mesmo depois
  // de já ter avançado pra Marketing, então a trilha lateral virou navegação
  // pra qualquer fase já semeada, não só a atual).
  const [viewFase, setViewFase] = useState<JornadaFase | null>(null);
  // Gate por fase (cobrança via AbacatePay, 17/08/2026): Gratuito só tem a
  // fase 1 (Validação da Ideia) — fase 2 em diante exige Essencial+.
  const [planoAtual, setPlanoAtual] = useState<Plano>("gratuito");

  // Recarrega etapas E a própria instância — campos como
  // `nome_empresa_escolhido`/`logo_path` (SDD-34/35) vivem em
  // `jornada_instances`, não em `jornada_etapas`. Só recarregar etapas
  // deixava a UI mostrando dado desatualizado mesmo com o dado já salvo.
  async function refreshJornada(instanceId: string) {
    const [novasEtapas, { data: instanceAtualizada, error }] = await Promise.all([
      getJornadaEtapas(instanceId),
      supabase.from("jornada_instances").select("*").eq("id", instanceId).single(),
    ]);
    setEtapas(novasEtapas);
    if (!error && instanceAtualizada) setJornada(instanceAtualizada);
  }

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) return;
      const [instance, plano] = await Promise.all([getMyJornada(session.user.id), getPlanoAtual(session.user.id)]);
      setPlanoAtual((plano as Plano) ?? "gratuito");
      setJornada(instance);
      if (instance?.niche_id) {
        const { data } = await supabase
          .from("niches")
          .select("nome, categoria, dependencia_ponto_fisico")
          .eq("id", instance.niche_id)
          .maybeSingle();
        setNicheName(data?.nome ?? null);
        setNicheEstrutura(data ? { categoria: data.categoria, dependencia_ponto_fisico: data.dependencia_ponto_fisico } : null);
      }
      if (instance) await refreshJornada(instance.id);
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  if (!jornada) {
    return <EscolherNichoScreen />;
  }

  // `fase_atual === "concluida"` (SDD-49) é estado terminal, não está em
  // `FASES` — o cálculo (em `packages/core`, SDD-50) resolve isso devolvendo
  // "organizacao" como fase efetiva, e mostramos a tela de celebração por
  // cima enquanto o usuário não clicar numa fase passada pra revisar.
  const jornadaConcluida = jornada.fase_atual === "concluida";
  const mostrandoConclusao = jornadaConcluida && viewFase === null;

  // `etapas` carrega o histórico de TODAS as fases já visitadas (SDD-36).
  // Formalização (SDD-38) bifurca por regime dentro da própria fase — sem
  // esse filtro extra, trocar de regime (MEI ↔ formal) faria etapas do
  // caminho abandonado continuarem contando no progresso e na trilha.
  const regimeFormalizacao = jornada.regime_formalizacao;
  function etapasDaFase(fase: JornadaFase): JornadaEtapa[] {
    return etapas.filter((e) => {
      if (e.template.fase !== fase) return false;
      if (fase === "formalizacao" && regimeFormalizacao && e.template.aplica_se) {
        return e.template.aplica_se === regimeFormalizacao;
      }
      return true;
    });
  }

  // Estrutura (SDD-40) filtra por relevância de nicho só pro cálculo de
  // progresso e pra trilha lateral — a tela de detalhe (`EstruturaScreen`)
  // recebe a fase completa, sem esse filtro, porque ela própria mostra os
  // itens não essenciais numa seção separada e recolhível.
  function etapasRelevantesDaFase(fase: JornadaFase): JornadaEtapa[] {
    const daFase = etapasDaFase(fase);
    return fase === "estrutura" ? daFase.filter((e) => isEtapaEstruturaRelevante(e.template, nicheEstrutura)) : daFase;
  }

  const { percentual: progresso, faseEfetiva } = calcularProgressoJornada(
    jornada.fase_atual,
    FASES.flatMap((fase) => etapasRelevantesDaFase(fase).map((e) => ({ fase, concluida: e.status === "concluida" })))
  );
  const faseAtualEfetiva = faseEfetiva as JornadaFase;

  // Resumo pra `JornadaConclusaoScreen` — mesma filtragem de relevância de
  // Estrutura usada acima, sem exigir 100% em cada fase (fases "nada trava",
  // como Estrutura/Formalização, podem ter ficado parcialmente feitas e isso
  // é honesto de mostrar, não um bug).
  const resumoFases: ResumoFase[] = [
    { label: "Descoberta", total: DESCOBERTA_STEPS.length, concluidas: DESCOBERTA_STEPS.length },
    ...FASES.map((fase) => {
      const relevantes = etapasRelevantesDaFase(fase);
      return { label: FASE_LABEL[fase], total: relevantes.length, concluidas: relevantes.filter((e) => e.status === "concluida").length };
    }),
  ];

  // Fase sendo mostrada na tela de detalhe agora: a fase_atual real, a menos
  // que o usuário tenha clicado numa fase anterior na trilha pra revisar
  // (SDD-40 — nenhum checklist fica travado depois que você avança). Com a
  // jornada concluída, "revisar" inclui poder abrir de novo até a própria
  // Organização.
  const faseExibida = viewFase ?? faseAtualEfetiva;
  const etapasFaseExibida = etapasDaFase(faseExibida);
  const faseBloqueadaPorPlano = !mostrandoConclusao && !faseJornadaLiberada(faseExibida, planoAtual);

  const railFases: RailFaseData[] = [
    {
      key: "descoberta",
      nome: "Descoberta",
      legenda: `${DESCOBERTA_STEPS.length}/${DESCOBERTA_STEPS.length}`,
      isCurrentFase: false,
      steps: DESCOBERTA_STEPS.map((titulo, i) => ({ key: `descoberta-${i}`, titulo, status: "concluida", isCurrent: false })),
    },
    ...FASES.map((fase) => {
      const etapasDessaFase = etapasDaFase(fase);
      const etapasRelevantesDessaFase = etapasRelevantesDaFase(fase);
      const primeiraPendenteDessaFase = etapasRelevantesDessaFase.findIndex((e) => e.status !== "concluida");
      const isBeingViewed = !mostrandoConclusao && faseExibida === fase;
      const steps =
        etapasRelevantesDessaFase.length > 0
          ? etapasRelevantesDessaFase.map((e, i) => ({
              key: e.id,
              titulo: e.template.titulo,
              status: e.status as JornadaEtapaStatus,
              isCurrent: isBeingViewed && i === primeiraPendenteDessaFase,
            }))
          : null;
      const legenda = steps ? `${steps.filter((s) => s.status === "concluida").length}/${steps.length}` : undefined;
      // Só dá pra clicar em fase já semeada (tem jornada_etapas) — clicar na
      // própria fase_atual volta a "seguir a fase atual" (viewFase = null).
      const onPress =
        etapasDessaFase.length > 0 ? () => setViewFase(fase === jornada.fase_atual ? null : fase) : undefined;
      return { key: fase, nome: FASE_LABEL[fase], legenda, isCurrentFase: isBeingViewed, steps, onPress };
    }),
  ];

  // Concluída, "revisando" é qualquer clique explícito na trilha (inclusive
  // a própria Organização) — precisa sempre mostrar o banner com "Voltar"
  // aqui, senão não haveria como retornar à tela de celebração (ela só
  // aparece com `viewFase === null`, e clicar em Organização a trilha seta
  // `viewFase = "organizacao"` explicitamente, nunca de volta a `null`).
  const revisandoFasePassada = jornadaConcluida ? viewFase !== null : faseExibida !== faseAtualEfetiva;

  const detail = mostrandoConclusao ? (
    <JornadaConclusaoScreen jornada={jornada} nicheName={nicheName} resumoFases={resumoFases} />
  ) : faseBloqueadaPorPlano ? (
    <Card variant="brand" padding={6}>
      <Text style={{ ...type.h3, color: color.text.onBrand, marginBottom: space[2] }}>Continue sua Jornada com o Essencial</Text>
      <Text style={{ ...type.body, color: color.text.onBrand, marginBottom: space[4] }}>
        O plano Gratuito cobre a Validação da Ideia. Pra seguir pra {FASE_LABEL[faseExibida]} — nome da empresa, CNPJ,
        preço e o resto da Jornada — é só assinar o Essencial.
      </Text>
      <Button label="Ver planos" variant="primary" onPress={() => router.push("/planos")} style={{ alignSelf: "flex-start" }} />
    </Card>
  ) : faseExibida === "validacao_ideia" ? (
      <ValidacaoIdeiaScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "planejamento" ? (
      <PlanejamentoScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "formalizacao" ? (
      <FormalizacaoScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "financeiro" ? (
      <FinanceiroScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "estrutura" ? (
      <EstruturaScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "fornecedores" ? (
      <FornecedoresScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "produto" ? (
      <ProdutoScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "marketing" ? (
      <MarketingScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "clientes" ? (
      <ClientesScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "primeira_venda" ? (
      <PrimeiraVendaScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : faseExibida === "organizacao" ? (
      <OrganizacaoScreen jornada={jornada} etapas={etapasFaseExibida} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : (
      <Card variant="default" padding={6}>
        <Text style={{ ...type.body, color: color.text.secondary }}>A próxima etapa chega em breve.</Text>
      </Card>
    );

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[
          { label: "← Painel", onPress: () => router.push("/inicio") },
          { label: "Meu perfil", onPress: () => router.push("/perfil") },
          { label: "Sobre", onPress: () => router.push("/sobre") },
          { label: "Sair", onPress: handleSignOut },
        ]}
      />

      <View style={{ padding: space[5], paddingBottom: space[4], backgroundColor: color.bg.brand }}>
        <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[1] }}>SEU NEGÓCIO</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: space[3], marginBottom: space[3] }}>
          <Text style={{ ...type.h2, color: color.text.onBrand, flex: 1 }}>{nicheName ?? "—"}</Text>
          <Text style={{ ...type.display, color: color.action.primary, fontVariant: ["tabular-nums"] }}>{progresso}%</Text>
        </View>
        <View style={{ height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)", overflow: "hidden" }}>
          <View style={{ width: `${progresso}%`, height: "100%", backgroundColor: color.action.primary }} />
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: space[5] }}>
        {!maryDismissed ? (
          <Card variant="outline" padding={5} style={{ marginBottom: space[5] }}>
            <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
              <MaryAvatar pose="boas-vindas" size={72} />
              <View style={{ flex: 1, gap: space[1] }}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Oi, eu sou a Mary!</Text>
                <Text style={{ ...type.body, color: color.text.secondary }}>
                  Vou te acompanhar em cada etapa da sua Jornada Empreendedora — do primeiro passo até o seu negócio
                  estar de pé. Sempre que precisar de uma explicação, é só continuar por aqui.
                </Text>
                <Button
                  label="Fechar"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    dismissMaryIntro();
                    setMaryDismissed(true);
                  }}
                  style={{ alignSelf: "flex-start", marginTop: space[1] }}
                />
              </View>
            </View>
          </Card>
        ) : null}
        <View style={{ flexDirection: compact ? "column" : "row", gap: space[5], alignItems: "flex-start" }}>
          <StepRail fases={railFases} compact={compact} onStepPress={scrollToDetail} />
          {/* `flex: 1` só funciona com altura disponível pra distribuir — dentro do
              ScrollView (altura intrínseca), em modo compacto/coluna ele colapsa pra 0px
              no nativo (Android/iOS), deixando o conteúdo da fase invisível mesmo
              renderizado (mesmo problema já resolvido em DashboardScreen.tsx:114). */}
          <View ref={detailRef} style={{ flex: compact ? undefined : 1, width: "100%", gap: space[4] }}>
            {revisandoFasePassada ? (
              <Card variant="outline" padding={4}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[3] }}>
                  <Text style={{ ...type.body, color: color.text.secondary, flex: 1 }}>
                    Revisando {FASE_LABEL[faseExibida]} —{" "}
                    {jornadaConcluida ? "sua Jornada já está concluída." : `você está em ${FASE_LABEL[faseAtualEfetiva]}.`}
                  </Text>
                  <Button label="Voltar" variant="ghost" size="sm" onPress={() => setViewFase(null)} />
                </View>
              </Card>
            ) : null}
            {detail}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
