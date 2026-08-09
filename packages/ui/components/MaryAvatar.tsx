import React from "react";
import { Image, View } from "react-native";
import { radius } from "../tokens";

const poses = {
  "boas-vindas": require("../../../img/mary/mary-boas-vindas.png"),
  jornada: require("../../../img/mary/mary-jornada.png"),
  positivo: require("../../../img/mary/mary-positivo.png"),
  checklist: require("../../../img/mary/mary-checklist.png"),
} as const;

export type MaryPose = keyof typeof poses;

export interface MaryAvatarProps {
  /** Qual foto usar — ver img/README.md para o contexto de uso de cada uma. */
  pose?: MaryPose;
  size?: number;
  rounded?: boolean;
  /**
   * "rect" (padrão, retrato 2:3) ou "circle" (quadrado, canto totalmente
   * arredondado) — usado no botão flutuante da Mary (SDD nova, 08/08/2026).
   * **Provisório:** não existe ainda nenhum asset "só a personagem, sem
   * fundo" — `shape="circle"` recorta a mesma foto retrato em círculo, não é
   * um cutout de verdade. Trocar a fonte da imagem aqui quando esse asset
   * existir; nada no resto do app precisa mudar.
   */
  shape?: "rect" | "circle";
}

// Mary é a personagem que representa o Ser Dono em todo o sistema — aparece
// dando boas-vindas e orientando o usuário em cada etapa da Jornada
// Empreendedora (ver DS-15 em DESIGN_SYSTEM.md).
export function MaryAvatar({ pose = "boas-vindas", size = 96, rounded = true, shape = "rect" }: MaryAvatarProps) {
  const height = shape === "circle" ? size : size * 1.5;
  const borderRadius = shape === "circle" ? size / 2 : rounded ? radius.lg : 0;
  return (
    <View style={{ width: size, height, borderRadius, overflow: "hidden" }}>
      <Image source={poses[pose]} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityLabel="Mary" />
    </View>
  );
}
