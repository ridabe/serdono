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
 *
 * **`youtube-nocookie.com` + `origin` (pedido do dono do produto, 10/08/2026
 * — "Erro 153, erro de configuração do player"):** esse erro é o próprio
 * YouTube rejeitando o embed por não conseguir validar a origem da página
 * (cookie de terceiro bloqueado pelo navegador é o gatilho mais comum hoje
 * em dia). O domínio `-nocookie` não depende do cookie de sessão do YouTube
 * pra validar o embed, e passar `origin` explícito (a própria URL do app)
 * é a segunda parte da correção recomendada pelo próprio YouTube pra esse
 * erro específico.
 */
export function YoutubeEmbed({ url }: { url: string }) {
  const id = extractYoutubeId(url);
  if (!id) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const src = `https://www.youtube-nocookie.com/embed/${id}?origin=${encodeURIComponent(origin)}&playsinline=1`;

  return (
    <View style={{ aspectRatio: 16 / 9, borderRadius: radius.md, overflow: "hidden" }}>
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        title="Vídeo"
      />
    </View>
  );
}
