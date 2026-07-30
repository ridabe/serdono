import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, type StyleProp, type ViewStyle } from "react-native";
import { motion } from "../tokens";

export interface RevealProps {
  children: React.ReactNode;
  /** Atraso antes de começar — use `motion.revealStagger * i` para revelar uma lista em sequência. */
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Animação de entrada (fade + subida curta) — DS-16. Duração fixa em
 * `motion.slow` (320ms), dentro do limite de 400ms da DS-9.
 *
 * Respeita a preferência de movimento reduzido do sistema: quando ligada, o
 * conteúdo aparece direto, sem animação (a informação nunca depende do
 * movimento pra ser lida).
 */
export function Reveal({ children, delay = 0, distance = motion.revealDistance, style }: RevealProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduceMotion(enabled);
      })
      .catch(() => {
        if (!cancelled) setReduceMotion(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.slow,
      delay,
      easing: Easing.out(Easing.cubic),
      // react-native-web não suporta o driver nativo — DS-6 tem a mesma
      // divergência plataforma-a-plataforma para sombra.
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
