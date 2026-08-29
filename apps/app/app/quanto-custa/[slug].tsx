import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { color, radius, space, type } from "@serdono/ui";
import { QuantoCustaLayout } from "../../components/quantoCusta/QuantoCustaLayout";
import { nichos, getNicho, formatBRL, formatFonteData, concorrenciaLabel } from "../../data/quantoCusta";

// Página de detalhe de um ramo (SDD-93, docs/SPEC.md). `generateStaticParams`
// roda em build time (expo export --platform web, output: "static") e gera
// um arquivo HTML próprio por nicho — é isso que faz o Google indexar cada
// ramo como página separada, não uma única SPA vazia.
export function generateStaticParams() {
  return nichos.map((n) => ({ slug: n.slug }));
}

export default function QuantoCustaDetalhe() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const nicho = getNicho(String(slug));

  if (!nicho) {
    return (
      <QuantoCustaLayout>
        <Text style={type.h1}>Não achamos esse ramo.</Text>
        <Text style={type.body}>Veja a lista completa em /quanto-custa.</Text>
      </QuantoCustaLayout>
    );
  }

  const title = `Quanto custa abrir ${articuloPara(nicho.nome)}? | Ser Dono`;
  const description = `${nicho.nome}: investimento de ${formatBRL(nicho.investimentoMin)} a ${formatBRL(
    nicho.investimentoMax
  )}, ${nicho.tempoEquilibrioMeses ?? "poucos"} meses até o equilíbrio e margem típica de ${
    nicho.margemTipicaPct ?? "?"
  }%. Fonte: ${nicho.fonte}.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
      </Head>
      <QuantoCustaLayout>
        <Text style={[type.overline, styles.categoria]}>{nicho.categoria.toUpperCase()}</Text>
        <Text style={[type.display, styles.h1]}>Quanto custa abrir {articuloPara(nicho.nome).toLowerCase()}</Text>

        <View style={styles.statGrid}>
          <Stat label="Investimento inicial" value={`${formatBRL(nicho.investimentoMin)} – ${formatBRL(nicho.investimentoMax)}`} />
          {nicho.tempoEquilibrioMeses ? (
            <Stat label="Tempo até o equilíbrio" value={`${nicho.tempoEquilibrioMeses} meses`} />
          ) : null}
          {nicho.margemTipicaPct != null ? (
            <Stat label="Margem típica" value={`${nicho.margemTipicaPct}%`} />
          ) : null}
          <Stat label="Concorrência" value={concorrenciaLabel(nicho.nivelConcorrencia)} />
          <Stat
            label="Depende de ponto físico"
            value={nicho.dependenciaPontoFisico ? "Sim" : "Não necessariamente"}
          />
        </View>

        {nicho.perfilCliente ? (
          <View style={styles.section}>
            <Text style={[type.h2, styles.sectionTitle]}>Quem costuma comprar</Text>
            <Text style={[type.bodyLg, styles.sectionBody]}>{nicho.perfilCliente}</Text>
          </View>
        ) : null}

        <View style={styles.fonteBox}>
          <Text style={[type.caption, styles.fonteLabel]}>FONTE E DATA (RN-20)</Text>
          <Text style={[type.body, styles.fonteTexto]}>
            {nicho.fonte}
            {nicho.fonteData ? ` · ${formatFonteData(nicho.fonteData)}` : ""}
          </Text>
          <Text style={[type.caption, styles.fonteAviso]}>
            Faixa de referência de mercado geral, não um valor fechado de contrato — o ponto de partida
            real para planejar, não uma garantia.
          </Text>
        </View>
      </QuantoCustaLayout>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[type.caption, styles.statLabel]}>{label.toUpperCase()}</Text>
      <Text style={[type.h1, styles.statValue]}>{value}</Text>
    </View>
  );
}

/** "abrir uma barbearia" / "abrir um food truck" — sem tentar adivinhar género por sufixo,
 * usa "um(a) negócio de" como fallback neutro só quando o nome começa com maiúscula composta rara. */
function articuloPara(nome: string): string {
  const FEMININOS = ["a", "ção", "agem", "ncia", "eza"];
  const primeira = nome.split(" ")[0].toLowerCase();
  const feminino = FEMININOS.some((suf) => primeira.endsWith(suf));
  return `${feminino ? "uma" : "um"} ${nome}`;
}

const styles = StyleSheet.create({
  categoria: { color: color.action.primaryHover, marginBottom: space[1] },
  h1: { color: color.text.primary, marginBottom: space[5] },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: space[3], marginBottom: space[6] },
  stat: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    padding: space[4],
    minWidth: 160,
    flexGrow: 1,
  },
  statLabel: { color: color.text.muted, marginBottom: space[1] },
  statValue: { color: color.text.primary },
  section: { marginBottom: space[6] },
  sectionTitle: { color: color.text.primary, marginBottom: space[2] },
  sectionBody: { color: color.text.secondary },
  fonteBox: {
    backgroundColor: color.action.primarySubtle,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[1],
  },
  fonteLabel: { color: color.text.secondary },
  fonteTexto: { color: color.text.primary },
  fonteAviso: { color: color.text.secondary, marginTop: space[2] },
});
