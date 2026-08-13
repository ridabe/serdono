import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { color, radius, space, type } from "@serdono/ui";

/**
 * Campo de data/hora — variante nativa (Assistente de Reunião, agenda, V2
 * fatia 1, 12/08/2026). Android exige 2 seleções separadas
 * (`mode="date"` depois `mode="time"` — limitação da própria API nativa do
 * Android, não do pacote); iOS aceita `mode="datetime"` numa tela só. O
 * componente encapsula essa diferença atrás da mesma prop `value`/
 * `onChange` (`Date`) usada na variante web.
 *
 * **Não verificado visualmente nesta sessão** — o preview usado só roda
 * web; fica pendente confirmar num build/preview do app instalado (mesma
 * limitação já registrada em SDDs anteriores pra tudo que só existe fora
 * da web, ex. `YoutubeEmbed.native.tsx`).
 */
export interface DateTimeFieldProps {
  label: string;
  value: Date | null;
  onChange: (data: Date) => void;
  minimumDate?: Date;
}

function formatarValor(value: Date | null): string {
  if (!value) return "Toque para escolher";
  const data = value.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = value.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}

export function DateTimeField({ label, value, onChange, minimumDate }: DateTimeFieldProps) {
  const [etapa, setEtapa] = useState<"fechado" | "data" | "hora">("fechado");
  const [dataParcial, setDataParcial] = useState<Date | null>(null);

  function aoMudarData(evento: DateTimePickerEvent, selecionado?: Date) {
    setEtapa("fechado");
    if (evento.type !== "set" || !selecionado) return;
    if (Platform.OS === "ios") {
      // iOS já devolve data+hora numa chamada só (mode="datetime").
      onChange(selecionado);
      return;
    }
    setDataParcial(selecionado);
    setEtapa("hora");
  }

  function aoMudarHora(evento: DateTimePickerEvent, selecionado?: Date) {
    setEtapa("fechado");
    if (evento.type !== "set" || !selecionado || !dataParcial) {
      setDataParcial(null);
      return;
    }
    const final = new Date(dataParcial);
    final.setHours(selecionado.getHours(), selecionado.getMinutes(), 0, 0);
    onChange(final);
    setDataParcial(null);
  }

  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{label}</Text>
      <Pressable
        onPress={() => setEtapa("data")}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          height: 48,
          borderWidth: 1,
          borderColor: color.border.default,
          borderRadius: radius.md,
          paddingHorizontal: space[4],
          justifyContent: "center",
        }}
      >
        <Text style={{ ...type.body, color: value ? color.text.primary : color.text.muted }}>{formatarValor(value)}</Text>
      </Pressable>

      {etapa === "data" ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode={Platform.OS === "ios" ? "datetime" : "date"}
          minimumDate={minimumDate}
          onChange={aoMudarData}
        />
      ) : null}
      {etapa === "hora" && dataParcial ? <DateTimePicker value={dataParcial} mode="time" onChange={aoMudarHora} /> : null}
    </View>
  );
}
