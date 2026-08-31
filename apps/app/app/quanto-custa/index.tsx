import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import Head from "expo-router/head";
import { color, radius, space, type } from "@serdono/ui";
import { QuantoCustaLayout } from "../../components/quantoCusta/QuantoCustaLayout";
import { nichos, formatBRL, concorrenciaLabel } from "../../data/quantoCusta";

// Página pública e estática (SDD-93, docs/SPEC.md) — índice de todos os ramos
// de negócio catalogados, cada um linkando para /quanto-custa/[slug]. É a
// página que o Google indexa para "quanto custa abrir X" e a que os posts
// do Instagram (campanha de divulgação, material-de-apoio/marketing)
// direcionam via link na bio.

const TOTAL = nichos.length;
const TITLE = `Quanto custa abrir um negócio? ${TOTAL} ramos, com número real | Ser Dono`;
const DESCRIPTION =
  `Investimento inicial, tempo até o equilíbrio, margem típica e concorrência de ${TOTAL} ramos de negócio — com fonte Sebrae e data. Descubra quanto custa abrir o seu.`;

export default function QuantoCustaIndex() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
      </Head>
      <QuantoCustaLayout>
        <Text style={[type.display, styles.h1]}>Quanto custa abrir o seu negócio?</Text>
        <Text style={[type.bodyLg, styles.lead]}>
          {TOTAL} ramos — do negócio de casa (bolo de pote, cuidador de pets, designer freelancer) ao
          que precisa de ponto — com investimento inicial, tempo até o equilíbrio e margem típica.
          Cada número com fonte e data, nunca estimativa solta.
        </Text>

        <View style={styles.grid}>
          {nichos.map((n) => (
            <Link key={n.slug} href={`/quanto-custa/${n.slug}`} style={styles.cardLink}>
              <View style={styles.card}>
                <Text style={[type.overline, styles.cardCategoria]}>{n.categoria.toUpperCase()}</Text>
                <Text style={[type.h2, styles.cardNome]}>{n.nome}</Text>
                <Text style={[type.bodyStrong, styles.cardInvest]}>
                  {formatBRL(n.investimentoMin)} – {formatBRL(n.investimentoMax)}
                </Text>
                <View style={styles.cardMetaRow}>
                  {n.tempoEquilibrioMeses ? (
                    <Text style={[type.caption, styles.cardMeta]}>
                      {n.tempoEquilibrioMeses} meses até equilíbrio
                    </Text>
                  ) : null}
                  <Text style={[type.caption, styles.cardMeta]}>
                    Concorrência {concorrenciaLabel(n.nivelConcorrencia).toLowerCase()}
                  </Text>
                </View>
              </View>
            </Link>
          ))}
        </View>
      </QuantoCustaLayout>
    </>
  );
}

const styles = StyleSheet.create({
  h1: { color: color.text.primary, marginBottom: space[2] },
  lead: { color: color.text.secondary, marginBottom: space[6], maxWidth: 620 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space[4] },
  cardLink: { width: "100%", maxWidth: 340, flexGrow: 1 },
  card: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[1],
  },
  cardCategoria: { color: color.action.primaryHover },
  cardNome: { color: color.text.primary },
  cardInvest: { color: color.text.primary, marginTop: space[1] },
  cardMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[2] },
  cardMeta: { color: color.text.muted },
});
