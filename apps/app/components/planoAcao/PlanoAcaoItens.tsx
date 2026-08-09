import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { color, space, type } from "@serdono/ui";
import type { PlanoAcaoItemCore } from "@serdono/core";

/**
 * Peças visuais compartilhadas entre a tela principal (checklist marcável) e
 * o histórico/comparação (mesmo item, mas só leitura) — mesmo ícone e mesma
 * linha, só variando se `onToggle` existe.
 */

export function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle
        cx={12}
        cy={12}
        r={10}
        fill={checked ? color.state.successBg : "transparent"}
        stroke={checked ? color.state.success : color.border.default}
        strokeWidth={1.75}
      />
      {checked ? (
        <Path d="M7.5 12.3l3 3 6-6.6" stroke={color.state.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : null}
    </Svg>
  );
}

export function ItemCheckRow({ item, onToggle }: { item: PlanoAcaoItemCore; onToggle?: () => void }) {
  const conteudo = (
    <>
      <CheckIcon checked={item.concluido} />
      <Text
        style={{
          ...type.body,
          color: item.concluido ? color.text.muted : color.text.primary,
          textDecorationLine: item.concluido ? "line-through" : "none",
          flex: 1,
        }}
      >
        {item.titulo}
      </Text>
    </>
  );

  if (!onToggle) {
    return <View style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>{conteudo}</View>;
  }

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.concluido }}
      accessibilityLabel={item.titulo}
      style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}
    >
      {conteudo}
    </Pressable>
  );
}
