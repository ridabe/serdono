import React from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Logo, MaryAvatar, color, radius, space, type } from "@serdono/ui";

/**
 * Tela de abertura do app instalado (SDD-53) — o equivalente nativo de
 * `HomeScreen`, que continua sendo a landing na web.
 *
 * Diferença de propósito, não de estilo: quem abre o app já baixou o produto,
 * já foi convencido. Não precisa de landing page de venda (prova social,
 * seções de módulos, rodapé institucional) — precisa de identidade, uma
 * síntese do que o app faz e três portas: começar do zero, entrar com um
 * negócio que já existe, ou fazer login. Nenhum link daqui leva pra fora do
 * app.
 */
export function AppWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // A foto é a única coisa elástica da tela: tudo o mais (texto, três botões,
  // rodapé) tem altura praticamente fixa, ~600dp somados (medido no
  // navegador a 375dp de largura, não estimado). O resto do espaço vai pra
  // Mary, com piso e teto — a decisão de entrada precisa caber sem rolagem, e
  // `MaryAvatar` tem proporção 1:1.5.
  const maryWidth = Math.round(Math.max(104, Math.min(168, (height - 600) / 1.5)));

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.brand }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + space[6],
          paddingBottom: insets.bottom + space[6],
          paddingHorizontal: space[6],
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Logo variant="white" size={36} />
        </View>

        <View style={{ alignItems: "center", marginTop: space[6] }}>
          <View style={{ width: maryWidth }}>
            {/* Mesmo halo dourado do Hero da web (DS-15): separa a Mary do
                azul-petróleo sem recolorir o asset. */}
            <View
              style={{
                position: "absolute",
                top: -space[2],
                left: -space[2],
                right: -space[2],
                bottom: -space[2],
                borderRadius: radius.lg + space[2],
                backgroundColor: "rgba(242,176,61,0.14)",
              }}
            />
            <MaryAvatar pose="boas-vindas" size={maryWidth} />
          </View>
        </View>

        <Text
          style={{
            ...type.overline,
            color: color.action.primary,
            textAlign: "center",
            marginTop: space[4],
          }}
        >
          OI, EU SOU A MARY
        </Text>
        <Text
          style={{
            ...type.display,
            fontSize: 26,
            lineHeight: 34,
            letterSpacing: -0.6,
            color: color.text.onBrand,
            textAlign: "center",
            marginTop: space[2],
          }}
        >
          Você não precisa saber tudo.{" "}
          <Text style={{ color: color.action.primary }}>Só o próximo passo.</Text>
        </Text>
        <Text
          style={{
            ...type.body,
            color: color.bg.brandSubtle,
            textAlign: "center",
            marginTop: space[3],
          }}
        >
          Eu te acompanho do "não sei o que abrir" até o primeiro cliente pagando.
        </Text>

        {/* Cada destaque cabe em uma linha a 375dp — duas linhas por item
            comiam a altura que os botões precisam (medido). */}
        <View style={{ gap: space[2], marginTop: space[4] }}>
          <Destaque texto="Nicho, nome e marca definidos" />
          <Destaque texto="Formalização sem juridiquês" />
          <Destaque texto="Sua jornada fica salva" />
        </View>

        {/* Empurra o bloco de decisão pro rodapé quando sobra altura. */}
        <View style={{ flex: 1, minHeight: space[2] }} />

        <View style={{ gap: space[3] }}>
          <Button
            label="Quero começar do zero"
            variant="primary"
            fullWidth
            onPress={() => router.push("/diagnostico")}
          />
          <Button
            label="Já tenho um negócio"
            variant="ghost"
            onDark
            fullWidth
            style={{ borderWidth: 1.5, borderColor: color.action.primary }}
            onPress={() => router.push("/negocio-existente")}
          />

          <Pressable
            onPress={() => router.push("/login")}
            accessibilityRole="link"
            style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ ...type.bodyStrong, color: color.bg.brandSubtle }}>
              Já tenho conta · <Text style={{ color: color.action.primary }}>Entrar</Text>
            </Text>
          </Pressable>

          {/* Termos e Privacidade não entram aqui de propósito: o aceite
              acontece no cadastro, que é a próxima tela dos dois caminhos —
              repetir os links roubaria a altura que a decisão precisa. */}
          <Text style={{ ...type.caption, color: color.bg.brandSubtle, textAlign: "center", opacity: 0.8 }}>
            Grátis para começar · Sem cartão de crédito
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Destaque({ texto }: { texto: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[3] }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: radius.full,
          backgroundColor: color.action.primary,
          marginTop: 7,
        }}
      />
      <Text style={{ ...type.body, color: color.text.onBrand, flex: 1 }}>{texto}</Text>
    </View>
  );
}
