import React from "react";
import { useRouter } from "expo-router";
import Head from "expo-router/head";
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Button, Logo, MaryAvatar, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";
import { EBOOK } from "../../data/ebook";
import { EbookCountdown } from "./EbookCountdown";

const COMPACT_BREAKPOINT = 900;

const TITLE = "E-book grátis: Abrir um negócio do zero — começando de casa | Ser Dono";
const DESCRIPTION =
  "Guia gratuito pra quem quer empreender com pouco: começar de casa, validar a ideia e profissionalizar depois. Mercado, vantagens, cuidados e o próximo passo. Baixe agora.";

export function EbookLandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;
  const irParaForm = () => router.push("/ebook/baixar");

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={EBOOK.capaSocialUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <ScrollView style={{ flex: 1, backgroundColor: color.bg.canvas }} contentContainerStyle={{ flexGrow: 1 }}>
        <TopBar compact={compact} onCta={irParaForm} />
        <Hero compact={compact} onCta={irParaForm} />
        <ParaQuem compact={compact} />
        <OQueTemDentro compact={compact} />
        <PoderNaMao compact={compact} />
        <PonteSerDono compact={compact} />
        <CtaFinal compact={compact} onCta={irParaForm} />
        <Rodape compact={compact} />
      </ScrollView>
    </>
  );
}

function Secao({
  children,
  compact,
  dark = false,
}: {
  children: React.ReactNode;
  compact: boolean;
  dark?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: dark ? color.bg.brand : color.bg.canvas,
        paddingHorizontal: compact ? space[4] : space[10],
        paddingVertical: compact ? space[10] : space[16],
      }}
    >
      <View style={{ maxWidth: content.maxWidthWide, width: "100%", alignSelf: "center" }}>{children}</View>
    </View>
  );
}

function TopBar({ compact, onCta }: { compact: boolean; onCta: () => void }) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: compact ? space[4] : space[10],
        paddingVertical: space[3],
        borderBottomWidth: 1,
        borderBottomColor: color.border.default,
        backgroundColor: color.bg.surface,
      }}
    >
      <Pressable onPress={() => router.push("/")} accessibilityRole="link" accessibilityLabel="Ir para a página inicial">
        <Logo size={30} />
      </Pressable>
      <Button label="Baixar o guia grátis" variant="primary" size="sm" onPress={onCta} />
    </View>
  );
}

function Hero({ compact, onCta }: { compact: boolean; onCta: () => void }) {
  return (
    <View
      style={{
        backgroundColor: color.bg.brand,
        paddingHorizontal: compact ? space[4] : space[10],
        paddingTop: compact ? space[10] : space[16],
        paddingBottom: compact ? space[10] : space[16],
      }}
    >
      <View
        style={{
          maxWidth: content.maxWidthWide,
          width: "100%",
          alignSelf: "center",
          flexDirection: compact ? "column" : "row",
          alignItems: "center",
          gap: compact ? space[10] : space[12],
        }}
      >
        <Reveal style={{ flex: compact ? undefined : 1.2, width: compact ? "100%" : undefined }}>
          <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[3] }}>
            GUIA GRATUITO · SER DONO
          </Text>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 32 : 50,
              lineHeight: compact ? 40 : 56,
              letterSpacing: -1.5,
              color: color.text.onBrand,
              marginBottom: space[4],
            }}
          >
            Você não precisa de muito dinheiro nem de um ponto comercial pra{" "}
            <Text style={{ color: color.action.primary }}>começar o seu negócio.</Text>
          </Text>
          <Text style={{ ...type.bodyLg, color: "#C7D3E3", marginBottom: space[6], maxWidth: 520 }}>
            Dá pra começar de casa, com o que você já tem na mão. Este guia mostra, direto ao ponto,
            o mercado hoje, as vantagens de ter o próprio negócio, os cuidados de quem está começando
            — e qual é o próximo passo de verdade.
          </Text>

          <View style={{ marginBottom: space[6] }}>
            <EbookCountdown compact={compact} onDark />
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginBottom: space[3] }}>
            <Button label="Quero meu guia grátis →" variant="primary" onPress={onCta} />
          </View>
          <Text style={{ ...type.caption, color: "#8FA3BC" }}>
            PDF de {EBOOK.paginas} páginas · leitura de ~12 minutos · sem enrolação, sem venda escondida
          </Text>
        </Reveal>

        <Reveal
          delay={motion.revealStagger * 2}
          style={{ width: compact ? "100%" : undefined, flex: compact ? undefined : 0.8, alignItems: "center" }}
        >
          <CapaEbook compact={compact} />
        </Reveal>
      </View>
    </View>
  );
}

