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

/** Caminho concreto dentro do nicho, vindo do catálogo curado (SDD-66). */
interface SubNegocio {
  id: string;
  niche_id: string;
  nome: string;
  descricao: string;
}

export function EscolherNichoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [subNegocios, setSubNegocios] = useState<SubNegocio[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [subSelecionado, setSubSelecionado] = useState<string | null>(null);
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
        .order("afinidade_direta", { ascending: false })
        .order("fit_score", { ascending: false })
        .limit(3);
      if (error) setError(error.message);
      const rows = (data as unknown as MatchRow[]) ?? [];
      setMatches(rows);

      if (rows.length > 0) {
        const { data: subs, error: subError } = await supabase
          .from("niche_sub_negocios")
          .select("id, niche_id, nome, descricao")
          .in("niche_id", rows.map((m) => m.niche_id))
          .eq("ativo", true)
          .order("ordem");
        if (subError) setError(subError.message);
        setSubNegocios((subs as SubNegocio[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  /** Trocar de nicho limpa o sub-negócio — ele pertence a um nicho só. */
  function selecionarNicho(nicheId: string) {
    setSelected(nicheId);
    setSubSelecionado(null);
  }

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const session = await getCurrentSession();
      if (!session) throw new Error("Sessão perdida — faça login de novo.");
      await startJornada(session.user.id, selected, subSelecionado);
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
          // Bifurcação pedida pelo dono do produto (04/08/2026): quem chega
          // aqui já logado (ex.: conta criada pelo admin) e nunca fez o
          // diagnóstico não pode ser jogado direto pra "descoberta de nicho"
          // — pode já ter um negócio de verdade. Mesma escolha que a home
          // oferece antes do cadastro (AppWelcomeScreen/Hero), só que agora
          // pra dentro do app, pra quem entrou sem passar por nenhuma delas.
          <Card variant="outline" padding={6} style={{ marginBottom: space[5] }}>
            <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center", marginBottom: space[4] }}>
              Você ainda não tem um diagnóstico salvo pra continuar daqui. Como você quer começar?
            </Text>
            <View style={{ gap: space[3] }}>
              <Button label="Quero começar do zero" variant="primary" onPress={() => router.push("/diagnostico")} />
              <Button
                label="Já tenho um negócio"
                variant="outline"
                onPress={() => router.push("/negocio-existente")}
              />
            </View>
          </Card>
        ) : (
          <>
            <View style={{ gap: space[3], marginBottom: space[5] }}>
              {matches.map((match) => {
                const isSelected = selected === match.niche_id;
                const subsDoNicho = subNegocios.filter((s) => s.niche_id === match.niche_id);
                return (
                  <Pressable key={match.niche_id} onPress={() => selecionarNicho(match.niche_id)} accessibilityRole="radio" accessibilityState={{ checked: isSelected }}>
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

                      {/* Só depois de escolher o nicho a pessoa afunila no caminho
                          concreto — é opcional, dá pra seguir com o nicho genérico. */}
                      {isSelected && subsDoNicho.length > 0 ? (
                        <View style={{ marginTop: space[4], gap: space[2] }}>
                          <Text style={{ ...type.overline, color: color.text.muted }}>
                            QUAL DESSES CAMINHOS COMBINA MAIS? (OPCIONAL)
                          </Text>
                          {subsDoNicho.map((sub) => {
                            const subAtivo = subSelecionado === sub.id;
                            return (
                              <Pressable
                                key={sub.id}
                                onPress={() => setSubSelecionado(subAtivo ? null : sub.id)}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: subAtivo }}
                                style={{
                                  borderWidth: subAtivo ? 2 : 1,
                                  borderColor: subAtivo ? color.action.primary : color.border.default,
                                  backgroundColor: subAtivo ? color.action.primarySubtle : color.bg.surface,
                                  borderRadius: 8,
                                  padding: space[3],
                                  minHeight: 44,
                                }}
                              >
                                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{sub.nome}</Text>
                                <Text style={{ ...type.caption, color: color.text.secondary, marginTop: 2 }}>
                                  {sub.descricao}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
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
