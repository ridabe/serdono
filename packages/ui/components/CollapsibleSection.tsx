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

// `badgeFg`: DS-2/§2.3 exige AA — nunca texto branco sobre `gold.500`/tons
// próximos (contraste medido ~2.5:1, abaixo do piso de 3:1 mesmo pra texto
// grande em negrito). `primaryHover` (gold600) é escuro o bastante pra ser a
// faixa/fundo do badge, mas ainda insuficiente pra texto branco em cima —
// por isso só o acento `gold` usa `onAction` (brand900); os demais (bem mais
// escuros: brand900, success600, warning600, danger600, info600) usam branco.
const ACCENT_TONES: Record<SectionAccent, { bar: string; headerBg: string; text: string; badgeFg: string }> = {
  brand: { bar: color.bg.brand, headerBg: color.bg.brandSubtle, text: color.bg.brand, badgeFg: color.text.onBrand },
  gold: { bar: color.action.primaryHover, headerBg: color.action.primarySubtle, text: color.action.primaryHover, badgeFg: color.text.onAction },
  info: { bar: color.state.info, headerBg: color.state.infoBg, text: color.state.info, badgeFg: color.text.onBrand },
  success: { bar: color.state.success, headerBg: color.state.successBg, text: color.state.success, badgeFg: color.text.onBrand },
  warning: { bar: color.state.warning, headerBg: color.state.warningBg, text: color.state.warning, badgeFg: color.text.onBrand },
  danger: { bar: color.state.danger, headerBg: color.state.dangerBg, text: color.state.danger, badgeFg: color.text.onBrand },
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
// Nasce sempre retraída (pedido do dono do produto, 08/08/2026, DS-18.1): o
// usuário deve ver de cara TODAS as áreas disponíveis, sem precisar rolar por
// um monte de conteúdo já aberto pra entender o que a tela oferece.
export function CollapsibleSection({ title, accent = "brand", rightLabel, defaultExpanded = false, children }: CollapsibleSectionProps) {
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
        {/* Badge circular preenchido em vez de uma seta fina de texto — pedido
            do dono do produto (DS-18.1): quem não sabe do que se trata a seção
            precisa perceber, sem precisar já saber o que uma "▾"/"▸" significa,
            que aquilo é um botão de expandir. */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tones.bar,
          }}
        >
          <Text style={{ color: tones.badgeFg, fontSize: 16, fontWeight: "700", lineHeight: 18 }}>{expanded ? "−" : "+"}</Text>
        </View>
      </Pressable>

      {/* Sem `gap` aqui de propósito — cada tela já controla o espaçamento interno dos próprios filhos (Input tem marginBottom embutido, etc.); um gap extra dobraria a distância entre eles. */}
      {expanded ? <View style={{ padding: space[5] }}>{children}</View> : null}
    </View>
  );
}
