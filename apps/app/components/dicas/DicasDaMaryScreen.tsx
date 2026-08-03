import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Linking, Platform, ScrollView, Text, View } from "react-native";
import { Button, Card, CollapsibleSection, SECTION_ACCENT_CYCLE, color, radius, space, type } from "@serdono/ui";
import { MATERIAL_NIVEL_LABEL, type DicasMaterial, type MaterialNivel } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { YoutubeEmbed } from "./YoutubeEmbed";
import { useDicasDaMary } from "./useDicasDaMary";

/**
 * Hub "Dicas da Mary" (PRD §12.7, SPEC.md SDD-59) — livre a todo usuário
 * autenticado, sem gate de módulo/plano (RN-34). Navegação por categoria,
 * não feed cronológico (pedido explícito do dono do produto: "não deverá
 * ser em formato de blog").
 */
export function DicasDaMaryScreen() {
  const router = useRouter();
  const v = useDicasDaMary();

  if (v.loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Voltar ao painel", onPress: () => router.push("/inicio") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary }}>Dicas da Mary</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
            Separei material por tema pra você estudar no seu ritmo — vídeo, PDF pra baixar e links que valem a pena,
            tudo num lugar só.
          </Text>
        </View>

        {v.error ? (
          <Card variant="outline" padding={4}>
            <Text style={{ ...type.body, color: color.state.danger }}>Não consegui carregar agora: {v.error}</Text>
          </Card>
        ) : v.categorias.length === 0 ? (
          <Card variant="outline" padding={6}>
            <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center" }}>
              Ainda estou preparando o primeiro material. Assim que publicar, ele aparece aqui.
            </Text>
          </Card>
        ) : (
          v.categorias.map((categoria, i) => (
            <CollapsibleSection
              key={categoria.id}
              title={categoria.titulo}
              accent={SECTION_ACCENT_CYCLE[i % SECTION_ACCENT_CYCLE.length]}
              rightLabel={`${categoria.materiais.length}`}
              defaultExpanded={i === 0}
            >
              <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
                {categoria.descricao}
              </Text>
              {categoria.materiais.length === 0 ? (
                <Text style={{ ...type.caption, color: color.text.muted }}>Nenhum material publicado ainda nesta categoria.</Text>
              ) : (
                <View style={{ gap: space[4] }}>
                  {categoria.materiais.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </View>
              )}
            </CollapsibleSection>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function abrirPdf(url: string) {
  if (Platform.OS === "web") {
    window.open(url, "_blank");
  } else {
    Linking.openURL(url);
  }
}

function MaterialCard({ material }: { material: DicasMaterial }) {
  return (
    <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{material.titulo}</Text>
      {material.descricao ? (
        <Text style={{ ...type.body, color: color.text.secondary, marginTop: 2 }}>{material.descricao}</Text>
      ) : null}
      {material.nivel ? (
        <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>
          {MATERIAL_NIVEL_LABEL[material.nivel as MaterialNivel]}
        </Text>
      ) : null}

      {material.video_url ? (
        <View style={{ marginTop: space[3] }}>
          <YoutubeEmbed url={material.video_url} />
        </View>
      ) : null}

      {material.arquivo_url || material.link_externo_url ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] }}>
          {material.arquivo_url ? (
            <Button
              label={material.arquivo_nome ? `Baixar ${material.arquivo_nome}` : "Baixar PDF"}
              variant="outline"
              size="sm"
              onPress={() => abrirPdf(material.arquivo_url!)}
            />
          ) : null}
          {material.link_externo_url ? (
            <Button
              label={material.link_externo_label || "Ver link"}
              variant="ghost"
              size="sm"
              onPress={() => WebBrowser.openBrowserAsync(material.link_externo_url!)}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
