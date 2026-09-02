import React, { useState } from "react";
import { useRouter } from "expo-router";
import Head from "expo-router/head";
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Logo, color, radius, space, type } from "@serdono/ui";
import { capturarLeadMagnet, type LeadMagnetRespostas } from "@serdono/supabase";
import { EBOOK, EBOOK_PERGUNTAS } from "../../data/ebook";

type Campo = keyof LeadMagnetRespostas;

const TOTAL_STEPS = EBOOK_PERGUNTAS.length + 1; // 5 perguntas + contato
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function baixarEbook() {
  if (Platform.OS === "web") {
    // Âncora em vez de `window.open` — sobrevive a bloqueador de pop-up mesmo
    // dentro de um handler de clique, e o `download` sugere salvar o arquivo
    // em vez de abrir um leitor de PDF embutido.
    const a = document.createElement("a");
    // `?download` faz o Storage do Supabase servir com Content-Disposition
    // attachment (o atributo `download` do <a> é ignorado cross-origin).
    a.href = `${EBOOK.pdfUrl}?download`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    Linking.openURL(EBOOK.pdfUrl).catch(() => {});
  }
}

export function EbookFormScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0..4 perguntas · 5 contato · 6 concluído
  const [respostas, setRespostas] = useState<Partial<LeadMagnetRespostas>>({});
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const isContato = step === EBOOK_PERGUNTAS.length;
  const isConcluido = step > EBOOK_PERGUNTAS.length;
  const progressPct = Math.min(100, ((step + 1) / TOTAL_STEPS) * 100);

  function escolher(campo: Campo, valor: string) {
    setRespostas((r) => ({ ...r, [campo]: valor }));
    setStep((s) => s + 1);
  }

  async function enviar() {
    setErro(null);
    if (!nome.trim()) return setErro("Como você se chama?");
    if (!EMAIL_RE.test(email.trim())) return setErro("Preciso de um e-mail válido pra te mandar novidades.");

    setEnviando(true);
    try {
      await capturarLeadMagnet({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() || undefined,
        respostas: respostas as LeadMagnetRespostas,
        leadMagnet: EBOOK.slug,
        origem: "landing-ebook",
        website,
      });
      setStep((s) => s + 1);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Head>
        <title>Baixar o guia "Abrir um negócio do zero" | Ser Dono</title>
        <meta name="robots" content="noindex" />
      </Head>

      <ScrollView style={{ flex: 1, backgroundColor: color.bg.canvas }} contentContainerStyle={{ flexGrow: 1 }}>
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
            onPress={() => (isConcluido ? router.replace("/") : router.replace("/ebook"))}
            accessibilityRole="link"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Voltar</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: space[4], paddingBottom: space[16] }}>
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
              {!isConcluido ? (
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
                    style={{
                      width: `${progressPct}%`,
                      height: "100%",
                      backgroundColor: color.action.primary,
                      borderRadius: radius.full,
                    }}
                  />
                </View>
              ) : null}

              {isConcluido ? (
                <Concluido nome={nome} onBaixar={baixarEbook} onJornada={() => router.replace("/diagnostico")} />
              ) : isContato ? (
                <View>
                  <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>
                    ÚLTIMO PASSO
                  </Text>
                  <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>
                    Pra onde eu mando o guia?
                  </Text>
                  <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
                    O download abre na hora. O e-mail é pra eu te mandar o próximo passo depois.
                  </Text>

                  <Campo label="Seu nome" value={nome} onChangeText={setNome} placeholder="Como te chamam?" />
                  <Campo
                    label="Seu e-mail"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="voce@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Campo
                    label="Seu telefone (opcional)"
                    value={telefone}
                    onChangeText={setTelefone}
                    placeholder="(11) 90000-0000"
                    keyboardType="phone-pad"
                  />

                  {/* Honeypot — escondido de gente, visível pra bot. */}
                  <TextInput
                    value={website}
                    onChangeText={setWebsite}
                    autoCapitalize="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ position: "absolute", width: 1, height: 1, opacity: 0, left: -9999 }}
                  />

                  {erro ? (
                    <Text style={{ ...type.caption, color: color.state.danger, marginTop: space[2] }}>{erro}</Text>
                  ) : null}

                  <Button
                    label={enviando ? "Enviando..." : "Baixar o guia grátis →"}
                    variant="primary"
                    fullWidth
                    loading={enviando}
                    style={{ marginTop: space[5] }}
                    onPress={enviar}
                  />
                </View>
              ) : (
                <Pergunta
                  overline={EBOOK_PERGUNTAS[step].overline}
                  titulo={EBOOK_PERGUNTAS[step].titulo}
                  opcoes={EBOOK_PERGUNTAS[step].opcoes}
                  valor={respostas[EBOOK_PERGUNTAS[step].campo] ?? null}
                  onEscolher={(v) => escolher(EBOOK_PERGUNTAS[step].campo, v)}
                />
              )}

              {step > 0 && !isConcluido ? (
                <Pressable
                  onPress={() => {
                    setErro(null);
                    setStep((s) => s - 1);
                  }}
                  style={{ marginTop: space[4], alignSelf: "center", minHeight: 44, justifyContent: "center" }}
                >
                  <Text style={{ ...type.caption, color: color.text.muted }}>Voltar uma pergunta</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function Pergunta({
  overline,
  titulo,
  opcoes,
  valor,
  onEscolher,
}: {
  overline: string;
  titulo: string;
  opcoes: string[];
  valor: string | null;
  onEscolher: (v: string) => void;
}) {
  return (
    <View>
      <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>{overline}</Text>
      <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[5] }}>{titulo}</Text>
      <View style={{ gap: space[2] }}>
        {opcoes.map((opt) => {
          const sel = valor === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onEscolher(opt)}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space[3],
                borderWidth: sel ? 2 : 1,
                borderColor: sel ? color.bg.brand : color.border.default,
                backgroundColor: sel ? "#F5F9FB" : color.bg.surface,
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
                  borderColor: sel ? color.bg.brand : color.border.default,
                  backgroundColor: sel ? color.bg.brand : "transparent",
                }}
              />
              <Text style={{ ...type.body, fontWeight: sel ? "600" : "400", color: color.text.primary, flex: 1 }}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View style={{ marginBottom: space[3] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.text.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
        style={{
          height: 48,
          borderWidth: 1,
          borderColor: color.border.default,
          borderRadius: radius.md,
          paddingHorizontal: space[4],
          fontSize: 14,
          color: color.text.primary,
        }}
      />
    </View>
  );
}

function Concluido({ nome, onBaixar, onJornada }: { nome: string; onBaixar: () => void; onJornada: () => void }) {
  const primeiroNome = nome.trim().split(" ")[0] || "";
  return (
    <View style={{ alignItems: "center", gap: space[3] }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.full,
          backgroundColor: color.state.successBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 28 }}>✓</Text>
      </View>
      <Text style={{ ...type.h2, color: color.text.primary, textAlign: "center" }}>
        {primeiroNome ? `Prontinho, ${primeiroNome}!` : "Prontinho!"}
      </Text>
      <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center", maxWidth: 380 }}>
        Seu guia está liberado. Toque no botão pra abrir o PDF — ele não precisa de senha nem cadastro.
      </Text>
      <Button label="Baixar o e-book agora →" variant="primary" fullWidth style={{ marginTop: space[2] }} onPress={onBaixar} />
      <Pressable onPress={onJornada} style={{ marginTop: space[2], minHeight: 44, justifyContent: "center" }}>
        <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>
          Quero começar minha jornada com a Mary →
        </Text>
      </Pressable>
    </View>
  );
}
