import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { a11y, color, elevation, radius, space, type } from "../tokens";

/**
 * DESIGN_SYSTEM.md §9.10 (DS-18). Rotação de 6 cores reaproveitando tokens
 * já existentes (nenhum hex novo) — mesma paleta de `color.state.*` já
 * usada pelo Badge de status (§9.4), mais brand/gold pros dois primeiros
 * lugares do ciclo.
 */
export type SectionAccent = "brand" | "gold" | "info" | "success" | "warning" | "danger";

export const SECTION_ACCENT_CYCLE: SectionAccent[] = ["brand", "gold", "info", "success", "warning", "danger"];

const ACCENT_TONES: Record<SectionAccent, { bar: string; headerBg: string; text: string }> = {
  brand: { bar: color.bg.brand, headerBg: color.bg.brandSubtle, text: color.bg.brand },
  gold: { bar: color.action.primaryHover, headerBg: color.action.primarySubtle, text: color.action.primaryHover },
  info: { bar: color.state.info, headerBg: color.state.infoBg, text: color.state.info },
  success: { bar: color.state.success, headerBg: color.state.successBg, text: color.state.success },
  warning: { bar: color.state.warning, headerBg: color.state.warningBg, text: color.state.warning },
  danger: { bar: color.state.danger, headerBg: color.state.dangerBg, text: color.state.danger },
};

export interface CollapsibleSectionProps {
  title: string;
  /** Cor de destaque desta seção — use `SECTION_ACCENT_CYCLE[i % 6]` pra alternar cores entre os cards de uma mesma tela. */
  accent?: SectionAccent;
  /** Texto pequeno à direita do título, ex.: contador "5/5" (mesmo padrão já usado em MarketingScreen/FornecedoresScreen). */
  rightLabel?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

// DESIGN_SYSTEM.md §9.10 — card colapsável (sanfona) de subcategoria de etapa.
export function CollapsibleSection({ title, accent = "brand", rightLabel, defaultExpanded = true, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const tones = ACCENT_TONES[accent];

  return (
    <View
      style={{
        borderRadius: radius.lg,
        overflow: "hidden",
        backgroundColor: color.bg.surface,
        ...(Platform.OS === "android" ? elevation[1].android : elevation[1].ios),
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${expanded ? "expandido" : "retraído"}`}
        onPress={() => setExpanded((e) => !e)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: a11y.minTouchTarget,
          backgroundColor: tones.headerBg,
          borderLeftWidth: 4,
          borderLeftColor: tones.bar,
          paddingHorizontal: space[4],
          paddingVertical: space[3],
          gap: space[3],
        }}
      >
        <Text style={{ ...type.bodyStrong, color: tones.text, flex: 1 }}>{title}</Text>
        {rightLabel ? <Text style={{ ...type.caption, color: tones.text, fontWeight: "700" }}>{rightLabel}</Text> : null}
        <Text style={{ ...type.body, color: tones.text }}>{expanded ? "▾" : "▸"}</Text>
      </Pressable>

      {/* Sem `gap` aqui de propósito — cada tela já controla o espaçamento interno dos próprios filhos (Input tem marginBottom embutido, etc.); um gap extra dobraria a distância entre eles. */}
      {expanded ? <View style={{ padding: space[5] }}>{children}</View> : null}
    </View>
  );
}
