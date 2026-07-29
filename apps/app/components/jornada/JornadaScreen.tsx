import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { breakpoint, Card, color, Logo, space, type } from "@serdono/ui";
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
import { StepRail, type RailFaseData } from "./StepRail";
import { ValidacaoIdeiaScreen } from "./ValidacaoIdeiaScreen";

const FASES: JornadaFase[] = [
  "validacao_ideia",
  "planejamento",
  "formalizacao",
  "marketing",
  "financeiro",
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

  async function refreshEtapas(instanceId: string) {
    setEtapas(await getJornadaEtapas(instanceId));
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
      if (instance) await refreshEtapas(instance.id);
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

  // Fase 0 (Descoberta) já concluída por definição — é por isso que
  // fase_atual nasce em "validacao_ideia" (índice 1). % honesta: só
  // "validacao_ideia" tem etapas desenhadas hoje; fases sem template contam
  // 0 de fração própria, sem fabricar um total de "16 etapas".
  const faseIdx = FASES.indexOf(jornada.fase_atual as JornadaFase);
  const etapasFaseAtual = etapas; // hoje só carregamos a fase atual (validacao_ideia)
  const fracaoFaseAtual =
    etapasFaseAtual.length > 0 ? etapasFaseAtual.filter((e) => e.status === "concluida").length / etapasFaseAtual.length : 0;
  const progresso = Math.round(((faseIdx + fracaoFaseAtual) / FASES.length) * 100);

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
      <ValidacaoIdeiaScreen jornada={jornada} etapas={etapas} onEtapasChanged={() => refreshEtapas(jornada.id)} />
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
        <View style={{ flexDirection: compact ? "column" : "row", gap: space[5], alignItems: "flex-start" }}>
          <StepRail fases={railFases} compact={compact} />
          <View style={{ flex: 1, width: "100%" }}>{detail}</View>
        </View>
      </ScrollView>
    </View>
  );
}
