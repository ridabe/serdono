import React, { useRef, useState } from "react";
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

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "danger" | "info";
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
  soft: { bg: color.bg.brandSubtle, fg: color.action.secondary },
  danger: { bg: color.state.danger, fg: color.text.onBrand },
  info: { bg: color.state.info, fg: color.text.onBrand },
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
  //
  // `pressed`/`hovered` viram estado local (não a API de `style` como
  // função do Pressable) de propósito: `Animated.createAnimatedComponent`
  // precisa inspecionar o `style` pra achar `Animated.Value` dentro dele, e
  // não sabe lidar com `style` sendo uma função — o resultado é o estilo
  // inteiro sendo descartado silenciosamente (sem erro, sem warning), só o
  // texto do botão aparece, sem fundo/padding/tamanho nenhum. Bug real de
  // produção pego só quando alguém olhou a tela de verdade (30/07/2026) —
  // toda essa sessão eu só validava botão por texto/clique via árvore de
  // acessibilidade, nunca por captura visual, por isso passou despercebido
  // apesar de já existir desde antes desta sessão.
  const lift = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
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
      onHoverIn={
        inert
          ? undefined
          : () => {
              setHovered(true);
              animate(lift, 1, motion.base);
            }
      }
      onHoverOut={
        inert
          ? undefined
          : () => {
              setHovered(false);
              animate(lift, 0, motion.base);
            }
      }
      onPressIn={
        inert
          ? undefined
          : () => {
              setPressed(true);
              animate(press, 1, motion.fast);
            }
      }
      onPressOut={
        inert
          ? undefined
          : () => {
              setPressed(false);
              animate(press, 0, motion.base);
            }
      }
      style={[
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
