import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { color } from "../tokens";

export interface EntrepreneurBackgroundProps {
  photoUrl: string;
  /** DS-13: nunca abaixo de 0.85 — a foto é textura, nunca conteúdo competindo com o texto. */
  veilOpacity?: number;
}

// DESIGN_SYSTEM.md §9.9 — camada de fotografia sutil atrás de telas do funil
// pré-login. Nunca usar atrás de texto direto, só atrás de área com card opaco por cima.
export function EntrepreneurBackground({ photoUrl, veilOpacity = 0.92 }: EntrepreneurBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: color.bg.canvas, opacity: Math.max(0.85, veilOpacity) },
        ]}
      />
    </View>
  );
}
