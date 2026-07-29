import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Logo, color, space, type } from "@serdono/ui";
import { getCurrentSession, restartDiagnostic, startJornada, supabase } from "@serdono/supabase";
import { formatMoney, stripMarkdown } from "../diagnostico/labels";

interface MatchRow {
  niche_id: string;
  fit_score: number;
  justificativa_ia: string | null;
  niches: {
    nome: string;
    investimento_min: number;
    investimento_max: number;
  } | null;
}

export function EscolherNichoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) return;
      const { data, error } = await supabase
        .from("niche_matches")
        .select("niche_id, fit_score, justificativa_ia, niches(nome, investimento_min, investimento_max)")
        .eq("user_id", session.user.id)
        .order("fit_score", { ascending: false })
        .limit(3);
      if (error) setError(error.message);
      setMatches((data as unknown as MatchRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const session = await getCurrentSession();
      if (!session) throw new Error("Sessão perdida — faça login de novo.");
      await startJornada(session.user.id, selected);
      router.replace("/jornada");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRestart() {
    setSaving(true);
    setError(null);
    try {
      const session = await getCurrentSession();
      if (!session) throw new Error("Sessão perdida — faça login de novo.");
      await restartDiagnostic(session.user.id);
      router.replace("/diagnostico");
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: space[3],
          borderBottomWidth: 1,
          borderBottomColor: color.border.default,
          backgroundColor: color.bg.surface,
        }}
      >
        <Logo size={28} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Escolha seu nicho</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Estes são os negócios que mais combinaram com seu perfil no diagnóstico. Escolha um pra seguir com a jornada.
        </Text>

        {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : matches.length === 0 ? (
          <Card variant="outline" padding={6} style={{ marginBottom: space[5] }}>
            <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center", marginBottom: space[4] }}>
              Você ainda não tem um diagnóstico salvo pra continuar daqui.
            </Text>
            <Button label="Fazer o diagnóstico" variant="primary" onPress={() => router.push("/diagnostico")} />
          </Card>
        ) : (
          <>
            <View style={{ gap: space[3], marginBottom: space[5] }}>
              {matches.map((match) => {
                const isSelected = selected === match.niche_id;
                return (
                  <Pressable key={match.niche_id} onPress={() => setSelected(match.niche_id)} accessibilityRole="radio" accessibilityState={{ checked: isSelected }}>
                    <Card variant={isSelected ? "default" : "outline"} padding={5} style={isSelected ? { borderWidth: 2, borderColor: color.action.primary } : undefined}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space[2] }}>
                        <Text style={{ ...type.h3, color: color.text.primary, flex: 1 }}>{match.niches?.nome ?? "Nicho"}</Text>
                        <View style={{ alignItems: "center", marginLeft: space[2] }}>
                          <Text style={{ ...type.h2, color: color.bg.brand }}>{match.fit_score}</Text>
                          <Text style={{ ...type.caption, fontSize: 10 }}>FIT SCORE</Text>
                        </View>
                      </View>
                      {match.justificativa_ia ? (
                        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[2] }}>
                          {stripMarkdown(match.justificativa_ia)}
                        </Text>
                      ) : null}
                      {match.niches ? (
                        <Text style={{ ...type.caption, color: color.text.muted }}>
                          Investimento: {formatMoney(match.niches.investimento_min)} a {formatMoney(match.niches.investimento_max)}
                        </Text>
                      ) : null}
                    </Card>
                  </Pressable>
                );
              })}
            </View>

            <Button label={saving ? "Salvando..." : "Continuar com este nicho"} variant="primary" loading={saving} disabled={!selected} onPress={handleContinue} />

            <Pressable
              onPress={handleRestart}
              accessibilityRole="link"
              style={{ minHeight: 44, justifyContent: "center", alignItems: "center", marginTop: space[4] }}
            >
              <Text style={{ ...type.body, color: color.action.secondary }}>Nenhum combinou? Refazer diagnóstico</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}
