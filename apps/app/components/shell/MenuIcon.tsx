import React from "react";
import Svg, { Path } from "react-native-svg";
import { icon } from "@serdono/ui";

/**
 * Ícone de hamburguer do gatilho do drawer (DS-22) — mesma técnica de
 * `TabIcon.tsx` (SVG desenhado à mão, Lucide ainda não instalada, §7 do
 * design system).
 */
export function MenuIcon({ color, size = icon.md }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 7h16M4 12h16M4 17h16"
        stroke={color}
        strokeWidth={icon.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
