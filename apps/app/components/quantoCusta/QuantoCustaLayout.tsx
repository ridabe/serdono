import React from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Logo, Button, color, radius, space, type } from "@serdono/ui";

/**
 * Casca comum das páginas públicas /quanto-custa/* (SDD-93, docs/SPEC.md).
 * Cabeçalho com o logo e link de volta, rodapé com CTA para o app — mesma
 * linguagem visual da Home (components/home), mas sem depender dela: estas
 * páginas precisam continuar existindo mesmo se a Home mudar de estrutura.
 */
export function QuantoCustaLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Link href="/quanto-custa" style={styles.logoLink}>
          <Logo size={30} />
        </Link>
        <Link href="/">
          <Text style={styles.homeLink}>Ser Dono — o app</Text>
        </Link>
      </View>

      {children}

      <View style={styles.footer}>
        <Text style={[type.h2, styles.footerTitle]}>
          Quer o passo a passo do seu caso, não só o número médio?
        </Text>
        <Text style={[type.body, styles.footerBody]}>
          O app do Ser Dono pega esses dados e monta o seu plano: nicho, capital, região e o que fazer
          primeiro — com a Mary conferindo cada etapa.
        </Text>
        <Button
          label="Baixar o Ser Dono grátis"
          onPress={() => {
            if (Platform.OS === "web") {
              Linking.openURL("https://serdono.com.br");
            }
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.bg.canvas },
  content: { maxWidth: 760, width: "100%", alignSelf: "center", padding: space[5], paddingBottom: space[16] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space[6],
  },
  logoLink: { flexDirection: "row" },
  homeLink: { ...type.bodyStrong, color: color.action.secondary },
  footer: {
    marginTop: space[10],
    backgroundColor: color.bg.brand,
    borderRadius: radius.lg,
    padding: space[6],
    gap: space[3],
  },
  footerTitle: { color: color.text.onBrand },
  footerBody: { color: color.text.onBrand, opacity: 0.85 },
});
