import { useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Linking, Platform, ScrollView, Text, View } from "react-native";
import { Button, Card, color, radius, space, type } from "@serdono/ui";
import { MATERIAL_NIVEL_LABEL, type DicasMaterial, type MaterialNivel } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { LinkIcon, PdfIcon, PlayIcon } from "./DicasIcons";
import { YoutubeEmbed } from "./YoutubeEmbed";
import { useDicasCategoria } from "./useDicasCategoria";

// Tamanho fixo do player embutido (SDD-60) — antes ele esticava pra largura
// inteira do card, igual um embed cru do YouTube, e dominava a tela. Um
// tamanho de "miniatura com controles" deixa espaço pra descrição e ações
// sem esconder que ali tem vídeo.
const VIDEO_WIDTH = 240;
const VIDEO_HEIGHT = (VIDEO_WIDTH * 9) / 16;

/**
 * "Dicas da Mary" — nível 2 (SDD-60): assuntos (materiais) de uma categoria.
 * Sempre pode ter mais de um assunto por categoria — a lista não assume 1:1.
 */
export function DicasCategoriaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = useDicasCategoria(id);

  if (v.loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Categorias", onPress: () => router.push("/dicas-da-mary") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        {v.error ? (
          <Card variant="outline" padding={4}>
            <Text style={{ ...type.body, color: color.state.danger }}>Não consegui carregar agora: {v.error}</Text>
          </Card>
        ) : !v.categoria ? (
          <Card variant="outline" padding={6}>
            <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center" }}>
              Não encontrei essa categoria — pode ter sido despublicada. Volte pra lista e escolha outra.
            </Text>
          </Card>
        ) : (
          <>
            <View>
              <Text style={{ ...type.h1, color: color.text.primary }}>{v.categoria.titulo}</Text>
              <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
                {v.categoria.descricao}
              </Text>
            </View>

            {v.categoria.materiais.length === 0 ? (
              <Card variant="outline" padding={6}>
                <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center" }}>
                  Nenhum material publicado ainda nesta categoria.
                </Text>
              </Card>
            ) : (
              <View style={{ gap: space[4] }}>
                {v.categoria.materiais.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function abrirArquivo(url: string) {
  if (Platform.OS === "web") {
    window.open(url, "_blank");
  } else {
    Linking.openURL(url);
  }
}

function TipoBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: color.bg.surfaceAlt,
        borderRadius: radius.full,
        paddingHorizontal: space[2],
        paddingVertical: 3,
      }}
    >
      {icon}
      <Text style={{ ...type.caption, color: color.text.secondary }}>{label}</Text>
    </View>
  );
}

function MaterialCard({ material }: { material: DicasMaterial }) {
  const temMidia = material.arquivo_url || material.video_url || material.link_externo_url;

  return (
    <Card variant="default" padding={5}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space[3] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, flex: 1 }}>{material.titulo}</Text>
        {material.nivel ? (
          <View style={{ backgroundColor: color.action.primarySubtle, borderRadius: radius.full, paddingHorizontal: space[2], paddingVertical: 3 }}>
            <Text style={{ ...type.caption, color: "#8A5B06", fontWeight: "700" }}>
              {MATERIAL_NIVEL_LABEL[material.nivel as MaterialNivel]}
            </Text>
          </View>
        ) : null}
      </View>

      {material.descricao ? (
        <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>{material.descricao}</Text>
      ) : null}

      {temMidia ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] }}>
          {material.arquivo_url ? <TipoBadge icon={<PdfIcon color={color.text.muted} />} label="PDF" /> : null}
          {material.video_url ? <TipoBadge icon={<PlayIcon color={color.text.muted} />} label="Vídeo" /> : null}
          {material.link_externo_url ? <TipoBadge icon={<LinkIcon color={color.text.muted} />} label="Link externo" /> : null}
        </View>
      ) : null}

      {material.video_url ? (
        <View style={{ marginTop: space[4] }}>
          {/* Player pequeno, não a largura inteira do card — antes ficava
              idêntico a um embed cru do YouTube e tomava a tela toda. */}
          <View style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT, borderRadius: radius.md, overflow: "hidden" }}>
            <YoutubeEmbed url={material.video_url} />
          </View>
          <Button
            label="Assistir no YouTube ↗"
            variant="ghost"
            size="sm"
            onPress={() => WebBrowser.openBrowserAsync(material.video_url!)}
            style={{ alignSelf: "flex-start", marginTop: space[2] }}
          />
        </View>
      ) : null}

      {material.arquivo_url || material.link_externo_url ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] }}>
          {material.arquivo_url ? (
            <Button
              label={material.arquivo_nome ? `Baixar ${material.arquivo_nome}` : "Baixar PDF"}
              variant="outline"
              size="sm"
              onPress={() => abrirArquivo(material.arquivo_url!)}
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
    </Card>
  );
}
