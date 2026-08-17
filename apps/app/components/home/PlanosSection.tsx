import React from "react";
import { useRouter } from "expo-router";
import { Image, Text, View } from "react-native";
import { Button, HoverLift, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

const artePlanoGratuito = require("../../../../img/planos/plano-gratuito.png");
const artePlanoEssencial = require("../../../../img/planos/plano-essencial.png");
const artePlanoMaster = require("../../../../img/planos/plano-master.png");

/**
 * Seção "Planos" da landing (pedido do dono do produto, 17/08/2026).
 *
 * As 3 artes (`img/planos/`) são as mesmas capas usadas no checkout da
 * AbacatePay (docs/identidade-visual/planos) — mesma fonte visual em
 * qualquer lugar que mostre plano, redimensionadas aqui (~70-90KB cada,
 * via `sharp`, contra ~1,9MB do original 2x) pra não pesar a home.
 *
 * **Todo botão leva pro "Começar grátis" (pedido explícito), nunca direto
 * pro checkout** — mesmo nos cards Essencial/Master. A landing é a porta de
 * entrada de quem ainda não é usuário; o caminho pra conhecer o produto é
 * sempre o diagnóstico gratuito primeiro, nunca pular direto pra pagar sem
 * ter visto a ferramenta funcionando. Quem já é assinante e quer trocar de
 * plano faz isso pela tela `/planos` (autenticada), não por aqui.
 */
const planos = [
  { slug: "gratuito", arte: artePlanoGratuito },
  { slug: "essencial", arte: artePlanoEssencial },
  { slug: "master", arte: artePlanoMaster },
];

export function PlanosSection({ compact }: { compact: boolean }) {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: color.bg.surface,
        paddingVertical: compact ? space[10] : space[16],
        paddingHorizontal: compact ? space[4] : space[10],
      }}
    >
      <View style={{ maxWidth: content.maxWidthWide, width: "100%", alignSelf: "center" }}>
        <Reveal>
          <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>PLANOS</Text>
          <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[3] }}>Comece de graça, hoje</Text>
          <Text style={{ ...type.bodyLg, color: color.text.secondary, maxWidth: 620, marginBottom: space[10] }}>
            Você não precisa decidir nada agora. Comece grátis, conheça a Mary e as ferramentas de verdade — assine
            só quando fizer sentido pro seu momento.
          </Text>
        </Reveal>

        <View style={{ flexDirection: compact ? "column" : "row", flexWrap: compact ? "nowrap" : "wrap", gap: space[4] }}>
          {planos.map((plano, i) => (
            <Reveal
              key={plano.slug}
              delay={motion.revealStagger * (i + 1)}
              style={compact ? { width: "100%" } : { flexBasis: "31%", flexGrow: 1, minWidth: 300 }}
            >
              <HoverLift
                style={{
                  backgroundColor: color.bg.canvas,
                  borderRadius: radius.lg,
                  overflow: "hidden",
                  height: "100%",
                  shadowColor: "#111827",
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                }}
              >
                <View style={{ width: "100%", aspectRatio: 1200 / 630, overflow: "hidden" }}>
                  <Image source={plano.arte} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                </View>
                <View style={{ padding: space[5] }}>
                  <Button label="Começar grátis" variant="primary" fullWidth onPress={() => router.push("/diagnostico")} />
                </View>
              </HoverLift>
            </Reveal>
          ))}
        </View>

        <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[6], textAlign: compact ? "left" : "center" }}>
          Sem cartão pra começar. Preços de lançamento válidos nos 6 primeiros meses de assinatura.
        </Text>
      </View>
    </View>
  );
}
