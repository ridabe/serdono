import { usePathname, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, PanResponder, Platform, Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, elevation, isNativeApp, MaryAvatar, radius, space, type } from "@serdono/ui";

// Não mostra na própria tela do chat (ir pra lá clicando nele mesmo não faz
// sentido) nem nas telas legais/pré-login, que ficam fora do grupo protegido.
const ROTA_CHAT = "/assistente";

// Altura aproximada da MobileTabBar (paddingTop space[2] + paddingBottom
// mínimo space[2] + ícone/label ~40px, SDD-53) — só soma no app instalado,
// onde a tab bar ocupa a faixa inferior; na web o botão fica direto no canto.
const ALTURA_TAB_BAR = 64;

// Tamanho aproximado do botão fechado (avatar 48 + padding), usado só pra
// limitar o arrasto sem deixar o botão sair da tela — não precisa ser exato.
const LARGURA_BOTAO = 190;
const ALTURA_BOTAO = 56;

// Distância mínima de arrasto pra contar como "arrastou" em vez de "tocou"
// (pedido implícito: o botão continua clicável pra abrir o chat).
const LIMIAR_ARRASTO = 6;

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
  const { width, height } = useWindowDimensions();

  // Posição inicial: canto inferior direito, mesmo lugar de sempre — o
  // arrasto só entra em ação quando o usuário decide mover o botão pra fora
  // do caminho de algum conteúdo específico da tela.
  const bottomInicial = insets.bottom + space[4] + (isNativeApp ? ALTURA_TAB_BAR : 0);
  const posInicial = useRef({ x: width - LARGURA_BOTAO - space[4], y: height - ALTURA_BOTAO - bottomInicial }).current;
  const pan = useRef(new Animated.ValueXY(posInicial)).current;
  const [arrastando, setArrastando] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gesture) => Math.abs(gesture.dx) > LIMIAR_ARRASTO || Math.abs(gesture.dy) > LIMIAR_ARRASTO,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as unknown as { _value: number })._value, y: (pan.y as unknown as { _value: number })._value });
        pan.setValue({ x: 0, y: 0 });
        setArrastando(false);
      },
      onPanResponderMove: (_e, gesture) => {
        if (Math.abs(gesture.dx) > LIMIAR_ARRASTO || Math.abs(gesture.dy) > LIMIAR_ARRASTO) setArrastando(true);
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_e, gesture);
      },
      onPanResponderRelease: (_e, gesture) => {
        pan.flattenOffset();
        const foiArrasto = Math.abs(gesture.dx) > LIMIAR_ARRASTO || Math.abs(gesture.dy) > LIMIAR_ARRASTO;
        // Arrasta livre nos dois eixos (horizontal e vertical), sempre preso
        // dentro da tela — pedido do dono do produto, 09/08/2026: o botão não
        // pode ficar cobrindo áreas específicas de nenhuma tela.
        const x = Math.min(Math.max((pan.x as unknown as { _value: number })._value, space[2]), width - LARGURA_BOTAO - space[2]);
        const y = Math.min(
          Math.max((pan.y as unknown as { _value: number })._value, insets.top + space[2]),
          height - ALTURA_BOTAO - insets.bottom - space[2]
        );
        Animated.spring(pan, { toValue: { x, y }, useNativeDriver: false, friction: 7 }).start();
        if (!foiArrasto) router.push(ROTA_CHAT);
        setArrastando(false);
      },
    })
  ).current;

  if (pathname === ROTA_CHAT || pathname.startsWith(`${ROTA_CHAT}/`)) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel="Falar com a Mary — arraste para mover"
      style={{
        position: "absolute",
        transform: pan.getTranslateTransform(),
        flexDirection: "row",
        alignItems: "center",
        gap: space[2],
        backgroundColor: color.bg.brand,
        borderRadius: radius.full,
        paddingVertical: space[1],
        paddingRight: space[4],
        opacity: arrastando ? 0.85 : 1,
        ...(Platform.OS === "android" ? elevation[3].android : elevation[3].ios),
      }}
    >
      <MaryAvatar pose="positivo" size={48} shape="circle" />
      <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>Fale com a Mary</Text>
    </Animated.View>
  );
}
