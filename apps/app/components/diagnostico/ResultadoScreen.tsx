import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Button, Logo, color, content, radius, space, type } from "@serdono/ui";
import { ensureSession, supabase } from "@serdono/supabase";
import { CAPITAL_LABEL, OBJETIVO_LABEL, TEMPO_LABEL, formatMoney, stripMarkdown } from "./labels";

interface MatchRow {
  niche_id: string;
  fit_score: number;
  justificativa_ia: string | null;
  niches: {
    nome: string;
    slug: string;
    investimento_min: number;
    investimento_max: number;
  } | null;
}

interface Perfil {
  capital_disponivel: string | null;
  tempo_disponivel: string | null;
  objetivo: string | null;
  localizacao_cidade: string | null;
  localizacao_estado: string | null;
}

export function ResultadoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const session = await ensureSession();
        if (!session) throw new Error("Sessão perdida — volte ao diagnóstico.");

        const { data: diag, error: diagError } = await supabase
          .from("diagnostic_responses")
          .select("capital_disponivel, tempo_disponivel, objetivo, localizacao_cidade, localizacao_estado")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (diagError) throw diagError;
        setPerfil(diag as Perfil);

        let { data: matchRows, error: matchError } = await supabase
          .from("niche_matches")
          .select("niche_id, fit_score, justificativa_ia, niches(nome, slug, investimento_min, investimento_max)")
          .eq("user_id", session.user.id)
          .order("fit_score", { ascending: false })
          .limit(3);
        if (matchError) throw matchError;

        if (!matchRows || matchRows.length === 0) {
          const { error: fnError } = await supabase.functions.invoke("diagnostic-match");
          if (fnError) throw fnError;
          const retry = await supabase
            .from("niche_matches")
            .select("niche_id, fit_score, justificativa_ia, niches(nome, slug, investimento_min, investimento_max)")
            .eq("user_id", session.user.id)
            .order("fit_score", { ascending: false })
            .limit(3);
          if (retry.error) throw retry.error;
          matchRows = retry.data;
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
    <ScrollView style={{ flex: 1, backgroundColor: color.bg.canvas }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ paddingHorizontal: space[5], paddingTop: space[6], paddingBottom: space[2] }}>
        <Logo size={28} />
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
          <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
            Calculado a partir das suas respostas — não é sugestão genérica.
          </Text>

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

                {match.niches ? (
                  <Text style={{ ...type.caption }}>
                    Investimento inicial{"\n"}
                    <Text style={{ fontSize: 14, color: color.text.primary, fontWeight: "600" }}>
                      {formatMoney(match.niches.investimento_min)} a {formatMoney(match.niches.investimento_max)}
                    </Text>
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={{ ...type.h2, color: color.bg.brand, textAlign: "center", marginBottom: space[2] }}>
              Quer o passo a passo pra abrir o negócio de verdade?
            </Text>
            <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center", marginBottom: space[5], maxWidth: 480 }}>
              Cria sua conta agora e a gente guarda esse resultado — o próximo passo é destravar o caminho completo até o primeiro cliente.
            </Text>
            <Button label="Criar minha conta para continuar" variant="primary" onPress={() => router.push("/cadastro")} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
