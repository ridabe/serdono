import React from "react";
import Svg, { Path, Polyline, Rect } from "react-native-svg";
import { icon } from "@serdono/ui";

/**
 * Ícones pequenos da tela "Dicas da Mary" (badges de tipo de mídia + chevron
 * de navegação) — mesma técnica de `TabIcon.tsx`/`MenuIcon.tsx`: SVG desenhado
 * à mão porque Lucide ainda não está instalada (DESIGN_SYSTEM §7).
 */
const common = (color: string) => ({
  stroke: color,
  strokeWidth: icon.strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
});

export function PdfIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" {...common(color)} />
      <Path d="M15 2v5h5" {...common(color)} />
    </Svg>
  );
}

export function PlayIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={18} height={18} rx={4} {...common(color)} />
      <Path d="M10 8.5l6 3.5-6 3.5z" fill={color} stroke="none" />
    </Svg>
  );
}

export function LinkIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9.5 14.5l5-5" {...common(color)} />
      <Path d="M11 6.5l1.5-1.5a4 4 0 0 1 5.5 5.5L16.5 12" {...common(color)} />
      <Path d="M13 17.5L11.5 19a4 4 0 0 1-5.5-5.5L7.5 12" {...common(color)} />
    </Svg>
  );
}

export function ChevronRightIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polyline points="9 5 16 12 9 19" {...common(color)} />
    </Svg>
  );
}
