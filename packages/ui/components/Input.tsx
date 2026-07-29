import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { color, radius, space, type } from "../tokens";

export interface InputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
}

export function Input(props: InputProps) {
  // Alterna a visibilidade só quando o campo é de senha — evita expor a API
  // de toggle em campos que nunca são mascarados.
  const [visible, setVisible] = useState(false);
  const isPasswordField = Boolean(props.secureTextEntry);

  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{props.label}</Text>
      <View style={{ position: "relative", justifyContent: "center" }}>
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          secureTextEntry={isPasswordField && !visible}
          keyboardType={props.keyboardType}
          autoCapitalize={props.autoCapitalize ?? "sentences"}
          autoCorrect={false}
          textContentType={isPasswordField ? "password" : undefined}
          style={{
            height: 48,
            borderWidth: 1,
            borderColor: color.border.default,
            borderRadius: radius.md,
            paddingHorizontal: space[4],
            paddingRight: isPasswordField ? space[8] : space[4],
            fontSize: 14,
          }}
        />
        {isPasswordField ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
            hitSlop={8}
            style={{
              position: "absolute",
              right: 0,
              height: 44,
              minWidth: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...type.caption, color: color.action.secondary, fontWeight: "600" }}>
              {visible ? "Ocultar" : "Mostrar"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
