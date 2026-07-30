import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { a11y, motion } from "../tokens";

export interface HoverLiftProps {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Sem `onPress` o elemento continua reagindo ao hover, mas não vira botão. */
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/**
 * Card/elemento que sobe no hover e afunda levemente no press — DS-16.
 * Movimento confirma a interação, nunca carrega informação por si (DS-9).
 */
export function HoverLift({ children, onPress, accessibilityLabel, style, disabled = false }: HoverLiftProps) {
  const lift = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  function animate(value: Animated.Value, toValue: number, duration: number) {
    Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }

  useEffect(() => {
    if (disabled) {
      lift.setValue(0);
      press.setValue(0);
    }
  }, [disabled, lift, press]);

  const translateY = Animated.add(
    lift.interpolate({ inputRange: [0, 1], outputRange: [0, -motion.hoverLift] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [0, motion.hoverLift] })
  );
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, motion.pressScale] });

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onHoverIn={disabled ? undefined : () => animate(lift, 1, motion.base)}
      onHoverOut={disabled ? undefined : () => animate(lift, 0, motion.base)}
      onPressIn={disabled ? undefined : () => animate(press, 1, motion.fast)}
      onPressOut={disabled ? undefined : () => animate(press, 0, motion.base)}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={onPress ? { disabled } : undefined}
      style={onPress ? { minHeight: a11y.minTouchTarget } : undefined}
    >
      <Animated.View style={[style, { transform: [{ translateY }, { scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
