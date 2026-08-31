import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, EntrepreneurBackground, Logo, color, content, radius, space, type } from "@serdono/ui";
import { ensureSession, isAnonymousSession, supabase } from "@serdono/supabase";
import { pickEntrepreneurPhoto } from "../../constants/entrepreneurPhotos";
import { CAPITAL_LABEL, OBJETIVO_LABEL, TEMPO_LABEL, formatMoney, stripMarkdown } from "./labels";

const BACKGROUND_PHOTO = pickEntrepreneurPhoto("resultado");

/** Caminho concreto dentro do nicho, escolhido pela IA a partir do catálogo curado (RN-38, SDD-66). */
interface SubNegocioDestaque {
  nome: string;
  por_que: string;
}

interface MatchRow {
  niche_id: string;
  fit_score: number;
  justificativa_ia: string | null;
  sub_negocios_destaque: SubNegocioDestaque[] | null;
  precisa_de_mais_capital: boolean;
  afinidade_direta: boolean;
  niches: {
    nome: string;
    slug: string;
    investimento_min: number;
    investimento_max: number;
    origem: "curado" | "ia";
  } | null;
}

interface Perfil {
  capital_disponivel: string | null;
  tempo_disponivel: string | null;
  objetivo: string | null;
  localizacao_cidade: string | null;
  localizacao_estado: string | null;
  areas_inferidas: string[] | null;
  nichos_inferidos: string[] | null;
}

const MATCH_SELECT =
  "niche_id, fit_score, justificativa_ia, sub_negocios_destaque, precisa_de_mais_capital, afinidade_direta, niches(nome, slug, investimento_min, investimento_max, origem)";
const PERFIL_SELECT =
  "capital_disponivel, tempo_disponivel, objetivo, localizacao_cidade, localizacao_estado, areas_inferidas, nichos_inferidos";

