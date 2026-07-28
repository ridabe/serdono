import React from "react";
import { Image, Text, View } from "react-native";
import { type } from "../tokens";

const symbolColor = require("../../../img/simbolo/simbolo-cor-512.png");
const symbolWhite = require("../../../img/simbolo/marca-branca-512.png");

export interface LogoProps {
  variant?: "color" | "white";
  size?: number;
  showWordmark?: boolean;
}

// img/README.md — símbolo colorido (fundo claro) / marca branca (fundo escuro, sem ladrilho)
export function Logo({ variant = "color", size = 34, showWordmark = true }: LogoProps) {
  const isWhite = variant === "white";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <Image
        source={isWhite ? symbolWhite : symbolColor}
        style={{ width: size, height: size, borderRadius: isWhite ? 0 : size * 0.24 }}
        resizeMode="contain"
        accessibilityLabel="Ser Dono"
      />
      {showWordmark ? (
        <Text style={{ fontFamily: type.h2.fontFamily, fontSize: size * 0.56, letterSpacing: -0.4 }}>
          <Text style={{ color: isWhite ? "#FFFFFF" : "#0E3A4F" }}>Ser</Text>
          <Text style={{ color: "#F2B03D" }}>Dono</Text>
        </Text>
      ) : null}
    </View>
  );
}