function CapaEbook({ compact }: { compact: boolean }) {
  const largura = compact ? 240 : 320;
  return (
    <View
      style={{
        width: largura,
        aspectRatio: 3 / 4,
        borderRadius: radius.lg,
        overflow: "hidden",
        shadowColor: "#000000",
        shadowOpacity: 0.35,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 24 },
        elevation: 16,
      }}
    >
      <Image
        source={{ uri: EBOOK.capaVerticalUrl }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
        accessibilityLabel={`Capa do e-book ${EBOOK.titulo}`}
      />
    </View>
  );
}

const PARA_QUEM = [
  {
    titulo: "Trabalha registrado e sonha em ter algo seu",
    texto: "Sem largar tudo de uma vez — dá pra começar no paralelo, nas horas livres, e ir crescendo.",
  },
  {
    titulo: "Tem uma habilidade e quer virar renda",
    texto: "Cozinha bem, conserta, cuida, ensina, faz unha, desenha. Isso já é a base de um negócio.",
  },
  {
    titulo: "Já vende no grupo da família e dos amigos",
    texto: "Aquele 'bico' informal pode virar um negócio de verdade, organizado e no seu nome.",
  },
  {
    titulo: "Acha que precisa de muito dinheiro pra começar",
    texto: "Não precisa. A maioria dos negócios que dão certo começou pequeno, de casa, com pouco.",
  },
];

function ParaQuem({ compact }: { compact: boolean }) {
  return (
    <Secao compact={compact}>
      <Text style={{ ...type.overline, color: color.action.primaryHover, marginBottom: space[2] }}>É PRA VOCÊ QUE…</Text>
      <Text
        style={{
          ...type.display,
          fontSize: compact ? 26 : 34,
          lineHeight: compact ? 34 : 42,
          color: color.text.primary,
          marginBottom: space[8],
          maxWidth: 640,
        }}
      >
        Empreender não é pra quem já tem muito. É pra quem decide começar.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
        {PARA_QUEM.map((item, i) => (
          <Reveal key={item.titulo} delay={motion.revealStagger * i} style={{ width: "100%", maxWidth: 320, flexGrow: 1 }}>
            <View
              style={{
                backgroundColor: color.bg.surface,
                borderWidth: 1,
                borderColor: color.border.default,
                borderRadius: radius.lg,
                padding: space[5],
                gap: space[2],
                minHeight: 148,
              }}
            >
              <Text style={{ ...type.h3, color: color.text.primary }}>{item.titulo}</Text>
              <Text style={{ ...type.body, color: color.text.secondary }}>{item.texto}</Text>
            </View>
          </Reveal>
        ))}
      </View>
    </Secao>
  );
}

const DENTRO = [
  "O mercado empreendedor no Brasil hoje — com números do Sebrae, não achismo",
  "As vantagens reais de ter o próprio negócio (e as que ninguém te conta)",
  "Os cuidados antes de abrir: o que mais derruba quem está começando",
  "Como sair do improviso e profissionalizar o negócio com o Ser Dono",
  "Um plano de próximo passo — pra fechar o guia sabendo o que fazer segunda-feira",
];

function OQueTemDentro({ compact }: { compact: boolean }) {
  return (
    <Secao compact={compact} dark>
      <View style={{ flexDirection: compact ? "column" : "row", gap: compact ? space[8] : space[12] }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[2] }}>O QUE TEM DENTRO</Text>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 26 : 34,
              lineHeight: compact ? 34 : 42,
              color: color.text.onBrand,
              marginBottom: space[4],
            }}
          >
            {EBOOK.paginas} páginas que vão direto ao ponto
          </Text>
          <Text style={{ ...type.bodyLg, color: "#C7D3E3", maxWidth: 460 }}>
            Nada de teoria solta. É o mapa do caminho entre "tenho vontade" e "tenho um negócio
            funcionando".
          </Text>
        </View>
        <View style={{ flex: 1, gap: space[3] }}>
          {DENTRO.map((linha, i) => (
            <Reveal key={linha} delay={motion.revealStagger * i}>
              <View style={{ flexDirection: "row", gap: space[3], alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: radius.full,
                    backgroundColor: color.action.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                  }}
                >
                  <Text style={{ ...type.caption, color: color.text.onAction, fontWeight: "700" }}>{i + 1}</Text>
                </View>
                <Text style={{ ...type.bodyLg, color: color.text.onBrand, flex: 1 }}>{linha}</Text>
              </View>
            </Reveal>
          ))}
        </View>
      </View>
    </Secao>
  );
}

