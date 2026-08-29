import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { color, isWebPlatform, radius, space, type } from "@serdono/ui";
import { getCurrentSession, isAnonymousSession, supabase } from "@serdono/supabase";

// Mesma cor que o dono do produto configurou no painel da Linkminer
// (`data-color` do script de embed original) — reaproveitada aqui pro botão
// próprio ficar consistente com a marca que ele já escolheu lá.
const COR_LINKMINER = "#2A2F35";

/**
 * Botão "Fale conosco" (Linkminer, pedido do dono do produto, 28/08/2026) —
 * variante WEB, só existe em páginas PÚBLICAS (ver `LinkminerButton.native.tsx`
 * pro app instalado, sempre `null`).
 *
 * **Histórico da decisão:** a primeira versão usava o script de embed deles
 * (`<script data-mode="bubble">`), que desenha a própria bolha flutuante —
 * ficou sobreposta ao banner "baixe o app" (`InstallAppPrompt.tsx`), os dois
 * disputando o mesmo canto inferior. A Linkminer também oferece um `<iframe>`
 * com o formulário puro (sem bolha própria) — decisão fechada com o dono do
 * produto via `AskUserQuestion`: manter um botão flutuante NOSSO (mesmo
 * lugar de sempre, fácil de achar em qualquer página pública) que abre esse
 * iframe dentro de um modal, em vez de deixar a bolha deles se desenhar
 * sozinha sem nosso controle de posição.
 *
 * `bottomOffset` (do `_layout.tsx`, medido de verdade em `InstallAppPrompt`
 * via `onLayout`) resolve a sobreposição: o botão sobe a altura exata do
 * banner quando ele está visível, e volta pro canto normal quando não está.
 *
 * `<iframe>` puro, mesmo padrão de `dicas/YoutubeEmbed.web.tsx` — só existe
 * no arquivo `.web.tsx` porque não é um elemento React Native de verdade,
 * `react-native-web` deixa passar direto como HTML.
 */
export function LinkminerButton({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const [publico, setPublico] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!isWebPlatform) return;
    let active = true;

    async function checar() {
      const session = await getCurrentSession();
      if (!active) return;
      setPublico(!session || isAnonymousSession(session));
    }

    checar();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => checar());
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (!isWebPlatform || !publico) return null;

  return (
    <>
      {/* `position: "fixed"` não existe no tipo de `ViewStyle` do React Native
          — `as any` de propósito, mesmo padrão já usado em `InstallAppPrompt.tsx`. */}
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel="Fale conosco"
        style={
          {
            position: "fixed",
            right: space[5],
            bottom: space[5] + bottomOffset,
            zIndex: 999,
            backgroundColor: COR_LINKMINER,
            borderRadius: radius.full,
            paddingHorizontal: space[4],
            paddingVertical: space[3],
            flexDirection: "row",
            alignItems: "center",
            gap: space[2],
            shadowColor: "#000000",
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          } as any
        }
      >
        <Text style={{ fontSize: 16 }}>💬</Text>
        <Text style={{ ...type.bodyStrong, color: "#FFFFFF" }}>Fale conosco</Text>
      </Pressable>

      <Modal transparent visible={aberto} animationType="fade" onRequestClose={() => setAberto(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(17, 24, 39, 0.6)", alignItems: "center", justifyContent: "center", padding: space[4] }}>
          <View style={{ width: "100%", maxWidth: 480, maxHeight: "90%", backgroundColor: color.bg.surface, borderRadius: radius.lg, overflow: "hidden" }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: space[4],
                paddingVertical: space[3],
                borderBottomWidth: 1,
                borderBottomColor: color.border.default,
              }}
            >
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Fale conosco</Text>
              <Pressable
                onPress={() => setAberto(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                style={{ minWidth: 32, minHeight: 32, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ ...type.h3, color: color.text.secondary }}>✕</Text>
              </Pressable>
            </View>

            <iframe src="https://linkminer.app/embed/serdono" style={{ border: 0, width: "100%", height: 600 }} loading="lazy" title="Formulário" />
          </View>
        </View>
      </Modal>
    </>
  );
}
