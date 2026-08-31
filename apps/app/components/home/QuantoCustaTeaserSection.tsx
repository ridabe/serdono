import React from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";
import { color, content, radius, space, type } from "@serdono/ui";
import { nichos, formatBRL } from "../../data/quantoCusta";

/**
 * Teaser da Home para /quanto-custa (SDD-93, docs/SPEC.md) — três ramos como
 * amostra, com link real (`<Link>`, não `router.push` num Pressable) tanto
 * aqui quanto na página de índice: é o caminho de rastreamento que faz o
 * Google encontrar todas as páginas de detalhe a partir da home pública.
 */
const AMOSTRA_SLUGS = ["bolo-de-pote", "cuidador-de-idosos", "servicos-domiciliares"];

export function QuantoCustaTeaserSection({ compact }: { compact: boolean }) {
  const amostra = AMOSTRA_SLUGS.map((slug) => nichos.find((n) => n.slug === slug)).filter(
    (n): n is NonNullable<typeof n> => Boolean(n)
  );

  return (
    <View
      style={{
        backgroundColor: color.bg.surfaceAlt,
        paddingVertical: compact ? space[10] : space[16],
        paddingHorizontal: compact ? space[4] : space[10],
      }}
    >
      <View style={{ maxWidth: content.maxWidthWide, width: "100%", alignSelf: "center" }}>
        <Text style={[type.overline, { color: color.action.primaryHover, marginBottom: space[2] }]}>
          ANTES DE ABRIR
        </Text>
        <Text style={[type.display, { color: color.text.primary, marginBottom: space[2] }]}>
          Quanto custa abrir o seu negócio?
        </Text>
        <Text
          style={[
            type.bodyLg,
            { color: color.text.secondary, marginBottom: space[6], maxWidth: 620 },
          ]}
        >
          {nichos.length} ramos com investimento, tempo até o equilíbrio e margem típica — sempre com
          fonte e data.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4], marginBottom: space[6] }}>
          {amostra.map((n) => (
            <Link key={n.slug} href={`/quanto-custa/${n.slug}`} style={{ flexGrow: 1, minWidth: 220 }}>
              <View
                style={{
                  backgroundColor: color.bg.surface,
                  borderWidth: 1,
                  borderColor: color.border.default,
                  borderRadius: radius.lg,
                  padding: space[4],
                }}
              >
                <Text style={[type.h2, { color: color.text.primary }]}>{n.nome}</Text>
                <Text style={[type.bodyStrong, { color: color.action.secondary, marginTop: space[1] }]}>
                  {formatBRL(n.investimentoMin)} – {formatBRL(n.investimentoMax)}
                </Text>
              </View>
            </Link>
          ))}
        </View>

        <Link href="/quanto-custa">
          <Text style={[type.bodyStrong, { color: color.action.secondary }]}>
            Ver os {nichos.length} ramos completos →
          </Text>
        </Link>
      </View>
    </View>
  );
}
