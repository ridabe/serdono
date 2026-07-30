import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { breakpoint, Button, Card, color, Logo, MaryAvatar, space, type } from "@serdono/ui";
import {
  getCurrentSession,
  getJornadaEtapas,
  getMyJornada,
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
import { MarketingScreen } from "./MarketingScreen";
import { PlanejamentoScreen } from "./PlanejamentoScreen";
import { ProdutoScreen } from "./ProdutoScreen";
import { StepRail, type RailFaseData } from "./StepRail";
import { ValidacaoIdeiaScreen } from "./ValidacaoIdeiaScreen";

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
const FASES: JornadaFase[] = [
  "validacao_ideia",
  "planejamento",
  "formalizacao",
  "financeiro",
  "estrutura",
  "fornecedores",
  "produto",
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
  estrutura: "Estrutura",
  fornecedores: "Fornecedores",
  produto: "Produto",
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
  const [nicheEstrutura, setNicheEstrutura] = useState<NicheEstruturaInfo | null>(null);
  const [etapas, setEtapas] = useState<JornadaEtapa[]>([]);
  const [maryDismissed, setMaryDismissed] = useState(false);
  // null = acompanhando a fase_atual real; um valor = revisando uma fase já
  // visitada (SDD-40 — Estrutura precisa ficar sempre editável, mesmo depois
  // de já ter avançado pra Marketing, então a trilha lateral virou navegação
  // pra qualquer fase já semeada, não só a atual).
  const [viewFase, setViewFase] = useState<JornadaFase | null>(null);

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

  // Descoberta já concluída por definição (acontece antes do login) — conta
  // como 1 fase completa fixa no numerador. TOTAL_FASES = Descoberta + as 8
  // fases de FASES. % honesta: só "validacao_ideia" tem etapas desenhadas
  // hoje; fases sem template contam 0 de fração própria, sem fabricar um
  // total de "16 etapas".
  const TOTAL_FASES = FASES.length + 1;
  const fasesConcluidasAntesDaAtual = 1 + FASES.indexOf(jornada.fase_atual as JornadaFase);

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

  const etapasFaseAtual = etapasDaFase(jornada.fase_atual as JornadaFase);
  // Estrutura (SDD-40) filtra por relevância de nicho só pro cálculo de
  // progresso e pra trilha lateral — a tela de detalhe (`EstruturaScreen`)
  // recebe a fase completa, sem esse filtro, porque ela própria mostra os
  // itens não essenciais numa seção separada e recolhível.
  const etapasFaseAtualRelevantes =
    jornada.fase_atual === "estrutura"
      ? etapasFaseAtual.filter((e) => isEtapaEstruturaRelevante(e.template, nicheEstrutura))
      : etapasFaseAtual;
  const fracaoFaseAtual =
    etapasFaseAtualRelevantes.length > 0
      ? etapasFaseAtualRelevantes.filter((e) => e.status === "concluida").length / etapasFaseAtualRelevantes.length
      : 0;
  const progresso = Math.round(((fasesConcluidasAntesDaAtual + fracaoFaseAtual) / TOTAL_FASES) * 100);

  // Fase sendo mostrada na tela de detalhe agora: a fase_atual real, a menos
  // que o usuário tenha clicado numa fase anterior na trilha pra revisar
  // (SDD-40 — nenhum checklist fica travado depois que você avança).
  const faseExibida = viewFase ?? (jornada.fase_atual as JornadaFase);
  const etapasFaseExibida = etapasDaFase(faseExibida);

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
      const etapasRelevantesDessaFase =
        fase === "estrutura" ? etapasDessaFase.filter((e) => isEtapaEstruturaRelevante(e.template, nicheEstrutura)) : etapasDessaFase;
      const primeiraPendenteDessaFase = etapasRelevantesDessaFase.findIndex((e) => e.status !== "concluida");
      const isBeingViewed = faseExibida === fase;
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

  const revisandoFasePassada = faseExibida !== jornada.fase_atual;

  const detail =
    faseExibida === "validacao_ideia" ? (
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
          <View style={{ flex: 1, width: "100%", gap: space[4] }}>
            {revisandoFasePassada ? (
              <Card variant="outline" padding={4}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[3] }}>
                  <Text style={{ ...type.body, color: color.text.secondary, flex: 1 }}>
                    Revisando {FASE_LABEL[faseExibida]} — você está em {FASE_LABEL[jornada.fase_atual as JornadaFase]}.
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
