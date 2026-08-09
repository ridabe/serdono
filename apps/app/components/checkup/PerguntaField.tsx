import { Text, TextInput, View } from "react-native";
import { Button, color, radius, space, type } from "@serdono/ui";
import type { PerguntaCheckup } from "@serdono/core";

/** Um campo do questionário do Check-up — o tipo (`sim_nao`/`selecao`/`texto`) decide o controle exibido. */
export function PerguntaField({
  pergunta,
  valor,
  onResponder,
}: {
  pergunta: PerguntaCheckup;
  valor: unknown;
  onResponder: (valor: unknown) => void;
}) {
  return (
    <View>
      <Text style={{ ...type.body, color: color.text.primary, marginBottom: space[2] }}>{pergunta.texto}</Text>

      {pergunta.tipo === "sim_nao" ? (
        <View style={{ flexDirection: "row", gap: space[2] }}>
          <Button label="Sim" variant={valor === true ? "primary" : "outline"} size="sm" onPress={() => onResponder(true)} />
          <Button label="Não" variant={valor === false ? "primary" : "outline"} size="sm" onPress={() => onResponder(false)} />
        </View>
      ) : null}

      {pergunta.tipo === "selecao" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
          {pergunta.opcoes?.map((opcao) => (
            <Button
              key={opcao.valor}
              label={opcao.label}
              variant={valor === opcao.valor ? "primary" : "outline"}
              size="sm"
              onPress={() => onResponder(opcao.valor)}
            />
          ))}
        </View>
      ) : null}

      {pergunta.tipo === "texto" ? (
        // `TextInput` cru, não o `Input` compartilhado — este já mostra o
        // texto da pergunta como rótulo logo acima; o `Input` exige um
        // `label` próprio, o que duplicaria a pergunta na tela.
        <TextInput
          value={(valor as string) ?? ""}
          onChangeText={onResponder}
          placeholder="Opcional"
          placeholderTextColor={color.text.muted}
          style={{
            ...type.body,
            color: color.text.primary,
            borderWidth: 1,
            borderColor: color.border.default,
            borderRadius: radius.md,
            paddingHorizontal: space[3],
            paddingVertical: space[2],
          }}
        />
      ) : null}
    </View>
  );
}
