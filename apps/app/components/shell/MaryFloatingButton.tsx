import { usePathname, useRouter } from "expo-router";
import { Platform, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, elevation, isNativeApp, MaryAvatar, radius, space, type } from "@serdono/ui";

// Não mostra na própria tela do chat (ir pra lá clicando nele mesmo não faz
// sentido) nem nas telas legais/pré-login, que ficam fora do grupo protegido.
const ROTA_CHAT = "/assistente";

// Altura aproximada da MobileTabBar (paddingTop space[2] + paddingBottom
// mínimo space[2] + ícone/label ~40px, SDD-53) — só soma no app instalado,
// onde a tab bar ocupa a faixa inferior; na web o botão fica direto no canto.
const ALTURA_TAB_BAR = 64;

/**
 * Botão flutuante da Mary (SDD nova, 08/08/2026) — substitui o card "Converse
 * comigo" que só existia na Início; agora é um atalho pro chat presente em
 * toda tela protegida. Ver `MaryAvatar` (`shape="circle"`) pra nota sobre o
 * asset provisório (recorte circular, não um cutout de verdade).
 *
 * **Ganhou o texto "Fale com a Mary" ao lado do avatar** (pedido do dono do
 * produto, 08/08/2026) — só a foto flutuando não deixava claro que aquilo é
 * um botão de chat, e o público do produto inclui gente sem prática com
 * apps; um rótulo de texto elimina a ambiguidade sem depender de o usuário
 * já saber o que um avatar flutuante costuma significar noutros produtos.
 */
export function MaryFloatingButton() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (pathname === ROTA_CHAT || pathname.startsWith(`${ROTA_CHAT}/`)) return null;

  return (
    <Pressable
      onPress={() => router.push(ROTA_CHAT)}
      accessibilityRole="button"
      accessibilityLabel="Falar com a Mary"
      style={{
        position: "absolute",
        right: space[4],
        bottom: insets.bottom + space[4] + (isNativeApp ? ALTURA_TAB_BAR : 0),
        flexDirection: "row",
        alignItems: "center",
        gap: space[2],
        backgroundColor: color.bg.brand,
        borderRadius: radius.full,
        paddingVertical: space[1],
        paddingRight: space[4],
        ...(Platform.OS === "android" ? elevation[3].android : elevation[3].ios),
      }}
    >
      <MaryAvatar pose="positivo" size={48} shape="circle" />
      <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>Fale com a Mary</Text>
    </Pressable>
  );
}
