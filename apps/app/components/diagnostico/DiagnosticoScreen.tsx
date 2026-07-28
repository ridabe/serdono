import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, EntrepreneurBackground, Logo, color, radius, space, type } from "@serdono/ui";
import { ensureSession, supabase } from "@serdono/supabase";
import { pickEntrepreneurPhoto } from "../../constants/entrepreneurPhotos";
import { DIAGNOSTICO_BLOCKS, type DiagnosticoBlock } from "./blocks";

const BACKGROUND_PHOTO = pickEntrepreneurPhoto("diagnostico");

interface Answers {
  capital_disponivel: string | null;
  meses_de_folego: number | null;
  apetite_risco: number | null;
  tempo_disponivel: string | null;
  formacao: string[];
  localizacao_cidade: string | null;
  localizacao_estado: string | null;
  objetivo: string | null;
}

const EMPTY_ANSWERS: Answers = {
  capital_disponivel: null,
  meses_de_folego: null,
  apetite_risco: null,
  tempo_disponivel: null,
  formacao: [],
  localizacao_cidade: null,
  localizacao_estado: null,
  objetivo: null,
};

function isBlockAnswered(block: DiagnosticoBlock, answers: Answers): boolean {
  if (block.type === "location") {
    return Boolean(answers.localizacao_cidade && answers.localizacao_estado);
  }
  if (block.type === "multi") {
    return true; // bloco de experiência pode ficar vazio ("começando do zero")
  }
  const value = answers[block.field as keyof Answers];
  return value !== null && value !== undefined && value !== "";
}

