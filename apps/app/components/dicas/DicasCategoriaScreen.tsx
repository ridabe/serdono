import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, CollapsibleSection, Input, SECTION_ACCENT_CYCLE, color, radius, space, type } from "@serdono/ui";
import { MATERIAL_NIVEL_LABEL, type DicasMaterial, type MaterialNivel } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { LinkIcon, PdfIcon, PlayIcon } from "./DicasIcons";
import { YoutubeEmbed } from "./YoutubeEmbed";
import { useDicasCategoria } from "./useDicasCategoria";

/**
 * "Dicas da Mary" — nível 2 (SDD-60): assuntos (materiais) de uma categoria.
 * Sempre pode ter mais de um assunto por categoria — a lista não assume 1:1.
 *
 * **Ajustes (pedido do dono do produto, 10/08/2026):**
 * - Botão de voltar pras categorias agora aparece nas duas plataformas
 *   (`links`, não `webLinks`) — sumia no app instalado.
 * - Cada material vira sanfona fechada — evita a tela ficar longa demais
 *   quando o catálogo crescer.
 * - Campo de busca filtra por título/descrição em tempo real.
 * - Vídeo do YouTube toca num popup dentro do próprio app (`VideoModal`),
 *   não mais abrindo o navegador externo.
 */
export function DicasCategoriaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = useDicasCategoria(id);
  const [busca, setBusca] = useState("");

  const materiaisFiltrados = useMemo(() => {
    const materiais = v.categoria?.materiais ?? [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return materiais;
    return materiais.filter(
      (m) => m.titulo.toLowerCase().includes(termo) || (m.descricao ?? "").toLowerCase().includes(termo)
    );
  }, [v.categoria, busca]);

  if (v.loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader links={[{ label: "← Categorias", onPress: () => router.push("/dicas-da-mary") }]} />

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
              <>
                {/* Só aparece com 2+ materiais — com 1 só, buscar dentro dele não ajuda em nada. */}
                {v.categoria.materiais.length > 1 ? (
                  <Input label="Buscar" value={busca} onChangeText={setBusca} placeholder="Título ou conteúdo do material" />
                ) : null}

                {materiaisFiltrados.length === 0 ? (
                  <Text style={{ ...type.body, color: color.text.muted, textAlign: "center" }}>
                    Nada encontrado pra "{busca}".
                  </Text>
                ) : (
                  <View style={{ gap: space[3] }}>
                    {materiaisFiltrados.map((material, i) => (
                      <CollapsibleSection
                        key={material.id}
                        title={material.titulo}
                        accent={SECTION_ACCENT_CYCLE[i % SECTION_ACCENT_CYCLE.length]}
                        rightLabel={material.nivel ? MATERIAL_NIVEL_LABEL[material.nivel as MaterialNivel] : undefined}
                      >
                        <MaterialConteudo material={material} />
                      </CollapsibleSection>
                    ))}
                  </View>
                )}
              </>
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

function MaterialConteudo({ material }: { material: DicasMaterial }) {
  const temMidia = material.arquivo_url || material.video_url || material.link_externo_url;
  const [videoAberto, setVideoAberto] = useState(false);

  return (
    <View>
      {material.descricao ? <Text style={{ ...type.body, color: color.text.secondary }}>{material.descricao}</Text> : null}

      {temMidia ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] }}>
          {material.arquivo_url ? <TipoBadge icon={<PdfIcon color={color.text.muted} />} label="PDF" /> : null}
          {material.video_url ? <TipoBadge icon={<PlayIcon color={color.text.muted} />} label="Vídeo" /> : null}
          {material.link_externo_url ? <TipoBadge icon={<LinkIcon color={color.text.muted} />} label="Link externo" /> : null}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] }}>
        {material.video_url ? (
          <Button label="Assistir vídeo" variant="primary" size="sm" onPress={() => setVideoAberto(true)} />
        ) : null}
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

      {material.video_url ? (
        <VideoModal visible={videoAberto} url={material.video_url} onClose={() => setVideoAberto(false)} />
      ) : null}
    </View>
  );
}

/**
 * Player de vídeo em popup (pedido do dono do produto, 10/08/2026: "assistir
 * no YouTube" abria o navegador e dava a sensação de sair do app). Mesmo
 * componente `YoutubeEmbed` de antes (iframe na web, `WebView` no nativo),
 * só que agora dentro de um `Modal` — o usuário nunca perde o app de vista.
 * Link "Abrir no YouTube" continua disponível dentro do popup, pra quem
 * preferir (ou pro raro caso de vídeo com incorporação desativada pelo
 * autor, que nenhum player embutido consegue contornar).
 */
function VideoModal({ visible, url, onClose }: { visible: boolean; url: string; onClose: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar vídeo"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(17, 24, 39, 0.85)", alignItems: "center", justifyContent: "center", padding: space[5] }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480 }}>
          <View style={{ backgroundColor: color.bg.surface, borderRadius: radius.lg, padding: space[4], gap: space[3] }}>
            <View style={{ borderRadius: radius.md, overflow: "hidden" }}>{visible ? <YoutubeEmbed url={url} /> : null}</View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Button label="Abrir no YouTube ↗" variant="ghost" size="sm" onPress={() => WebBrowser.openBrowserAsync(url)} />
              <Button label="Fechar" variant="outline" size="sm" onPress={onClose} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
