import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { breakpoint, Button, Card, color, icon, radius, space, type } from "@serdono/ui";
import { classificarContato, normalizarUrlSite } from "@serdono/core";
import { signOut, type FornecedorParceiro } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { useParceiros } from "./useParceiros";

/**
 * Módulo Parceiros e Fornecedores (pedido do dono do produto, 08/08/2026) —
 * mesma base de dados da Fase 8 da Jornada (`fornecedores_parceiros`,
 * SDD-41), agora numa tela própria no catálogo de módulos, sem gate de fase
 * nem de nicho: lista completa, com filtro por categoria.
 */
export function ParceirosScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < breakpoint.medium;
  const v = useParceiros();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[
          { label: "← Painel", onPress: () => router.push("/inicio") },
          { label: "Módulos", onPress: () => router.push("/modulos") },
          { label: "Sair", onPress: handleSignOut },
        ]}
      />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Parceiros e Fornecedores</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Nossa base de parceiros recomendados — filtre por categoria e fale direto com quem você escolher.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : v.categorias.length === 0 ? (
          <Card variant="outline" padding={5}>
            <Text style={{ ...type.body, color: color.text.muted }}>Nenhum parceiro cadastrado ainda.</Text>
          </Card>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
              <Button
                label="Todos"
                variant={v.categoriaSelecionada === null ? "primary" : "outline"}
                size="sm"
                onPress={() => v.setCategoriaSelecionada(null)}
              />
              {v.categorias.map((categoria) => (
                <Button
                  key={categoria}
                  label={categoria}
                  variant={v.categoriaSelecionada === categoria ? "primary" : "outline"}
                  size="sm"
                  onPress={() => v.setCategoriaSelecionada(categoria)}
                />
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
              {v.parceiros.map((parceiro) => (
                <ParceiroCard key={parceiro.id} parceiro={parceiro} compact={compact} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ParceiroCard({ parceiro, compact }: { parceiro: FornecedorParceiro; compact: boolean }) {
  const contato = classificarContato(parceiro.contato);
  const iniciais = parceiro.nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Card variant="default" padding={5} style={{ flexBasis: compact ? "100%" : "47%", flexGrow: 1, minWidth: 260 }}>
      <View style={{ flexDirection: "row", gap: space[3], alignItems: "center", marginBottom: space[3] }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: color.bg.brandSubtle,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {parceiro.logo_url ? (
            <Image source={{ uri: parceiro.logo_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityLabel={`Logo de ${parceiro.nome}`} />
          ) : (
            <Text style={{ ...type.bodyStrong, color: color.bg.brand }}>{iniciais}</Text>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...type.overline, color: color.text.muted }} numberOfLines={1}>
            {parceiro.categoria.toUpperCase()}
          </Text>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
            {parceiro.nome}
          </Text>
        </View>
      </View>

      {parceiro.descricao ? <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>{parceiro.descricao}</Text> : null}

      {parceiro.regiao ? (
        <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>Região: {parceiro.regiao}</Text>
      ) : null}

      <View style={{ gap: space[2] }}>
        {contato ? <ContatoRow contato={contato} /> : null}
        {parceiro.site ? <LinkRow url={normalizarUrlSite(parceiro.site)} /> : null}
      </View>
    </Card>
  );
}

function ContatoRow({ contato }: { contato: NonNullable<ReturnType<typeof classificarContato>> }) {
  const conteudo = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
      {contato.tipo === "email" ? <EmailIcon /> : <PhoneIcon />}
      <Text style={{ ...type.body, color: contato.href ? color.action.secondary : color.text.secondary, flex: 1 }} numberOfLines={1}>
        {contato.exibicao}
      </Text>
    </View>
  );

  if (!contato.href) return conteudo;

  return (
    <Pressable onPress={() => Linking.openURL(contato.href!)} accessibilityRole="link" accessibilityLabel={`Contato: ${contato.exibicao}`}>
      {conteudo}
    </Pressable>
  );
}

function LinkRow({ url }: { url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link" accessibilityLabel={`Abrir site: ${url}`}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
        <LinkIcon />
        <Text style={{ ...type.body, color: color.action.secondary, flex: 1 }} numberOfLines={1}>
          {url.replace(/^https?:\/\//i, "")}
        </Text>
      </View>
    </Pressable>
  );
}

function PhoneIcon() {
  const common = { stroke: color.text.muted, strokeWidth: icon.strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={icon.md} height={icon.md} viewBox="0 0 24 24">
      <Path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2C10.5 19.5 4.5 13.5 4.5 6a2 2 0 0 1 2-2z" {...common} />
    </Svg>
  );
}

function EmailIcon() {
  const common = { stroke: color.text.muted, strokeWidth: icon.strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={icon.md} height={icon.md} viewBox="0 0 24 24">
      <Path d="M4.5 6h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" {...common} />
      <Path d="M4 7l8 6 8-6" {...common} />
    </Svg>
  );
}

function LinkIcon() {
  const common = { stroke: color.action.secondary, strokeWidth: icon.strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={icon.md} height={icon.md} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...common} />
      <Path d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9S9.5 5.5 12 3z" {...common} />
    </Svg>
  );
}
