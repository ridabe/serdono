import { Text, View } from "react-native";
import { color, radius, space, type } from "@serdono/ui";

/**
 * Campo de data/hora — variante web (Assistente de Reunião, agenda, V2
 * fatia 1, 12/08/2026). `<input type="datetime-local">` nativo do
 * navegador — sem dependência nova nesta plataforma (a variante nativa é
 * quem usa `@react-native-community/datetimepicker`, ver
 * `DateTimeField.native.tsx`). Estilizado pra combinar com `Input.tsx` de
 * `@serdono/ui` (mesma altura/borda/radius).
 */
export interface DateTimeFieldProps {
  label: string;
  value: Date | null;
  onChange: (data: Date) => void;
  minimumDate?: Date;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formato exigido por `<input type="datetime-local">`: `YYYY-MM-DDTHH:mm`, sempre em hora local (sem timezone). */
function paraInputValue(value: Date | null): string {
  if (!value) return "";
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function DateTimeField({ label, value, onChange, minimumDate }: DateTimeFieldProps) {
  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{label}</Text>
      <input
        type="datetime-local"
        value={paraInputValue(value)}
        min={minimumDate ? paraInputValue(minimumDate) : undefined}
        onChange={(e) => {
          if (!e.target.value) return;
          onChange(new Date(e.target.value));
        }}
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
          boxSizing: "border-box",
        }}
      />
    </View>
  );
}
