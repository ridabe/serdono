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
}

// Mary é a personagem que representa o Ser Dono em todo o sistema — aparece
// dando boas-vindas e orientando o usuário em cada etapa da Jornada
// Empreendedora (ver DS-15 em DESIGN_SYSTEM.md).
export function MaryAvatar({ pose = "boas-vindas", size = 96, rounded = true }: MaryAvatarProps) {
  return (
    <View
      style={{
        width: size,
        height: size * 1.5,
        borderRadius: rounded ? radius.lg : 0,
        overflow: "hidden",
      }}
    >
      <Image source={poses[pose]} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityLabel="Mary" />
    </View>
  );
}
