import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import WebView from "react-native-webview";
import { color, radius, space, type } from "@serdono/ui";
import { extractYoutubeId } from "./youtubeId";

/**
 * Player de YouTube embutido — variante nativa (SDD-59, DS-22).
 * Ver `YoutubeEmbed.web.tsx` para a explicação do split por plataforma.
 *
 * **Props extras (pedido do dono do produto, 10/08/2026 — "erro no
 * player"):** `allowsInlineMediaPlayback` + `mediaPlaybackRequiresUserAction={false}`
 * evitam que o vídeo tente abrir em tela cheia sozinho dentro do popup (onde
 * não tem pra onde ir) — sem eles, o WebView em alguns Android tenta um modo
 * de vídeo que trava com a tela em branco. `domStorageEnabled` porque a
 * própria página de embed do YouTube depende de `localStorage`. `onError`
 * mostra uma mensagem clara em vez de deixar a tela em branco travada.
 *
 * **Causa real do Erro 153 no nativo, achada testando no Expo Go em
 * 10/08/2026:** não era o domínio `-nocookie` nem cookie de terceiro — o
 * `WebView` carregava a URL de embed como página de TOPO (`source: { uri }`
 * navega pra ela direto, `window.top === window.self`). O player do YouTube
 * detecta isso e recusa como "configuração inválida": embed é feito pra
 * viver DENTRO de um `<iframe>` numa página de terceiro, nunca como
 * documento principal. A variante web sempre esteve certa por acidente —
 * usa um `<iframe>` de verdade dentro da nossa própria página. A correção
 * aqui é replicar a mesma relação pai/filho: o `WebView` carrega uma
 * páginazinha HTML nossa (via `source.html`, não `source.uri`) que por sua
 * vez tem um `<iframe>` apontando pro embed do YouTube — agora
 * `window.top !== window.self` de dentro do player, igual a web.
 */
export function YoutubeEmbed({ url }: { url: string }) {
  const id = extractYoutubeId(url);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);

  if (!id) return null;

  if (erro) {
    return (
      <View style={{ aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: color.bg.surfaceAlt, alignItems: "center", justifyContent: "center", padding: space[4] }}>
        <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center" }}>
          Não consegui carregar o vídeo aqui. Tente "Abrir no YouTube" abaixo.
        </Text>
      </View>
    );
  }

  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" /><style>*{margin:0;padding:0}html,body{height:100%;background:#000}iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}</style></head><body><iframe src="https://www.youtube-nocookie.com/embed/${id}?playsinline=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></body></html>`;

  return (
    <View style={{ aspectRatio: 16 / 9, borderRadius: radius.md, overflow: "hidden" }}>
      <WebView
        source={{ html, baseUrl: "https://www.youtube-nocookie.com" }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        onError={() => setErro(true)}
        onHttpError={() => setErro(true)}
        onLoadEnd={() => setCarregando(false)}
        startInLoadingState={false}
      />
      {carregando ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.surfaceAlt }}>
          <ActivityIndicator color={color.bg.brand} />
        </View>
      ) : null}
    </View>
  );
}
