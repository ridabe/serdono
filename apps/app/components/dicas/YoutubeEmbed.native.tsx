import { View } from "react-native";
import WebView from "react-native-webview";
import { radius } from "@serdono/ui";
import { extractYoutubeId } from "./youtubeId";

/**
 * Player de YouTube embutido — variante nativa (SDD-59, DS-22).
 * Ver `YoutubeEmbed.web.tsx` para a explicação do split por plataforma.
 */
export function YoutubeEmbed({ url }: { url: string }) {
  const id = extractYoutubeId(url);
  if (!id) return null;

  return (
    <View style={{ aspectRatio: 16 / 9, borderRadius: radius.md, overflow: "hidden" }}>
      <WebView source={{ uri: `https://www.youtube.com/embed/${id}` }} allowsFullscreenVideo javaScriptEnabled />
    </View>
  );
}
