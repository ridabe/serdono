import { Text, TextInput, View } from "react-native";
import { color, radius, space, type } from "../tokens";

export interface CurrencyInputProps {
  label: string;
  /** Fonte de verdade em centavos — evita o erro clássico de ponto-flutuante de guardar reais como `number`/string livre. */
  valueCentavos: number;
  onChangeCentavos: (centavos: number) => void;
}

function formatarCentavos(centavos: number): string {
  return `R$ ${(Math.max(centavos, 0) / 100).toFixed(2).replace(".", ",")}`;
}

/**
 * Campo de dinheiro com máscara de moeda brasileira — o usuário digita só
 * dígitos e eles preenchem da direita pra esquerda (como numa calculadora):
 * "1990" vira "R$ 19,90", um novo dígito no fim empurra pra "R$ 199,05". O
 * `TextInput` é 100% controlado pelo `valueCentavos` do pai — nunca guarda
 * texto formatado como estado próprio, só deriva a exibição a cada render,
 * então não existe estado "de texto" e "de centavos" podendo divergir.
 */
export function CurrencyInput({ label, valueCentavos, onChangeCentavos }: CurrencyInputProps) {
  function handleChangeText(raw: string) {
    const digitos = raw.replace(/\D/g, "");
    onChangeCentavos(digitos ? parseInt(digitos, 10) : 0);
  }

  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{label}</Text>
      <TextInput
        value={formatarCentavos(valueCentavos)}
        onChangeText={handleChangeText}
        keyboardType="numeric"
        style={{
          height: 48,
          borderWidth: 1,
          borderColor: color.border.default,
          borderRadius: radius.md,
          paddingHorizontal: space[4],
          fontSize: 14,
          color: color.text.primary,
        }}
      />
    </View>
  );
}