export function DiagnosticoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [blockIndex, setBlockIndex] = useState(0);
  const [cidadeInput, setCidadeInput] = useState("");
  const [estadoInput, setEstadoInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const session = await ensureSession();
        if (!session) throw new Error("Não foi possível iniciar sua sessão.");

        const { data, error: fetchError } = await supabase
          .from("diagnostic_responses")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (fetchError) throw fetchError;

        if (data && data.status_preenchimento === "concluido") {
          // Diagnóstico já concluído antes: /diagnostico aqui significa "refazer",
          // não "continuar de onde parou" — reseta pra bloco 1 (RN-6, recalcular ao mudar).
          const { error: resetError } = await supabase
            .from("diagnostic_responses")
            .update({
              capital_disponivel: null,
              meses_de_folego: null,
              apetite_risco: null,
              tempo_disponivel: null,
              formacao: [],
              localizacao_cidade: null,
              localizacao_estado: null,
              objetivo: null,
              status_preenchimento: "em_andamento",
              respondido_em: null,
            } as never)
            .eq("user_id", session.user.id);
          if (resetError) throw resetError;

          setAnswers(EMPTY_ANSWERS);
          setCidadeInput("");
          setEstadoInput("");
          setBlockIndex(0);
        } else if (data) {
          const loaded: Answers = {
            capital_disponivel: data.capital_disponivel,
            meses_de_folego: data.meses_de_folego,
            apetite_risco: data.apetite_risco,
            tempo_disponivel: data.tempo_disponivel,
            formacao: data.formacao ?? [],
            localizacao_cidade: data.localizacao_cidade,
            localizacao_estado: data.localizacao_estado,
            objetivo: data.objetivo,
          };
          setAnswers(loaded);
          setCidadeInput(loaded.localizacao_cidade ?? "");
          setEstadoInput(loaded.localizacao_estado ?? "");
          const resumeIndex = DIAGNOSTICO_BLOCKS.findIndex((b) => !isBlockAnswered(b, loaded));
          setBlockIndex(resumeIndex === -1 ? DIAGNOSTICO_BLOCKS.length - 1 : resumeIndex);
        } else {
          const { error: insertError } = await supabase
            .from("diagnostic_responses")
            .insert({ user_id: session.user.id });
          if (insertError) throw insertError;
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persistAndAdvance(patch: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const session = await ensureSession();
      if (!session) throw new Error("Sessão perdida — tenta de novo.");

      const isLast = blockIndex === DIAGNOSTICO_BLOCKS.length - 1;
      const fullPatch = isLast
        ? { ...patch, status_preenchimento: "concluido", respondido_em: new Date().toISOString() }
        : patch;

      const { error: updateError } = await supabase
        .from("diagnostic_responses")
        // Os campos são construídos dinamicamente por bloco (ver DIAGNOSTICO_BLOCKS);
        // o shape exato já é validado pelas checks do banco (migration), não pelo TS aqui.
        .update(fullPatch as never)
        .eq("user_id", session.user.id);
      if (updateError) throw updateError;

      if (isLast) {
        const { error: fnError } = await supabase.functions.invoke("diagnostic-match");
        if (fnError) throw fnError;
        router.replace("/diagnostico/resultado");
        return;
      }

      setBlockIndex((i) => i + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  const block = DIAGNOSTICO_BLOCKS[blockIndex];
  const progressPct = ((blockIndex + 1) / DIAGNOSTICO_BLOCKS.length) * 100;
  const isLastBlock = blockIndex === DIAGNOSTICO_BLOCKS.length - 1;

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
          paddingBottom: space[4],
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

      <View style={{ flex: 1, alignItems: "center", paddingHorizontal: space[4], paddingBottom: space[10] }}>
        <View style={{ width: "100%", maxWidth: 560 }}>
          <View
            style={{
              backgroundColor: color.bg.surface,
              borderRadius: radius.lg,
              padding: space[6],
              shadowColor: "#111827",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>
              {block.overline}
            </Text>
            <View
              style={{
                height: 8,
                borderRadius: radius.full,
                backgroundColor: color.border.default,
                overflow: "hidden",
                marginBottom: space[5],
              }}
            >
              <View
                style={{ width: `${progressPct}%`, height: "100%", backgroundColor: color.action.primary, borderRadius: radius.full }}
              />
            </View>

            <Text style={{ ...type.h2, color: color.text.primary, marginBottom: block.subtitle ? space[1] : space[5] }}>
              {block.title}
            </Text>
            {block.subtitle ? (
              <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>{block.subtitle}</Text>
            ) : null}

            {block.type === "single" ? (
              <SingleChoice
                options={block.options}
                value={answers[block.field as keyof Answers] as string | number | null}
                onSelect={(value) => {
                  setAnswers((a) => ({ ...a, [block.field]: value }));
                  persistAndAdvance({ [block.field]: value });
                }}
              />
            ) : null}

            {block.type === "multi" ? (
              <MultiChoice
                options={block.options}
                values={answers.formacao}
                onToggle={(value) => {
                  setAnswers((a) => {
                    const has = a.formacao.includes(String(value));
                    const formacao = has ? a.formacao.filter((v) => v !== value) : [...a.formacao, String(value)];
                    return { ...a, formacao };
                  });
                }}
              />
            ) : null}

            {block.type === "location" ? (
              <View style={{ gap: space[3] }}>
                <View>
                  <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Cidade</Text>
                  <TextInput
                    value={cidadeInput}
                    onChangeText={setCidadeInput}
                    placeholder="Ex.: Campinas"
                    style={{
                      height: 48,
                      borderWidth: 1,
                      borderColor: color.border.default,
                      borderRadius: radius.md,
                      paddingHorizontal: space[4],
                      fontSize: 14,
                    }}
                  />
                </View>
                <View>
                  <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Estado</Text>
                  <TextInput
                    value={estadoInput}
                    onChangeText={setEstadoInput}
                    placeholder="Ex.: SP"
                    autoCapitalize="characters"
                    maxLength={2}
                    style={{
                      height: 48,
                      borderWidth: 1,
                      borderColor: color.border.default,
                      borderRadius: radius.md,
                      paddingHorizontal: space[4],
                      fontSize: 14,
                    }}
                  />
                </View>
              </View>
            ) : null}

            {error ? (
              <Text style={{ ...type.caption, color: color.state.danger, marginTop: space[4] }}>{error}</Text>
            ) : null}

            {block.type === "multi" || block.type === "location" ? (
              <Button
                label={saving ? "Salvando..." : isLastBlock ? "Concluir diagnóstico" : "Continuar"}
                variant="secondary"
                fullWidth
                loading={saving}
                style={{ marginTop: space[5] }}
                onPress={() => {
                  if (block.type === "location") {
                    if (!cidadeInput.trim() || !estadoInput.trim()) {
                      setError("Preencha cidade e estado para continuar.");
                      return;
                    }
                    setAnswers((a) => ({ ...a, localizacao_cidade: cidadeInput.trim(), localizacao_estado: estadoInput.trim() }));
                    persistAndAdvance({
                      localizacao_cidade: cidadeInput.trim(),
                      localizacao_estado: estadoInput.trim().toUpperCase(),
                    });
                  } else {
                    persistAndAdvance({ formacao: answers.formacao });
                  }
                }}
              />
            ) : null}

            {blockIndex > 0 ? (
              <Pressable onPress={() => setBlockIndex((i) => i - 1)} style={{ marginTop: space[4], alignSelf: "center" }}>
                <Text style={{ ...type.caption, color: color.text.muted }}>Voltar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

function SingleChoice({
  options,
  value,
  onSelect,
}: {
  options: { label: string; value: string | number }[];
  value: string | number | null;
  onSelect: (value: string | number) => void;
}) {
  return (
    <View style={{ gap: space[2] }}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onSelect(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space[3],
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? color.bg.brand : color.border.default,
              backgroundColor: isSelected ? "#F5F9FB" : color.bg.surface,
              borderRadius: radius.md,
              paddingVertical: space[3],
              paddingHorizontal: space[3],
              minHeight: 44,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: radius.full,
                borderWidth: 2,
                borderColor: isSelected ? color.bg.brand : color.border.default,
                backgroundColor: isSelected ? color.bg.brand : "transparent",
              }}
            />
            <Text style={{ ...type.body, fontWeight: isSelected ? "600" : "400", color: color.text.primary, flex: 1 }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiChoice({
  options,
  values,
  onToggle,
}: {
  options: { label: string; value: string | number }[];
  values: string[];
  onToggle: (value: string | number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
      {options.map((opt) => {
        const isSelected = values.includes(String(opt.value));
        return (
          <Pressable
            key={opt.label}
            onPress={() => onToggle(opt.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            style={{
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? color.bg.brand : color.border.default,
              backgroundColor: isSelected ? "#F5F9FB" : color.bg.surface,
              borderRadius: radius.full,
              paddingVertical: space[2],
              paddingHorizontal: space[4],
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text style={{ ...type.body, fontWeight: isSelected ? "600" : "400", color: color.text.primary }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
