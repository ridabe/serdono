import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { a11y, color, motion, radius, space, type } from "../tokens";

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

  // DS-16: o botão sobe de leve no hover e afunda no press — movimento só
  // confirma a ação, nunca atrasa a resposta percebida (DS-9).
  const lift = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const inert = disabled || loading;

  function animate(value: Animated.Value, toValue: number, duration: number) {
    Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }

  const translateY = Animated.add(
    lift.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [0, 2] })
  );
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, motion.pressScale] });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert }}
      onPress={inert ? undefined : onPress}
      onHoverIn={inert ? undefined : () => animate(lift, 1, motion.base)}
      onHoverOut={inert ? undefined : () => animate(lift, 0, motion.base)}
      onPressIn={inert ? undefined : () => animate(press, 1, motion.fast)}
      onPressOut={inert ? undefined : () => animate(press, 0, motion.base)}
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
          transform: [{ translateY }, { scale }],
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
    </AnimatedPressable>
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
