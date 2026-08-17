import { Text, View } from "react-native";
import { color, radius, space, type } from "@serdono/ui";
import { TIPOS_CONTRATO, type TipoContrato } from "@serdono/core";

/**
 * Seletor do tipo de contrato — variante web (pedido do dono do produto,
 * 17/08/2026: "listbox" em vez de chips/botões, pra ganhar espaço na tela —
 * diferente do padrão de seletor por chip usado em todo o resto do
 * produto, ex. tipo de reunião). `<select>` nativo do navegador — sem
 * dependência nova, mesma decisão de `DateTimeField.web.tsx`.
 */
export interface SeletorTipoContratoProps {
  value: TipoContrato | null;
  onChange: (tipo: TipoContrato) => void;
}

export function SeletorTipoContrato({ value, onChange }: SeletorTipoContratoProps) {
  const selecionado = TIPOS_CONTRATO.find((t) => t.valor === value);

  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Modelo de contrato</Text>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as TipoContrato)}
        style={{
          height: 48,
          width: "100%",
          border: `1px solid ${color.border.default}`,
          borderRadius: radius.md,
          paddingLeft: space[4],
          paddingRight: space[4],
          fontSize: 14,
          color: color.text.primary,
          fontFamily: "inherit",
          backgroundColor: color.bg.surface,
          boxSizing: "border-box",
        }}
      >
        <option value="" disabled>
          Escolha um modelo…
        </option>
        {TIPOS_CONTRATO.map((t) => (
          <option key={t.valor} value={t.valor}>
            {t.label}
          </option>
        ))}
      </select>
      {selecionado ? (
        <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>{selecionado.descricao}</Text>
      ) : null}
    </View>
  );
}