export function ResultadoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await ensureSession();
        if (!session) throw new Error("Sessão perdida — volte ao diagnóstico.");
        setLoggedIn(!isAnonymousSession(session));

        const { data: diag, error: diagError } = await supabase
          .from("diagnostic_responses")
          .select(PERFIL_SELECT)
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (diagError) throw diagError;
        setPerfil(diag as Perfil);

        // A ordem é a do ranking da IA (coluna `ordem`), não a do fit_score
        // (SDD-136).
        let { data: matchRows, error: matchError } = await supabase
          .from("niche_matches")
          .select(MATCH_SELECT)
          .eq("user_id", session.user.id)
          .order("ordem", { ascending: true })
          .limit(3);
        if (matchError) throw matchError;

        if (!matchRows || matchRows.length === 0) {
          const { error: fnError } = await supabase.functions.invoke("diagnostic-match");
          if (fnError) throw fnError;
          const retry = await supabase
            .from("niche_matches")
            .select(MATCH_SELECT)
            .eq("user_id", session.user.id)
            .order("ordem", { ascending: true })
            .limit(3);
          if (retry.error) throw retry.error;
          matchRows = retry.data;

          // A function pode ter inferido áreas/nichos do texto livre agora —
          // recarrega pra linha "entendi afinidade com…" aparecer já aqui.
          const { data: diagAtualizado } = await supabase
            .from("diagnostic_responses")
            .select(PERFIL_SELECT)
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (diagAtualizado) setPerfil(diagAtualizado as Perfil);
        }

        setMatches((matchRows as unknown as MatchRow[]) ?? []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas, padding: space[6] }}>
        <Text style={{ ...type.body, color: color.state.danger, textAlign: "center" }}>{error}</Text>
        <Button label="Voltar ao diagnóstico" variant="outline" style={{ marginTop: space[5] }} onPress={() => router.replace("/diagnostico")} />
      </View>
    );
  }

  const resumo = perfil
    ? `Capital entre ${CAPITAL_LABEL[perfil.capital_disponivel ?? ""] ?? "—"} · ${
        TEMPO_LABEL[perfil.tempo_disponivel ?? ""] ?? "—"
      } · ${perfil.localizacao_cidade ?? ""}/${perfil.localizacao_estado ?? ""} · Objetivo: ${
        OBJETIVO_LABEL[perfil.objetivo ?? ""] ?? "—"
      }`
    : "";

  return (
    <View style={{ flex: 1 }}>
      <EntrepreneurBackground photoUrl={BACKGROUND_PHOTO.url} />
      <ScrollView style={{ flex: 1, backgroundColor: "transparent" }} contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: space[2],
        }}
      >
        <Logo size={28} />
        <Pressable
          onPress={() => router.replace("/")}
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Início</Text>
        </Pressable>
      </View>

      <View style={{ alignItems: "center", paddingHorizontal: space[4], paddingBottom: space[10] }}>
        <View style={{ width: "100%", maxWidth: content.maxWidthWide }}>
          <View style={{ backgroundColor: color.bg.brand, borderRadius: radius.lg, padding: space[6], marginBottom: space[6] }}>
            <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[2] }}>
              SEU PERFIL EMPREENDEDOR
            </Text>
            <Text style={{ ...type.h1, color: color.text.onBrand, marginBottom: space[2] }}>
              A gente já sabe o que combina com você.
            </Text>
            <Text style={{ ...type.bodyLg, color: "#C7D3E3" }}>{resumo}</Text>
          </View>

          <Text style={{ ...type.h2, color: color.bg.brand, marginBottom: space[1] }}>
            Os 3 negócios que mais combinam com você
          </Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginBottom: perfil?.areas_inferidas?.length ? space[3] : space[5] }}>
            Calculado a partir das suas respostas — não é sugestão genérica.
          </Text>

          {/* RN-37: o que a IA entendeu do texto livre fica visível, nunca é caixa-preta. */}
          {perfil?.areas_inferidas?.length ? (
            <View
              style={{
                backgroundColor: color.state.infoBg,
                borderRadius: radius.md,
                paddingHorizontal: space[4],
                paddingVertical: space[3],
                marginBottom: space[5],
              }}
            >
              <Text style={{ ...type.caption, color: color.text.primary }}>
                Pelo que você escreveu sobre si, entendi afinidade com:{" "}
                <Text style={{ fontWeight: "700" }}>{perfil.areas_inferidas.join(", ")}</Text>. Isso pesou nas
                sugestões abaixo.
              </Text>
            </View>
          ) : null}

          <View style={{ gap: space[4], marginBottom: space[8] }}>
            {matches.map((match, i) => (
              <View
                key={match.niche_id}
                style={{
                  backgroundColor: color.bg.surface,
                  borderRadius: radius.lg,
                  padding: space[6],
                  borderWidth: i === 0 ? 2 : 0,
                  borderColor: color.action.primary,
                  shadowColor: "#111827",
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space[3] }}>
                  <Text style={{ ...type.h3, color: color.text.primary, flex: 1 }}>{match.niches?.nome ?? "Nicho"}</Text>
                  <View style={{ alignItems: "center", marginLeft: space[2] }}>
                    <Text style={{ fontFamily: type.h1.fontFamily, fontSize: 24, fontWeight: "700", color: color.bg.brand, lineHeight: 24 }}>
                      {match.fit_score}
                    </Text>
                    <Text style={{ ...type.caption, fontSize: 10 }}>FIT SCORE</Text>
                  </View>
                </View>

                <View style={{ height: 8, borderRadius: radius.full, backgroundColor: color.border.default, overflow: "hidden", marginBottom: space[3] }}>
                  <View style={{ width: `${match.fit_score}%`, height: "100%", backgroundColor: color.action.primary }} />
                </View>

                <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
                  {match.justificativa_ia ? stripMarkdown(match.justificativa_ia) : ""}
                </Text>

                {/* Os caminhos concretos dentro do nicho — resolve o "Serviço
                    digital não me diz nada". Sempre do catálogo curado (RN-38). */}
                {match.sub_negocios_destaque?.length ? (
                  <View
                    style={{
                      backgroundColor: color.bg.surfaceAlt,
                      borderRadius: radius.md,
                      padding: space[4],
                      marginBottom: space[3],
                      gap: space[3],
                    }}
                  >
                    <Text style={{ ...type.overline, color: color.text.muted }}>
                      DENTRO DESSE CAMINHO, VOCÊ PODE ABRIR
                    </Text>
                    {match.sub_negocios_destaque.map((sub) => (
                      <View key={sub.nome}>
                        <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{sub.nome}</Text>
                        {sub.por_que ? (
                          <Text style={{ ...type.caption, color: color.text.secondary, marginTop: 2 }}>
                            {stripMarkdown(sub.por_que)}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {match.niches ? (
                  <Text style={{ ...type.caption }}>
                    Investimento inicial{"\n"}
                    <Text style={{ fontSize: 14, color: color.text.primary, fontWeight: "600" }}>
                      {formatMoney(match.niches.investimento_min)} a {formatMoney(match.niches.investimento_max)}
                    </Text>
                  </Text>
                ) : null}

                {/* SDD-135: capital apertado não esconde a sugestão — avisa e segue. */}
                {match.precisa_de_mais_capital ? (
                  <View
                    style={{
                      marginTop: space[3],
                      backgroundColor: color.state.warningBg,
                      borderRadius: radius.md,
                      paddingHorizontal: space[3],
                      paddingVertical: space[2],
                    }}
                  >
                    <Text style={{ ...type.caption, color: color.text.primary }}>
                      Dá pra mirar esse caminho, mas o valor que você tem hoje é apertado pra ele — vale
                      planejar um pouco mais de caixa antes de começar.
                    </Text>
                  </View>
                ) : null}

                {/* SDD-137: ramo que a Mary montou porque não estava no nosso mapa — números são estimativa. */}
                {match.niches?.origem === "ia" ? (
                  <View
                    style={{
                      marginTop: space[3],
                      backgroundColor: color.state.infoBg,
                      borderRadius: radius.md,
                      paddingHorizontal: space[3],
                      paddingVertical: space[2],
                    }}
                  >
                    <Text style={{ ...type.caption, color: color.text.primary }}>
                      Esse ramo ainda não estava no nosso mapa de mercado — montei ele a partir do que
                      você descreveu. Os números acima são uma estimativa pra você ter um ponto de
                      partida, não uma pesquisa fechada. A gente refina isso junto na Jornada.
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>

          <View style={{ alignItems: "center" }}>
            {loggedIn ? (
              <>
                <Text style={{ ...type.h2, color: color.bg.brand, textAlign: "center", marginBottom: space[2] }}>
                  Pronto — agora é só continuar sua jornada.
                </Text>
                <Button label="Continuar" variant="primary" onPress={() => router.replace("/jornada")} />
              </>
            ) : (
              <>
                <Text style={{ ...type.h2, color: color.bg.brand, textAlign: "center", marginBottom: space[2] }}>
                  Quer o passo a passo pra abrir o negócio de verdade?
                </Text>
                <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center", marginBottom: space[5], maxWidth: 480 }}>
                  Cria sua conta agora e a gente guarda esse resultado — o próximo passo é destravar o caminho completo até o primeiro cliente.
                </Text>
                <Button label="Criar minha conta para continuar" variant="primary" onPress={() => router.push("/cadastro")} />
              </>
            )}
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}