function PoderNaMao({ compact }: { compact: boolean }) {
  return (
    <Secao compact={compact}>
      <View style={{ alignItems: "center", gap: space[4] }}>
        <Text
          style={{
            ...type.display,
            fontSize: compact ? 26 : 36,
            lineHeight: compact ? 34 : 44,
            color: color.text.primary,
            textAlign: "center",
            maxWidth: 720,
          }}
        >
          O poder de mudar sua renda já está na sua mão. Falta o primeiro passo.
        </Text>
        <View
          style={{
            flexDirection: compact ? "column" : "row",
            gap: compact ? space[4] : space[10],
            marginTop: space[4],
            alignSelf: "stretch",
            justifyContent: "center",
          }}
        >
          {[
            { n: "13 mi", t: "de microempreendedores individuais ativos no Brasil no início de 2026" },
            { n: "78%", t: "de todas as empresas abertas no país em 2026 são MEI" },
            { n: "de casa", t: "foi de onde a maioria dos negócios pequenos começou" },
          ].map((s) => (
            <View key={s.t} style={{ alignItems: "center", maxWidth: 240, gap: space[1] }}>
              <Text style={{ ...type.display, fontSize: compact ? 30 : 40, color: color.action.primaryHover }}>{s.n}</Text>
              <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center" }}>{s.t}</Text>
            </View>
          ))}
        </View>
        <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[2] }}>
          Fonte: Agência Sebrae de Notícias, mai/2026 — os números completos estão no guia.
        </Text>
      </View>
    </Secao>
  );
}

function PonteSerDono({ compact }: { compact: boolean }) {
  return (
    <Secao compact={compact} dark>
      <View style={{ flexDirection: compact ? "column" : "row", alignItems: "center", gap: compact ? space[8] : space[12] }}>
        <View style={{ alignItems: "center" }}>
          <MaryAvatar pose="jornada" size={compact ? 160 : 200} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[2] }}>DEPOIS DO GUIA</Text>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 24 : 32,
              lineHeight: compact ? 32 : 40,
              color: color.text.onBrand,
              marginBottom: space[4],
            }}
          >
            O guia te mostra o caminho. O Ser Dono caminha com você.
          </Text>
          <Text style={{ ...type.bodyLg, color: "#C7D3E3", marginBottom: space[4], maxWidth: 520 }}>
            Sou a Mary, mentora do Ser Dono. Depois que você ler o guia, eu te acompanho de verdade:
            descobrimos seu ramo, validamos a ideia, criamos o nome, a marca e o preço — uma etapa por
            vez, sem jargão. Você começa de graça, do jeitinho que dá.
          </Text>
          <Text style={{ ...type.bodyStrong, color: color.action.primary }}>
            Baixe o guia primeiro — o convite pra jornada está na última página.
          </Text>
        </View>
      </View>
    </Secao>
  );
}

function CtaFinal({ compact, onCta }: { compact: boolean; onCta: () => void }) {
  return (
    <View
      style={{
        backgroundColor: color.action.primarySubtle,
        paddingHorizontal: compact ? space[4] : space[10],
        paddingVertical: compact ? space[10] : space[16],
      }}
    >
      <View style={{ maxWidth: 720, width: "100%", alignSelf: "center", alignItems: "center", gap: space[5] }}>
        <Text
          style={{
            ...type.display,
            fontSize: compact ? 26 : 36,
            lineHeight: compact ? 34 : 44,
            color: color.text.primary,
            textAlign: "center",
          }}
        >
          Pega o seu guia antes que a versão gratuita saia do ar
        </Text>
        <EbookCountdown compact={compact} />
        <Button label="Baixar o guia grátis agora →" variant="primary" onPress={onCta} />
        <Text style={{ ...type.caption, color: color.text.secondary, textAlign: "center" }}>
          É só responder 5 perguntas rápidas e informar seu e-mail. O download abre na hora.
        </Text>
      </View>
    </View>
  );
}

function Rodape({ compact }: { compact: boolean }) {
  const router = useRouter();
  return (
    <View
      style={{
        backgroundColor: color.bg.brand,
        paddingVertical: space[6],
        paddingHorizontal: compact ? space[4] : space[10],
      }}
    >
      <View
        style={{
          maxWidth: content.maxWidthWide,
          width: "100%",
          alignSelf: "center",
          flexDirection: compact ? "column" : "row",
          justifyContent: "space-between",
          alignItems: compact ? "flex-start" : "center",
          gap: space[2],
        }}
      >
        <Text style={{ ...type.caption, color: "#8FA3BC" }}>© 2026 Ser Dono · serdono.com.br</Text>
        <View style={{ flexDirection: "row", gap: space[4] }}>
          <Pressable onPress={() => router.push("/termos")}>
            <Text style={{ ...type.caption, color: "#8FA3BC" }}>Termos</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/privacidade")}>
            <Text style={{ ...type.caption, color: "#8FA3BC" }}>Privacidade</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/lgpd")}>
            <Text style={{ ...type.caption, color: "#8FA3BC" }}>LGPD</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
