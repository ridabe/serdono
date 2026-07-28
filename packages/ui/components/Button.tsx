import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { a11y, color, radius, space, type } from "../tokens";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Sobrescreve a cor de texto do variant — uso raro (ex.: "ghost" sobre fundo de marca). */
  onDark?: boolean;
}

// DESIGN_SYSTEM.md §9.1 — nunca texto branco sobre color.action.primary (DS §2.3)
const variantStyles: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: color.action.primary, fg: color.text.onAction },
  secondary: { bg: color.action.secondary, fg: color.text.onBrand },
  outline: { bg: "transparent", fg: color.action.secondary, border: color.action.secondary },
  ghost: { bg: "transparent", fg: color.text.secondary },
  danger: { bg: color.state.danger, fg: color.text.onBrand },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  onDark = false,
}: ButtonProps) {
  const v = variantStyles[variant];
  const fg = onDark && variant === "ghost" ? color.text.onBrand : v.fg;
  const height = size === "sm" ? 36 : 48;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed, hovered }: any) => [
        styles.base,
        {
          height,
          minWidth: a11y.minTouchTarget,
          backgroundColor: v.bg,
          borderColor: v.border ?? "transparent",
          borderWidth: v.border ? 1.5 : 0,
          opacity: disabled ? 0.4 : hovered ? 0.92 : pressed ? 0.85 : 1,
          width: fullWidth ? "100%" : undefined,
          paddingHorizontal: size === "sm" ? space[4] : space[5],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg, fontSize: size === "sm" ? 13.5 : type.button.fontSize }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    gap: space[2],
  },
  label: {
    fontFamily: type.button.fontFamily,
    fontWeight: "600",
  },
});
