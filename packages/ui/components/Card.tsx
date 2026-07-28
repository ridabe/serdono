import React from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { color, elevation, radius, space } from "../tokens";

export type CardVariant = "default" | "outline" | "brand";

export interface CardProps {
  variant?: CardVariant;
  padding?: keyof typeof space;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// DESIGN_SYSTEM.md §9.3
export function Card({ variant = "default", padding = 6, style, children }: CardProps) {
  const isOutline = variant === "outline";
  const isBrand = variant === "brand";
  const shadow = isOutline ? elevation[0] : elevation[1];

  return (
    <View
      style={[
        styles.base,
        {
          padding: space[padding],
          backgroundColor: isBrand ? color.bg.brand : color.bg.surface,
          borderColor: isOutline ? color.border.default : "transparent",
          borderWidth: isOutline ? 1 : 0,
          ...(Platform.OS === "android" ? shadow.android : shadow.ios),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
  },
});
