import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { breakpoint, Button, Card, color, Logo, MaryAvatar, space, type } from "@serdono/ui";
import {
  getCurrentSession,
  getJornadaEtapas,
  getMyJornada,
  signOut,
  supabase,
  type JornadaEtapa,
  type JornadaEtapaStatus,
  type JornadaFase,
  type JornadaInstance,
} from "@serdono/supabase";
import { EscolherNichoScreen } from "./EscolherNichoScreen";
import { FinanceiroScreen } from "./FinanceiroScreen";
import { FormalizacaoScreen } from "./FormalizacaoScreen";
import { PlanejamentoScreen } from "./PlanejamentoScreen";
import { StepRail, type RailFaseData } from "./StepRail";
import { ValidacaoIdeiaScreen } from "./ValidacaoIdeiaScreen";

// Ordem reorganizada em 30/07/2026 (decisão do dono do produto, SDD-39):
// Financeiro passou a vir logo após Formalização, antes de Marketing — faz
// mais sentido conhecer a própria saúde financeira antes de gastar com
// divulgação.
const FASES: JornadaFase[] = [
  "validacao_ideia",
  "planejamento",
  "formalizacao",
  "financeiro",
  "marketing",
  "clientes",
  "retencao",
  "escala",
];

const FASE_LABEL: Record<JornadaFase, string> = {
  validacao_ideia: "Validação da Ideia",
  planejamento: "Planejamento",
  formalizacao: "Formalização",
  marketing: "Marketing",
  financeiro: "Financeiro",
  clientes: "Clientes",
  retencao: "Retenção",
  escala: "Escala",
};

// Descoberta acontece inteira antes do login (diagnóstico + escolha do
// nicho) — não tem jornada_etapas própria (SDD-31), então esses 2 itens são
// só apresentação, sempre concluídos.
const DESCOBERTA_STEPS = ["Diagnóstico de perfil", "Escolha do nicho"];

export function JornadaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < breakpoint.medium;

  const [loading, setLoading] = useState(true);
  const [jornada, setJornada] = useState<JornadaInstance | null>(null);
  const [nicheName, setNicheName] = useState<string | null>(null);
  const [etapas, setEtapas] = useState<JornadaEtapa[]>([]);
  const [maryDismissed, setMaryDismissed] = useState(false);

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
      const instance = await getMyJornada(session.user.id);
      setJornada(instance);
      if (instance?.niche_id) {
        const { data } = await supabase.from("niches").select("nome").eq("id", instance.niche_id).maybeSingle();
        setNicheName(data?.nome ?? null);
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

  // Descoberta já concluída por definição (acontece antes do login) — conta
  // como 1 fase completa fixa no numerador. TOTAL_FASES = Descoberta + as 8
  // fases de FASES. % honesta: só "validacao_ideia" tem etapas desenhadas
  // hoje; fases sem template contam 0 de fração própria, sem fabricar um
  // total de "16 etapas".
  const TOTAL_FASES = FASES.length + 1;
  const fasesConcluidasAntesDaAtual = 1 + FASES.indexOf(jornada.fase_atual as JornadaFase);
  // `etapas` carrega o histórico de TODAS as fases já visitadas (SDD-36) —
  // aqui só interessa o subconjunto da fase atual, tanto pro cálculo de
  // progresso quanto pra passar adiante aos componentes de detalhe.
  // Formalização (SDD-38) bifurca por regime dentro da própria fase — sem
  // esse filtro extra, trocar de regime (MEI ↔ formal) faria etapas do
  // caminho abandonado continuarem contando no progresso e na trilha.
  const etapasFaseAtual = etapas.filter((e) => {
    if (e.template.fase !== jornada.fase_atual) return false;
    if (jornada.fase_atual === "formalizacao" && jornada.regime_formalizacao && e.template.aplica_se) {
      return e.template.aplica_se === jornada.regime_formalizacao;
    }
    return true;
  });
  const fracaoFaseAtual =
    etapasFaseAtual.length > 0 ? etapasFaseAtual.filter((e) => e.status === "concluida").length / etapasFaseAtual.length : 0;
  const progresso = Math.round(((fasesConcluidasAntesDaAtual + fracaoFaseAtual) / TOTAL_FASES) * 100);

  const primeiraPendenteIdx = etapasFaseAtual.findIndex((e) => e.status !== "concluida");

  const railFases: RailFaseData[] = [
    {
      key: "descoberta",
      nome: "Descoberta",
      legenda: `${DESCOBERTA_STEPS.length}/${DESCOBERTA_STEPS.length}`,
      isCurrentFase: false,
      steps: DESCOBERTA_STEPS.map((titulo, i) => ({ key: `descoberta-${i}`, titulo, status: "concluida", isCurrent: false })),
    },
    ...FASES.map((fase) => {
      const isCurrentFase = jornada.fase_atual === fase;
      const steps =
        isCurrentFase && etapasFaseAtual.length > 0
          ? etapasFaseAtual.map((e, i) => ({
              key: e.id,
              titulo: e.template.titulo,
              status: e.status as JornadaEtapaStatus,
              isCurrent: i === primeiraPendenteIdx,
            }))
          : null;
      const legenda = steps ? `${steps.filter((s) => s.status === "concluida").length}/${steps.length}` : undefined;
      return { key: fase, nome: FASE_LABEL[fase], legenda, isCurrentFase, steps };
    }),
  ];

  const detail =
    jornada.fase_atual === "validacao_ideia" ? (
      <ValidacaoIdeiaScreen jornada={jornada} etapas={etapasFaseAtual} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : jornada.fase_atual === "planejamento" ? (
      <PlanejamentoScreen jornada={jornada} etapas={etapasFaseAtual} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : jornada.fase_atual === "formalizacao" ? (
      <FormalizacaoScreen jornada={jornada} etapas={etapasFaseAtual} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : jornada.fase_atual === "financeiro" ? (
      <FinanceiroScreen jornada={jornada} etapas={etapasFaseAtual} onEtapasChanged={() => refreshJornada(jornada.id)} />
    ) : (
      <Card variant="default" padding={6}>
        <Text style={{ ...type.body, color: color.text.secondary }}>A próxima etapa chega em breve.</Text>
      </Card>
    );

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
          <Pressable onPress={handleSignOut} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Sair</Text>
          </Pressable>
        </View>
      </View>

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

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
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
                <Button label="Entendi" variant="ghost" size="sm" onPress={() => setMaryDismissed(true)} style={{ alignSelf: "flex-start", marginTop: space[1] }} />
              </View>
            </View>
          </Card>
        ) : null}
        <View style={{ flexDirection: compact ? "column" : "row", gap: space[5], alignItems: "flex-start" }}>
          <StepRail fases={railFases} compact={compact} />
          <View style={{ flex: 1, width: "100%" }}>{detail}</View>
        </View>
      </ScrollView>
    </View>
  );
}
