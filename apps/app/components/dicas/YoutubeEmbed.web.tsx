import { View } from "react-native";
import { radius } from "@serdono/ui";
import { extractYoutubeId } from "./youtubeId";

/**
 * Player de YouTube embutido — variante web (SDD-59, DS-22).
 *
 * Arquivo separado do `.native.tsx` por extensão de plataforma: o Metro/
 * Expo resolve automaticamente qual dos dois entra no bundle de cada alvo.
 * `react-native-webview` não tem suporte a web — importá-lo aqui quebraria o
 * build; a web usa `<iframe>` puro, que o `react-native-web` deixa passar
 * direto como elemento HTML.
 */
export function YoutubeEmbed({ url }: { url: string }) {
  const id = extractYoutubeId(url);
  if (!id) return null;

  return (
    <View style={{ aspectRatio: 16 / 9, borderRadius: radius.md, overflow: "hidden" }}>
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        style={{ width: "100%", height: "100%", border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Vídeo"
      />
    </View>
  );
}
