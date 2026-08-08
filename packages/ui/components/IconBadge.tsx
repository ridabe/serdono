import type { ReactNode } from "react";
import { View } from "react-native";
import { type ModuleAccent, moduleAccent, radius } from "../tokens";

export interface IconBadgeProps {
  accent: ModuleAccent;
  /** Diâmetro do círculo — 48 pro grid de módulos/fases, menor (32-36) em contextos mais densos. */
  size?: number;
  /** Conteúdo do círculo — um ícone desenhado (`react-native-svg`, ver `apps/app/.../FaseIcon.tsx`) ou, em último caso, um glyph curto de texto. A cor de contraste aprovada pro acento (`moduleAccent[accent].fg`) é responsabilidade de quem chama, não deste componente. */
  children: ReactNode;
}

// DESIGN_SYSTEM.md §9.14 (DS-23) — círculo colorido usado no grid de
// módulos/fases do Início e em qualquer card que precise de identidade
// visual por cor sem depender de uma lib de ícones.
export function IconBadge({ accent, size = 48, children }: IconBadgeProps) {
  const tones = moduleAccent[accent];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tones.bg,
      }}
    >
      {children}
    </View>
  );
}
