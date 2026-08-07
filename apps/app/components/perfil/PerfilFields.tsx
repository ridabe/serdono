import { Image, Pressable, Text, TextInput, View } from "react-native";
import { color, radius, space, type } from "@serdono/ui";

interface PerfilFieldsProps {
  nome: string;
  onChangeNome: (v: string) => void;
  telefone: string;
  onChangeTelefone: (v: string) => void;
  avatarUri: string | null;
  onPickPhoto: () => void;
  error: string | null;
}

// UI compartilhada entre CompletarCadastroScreen (gate obrigatório) e
// PerfilScreen (edição livre) — mesmos campos, mesmo padrão de foto.
export function PerfilFields({ nome, onChangeNome, telefone, onChangeTelefone, avatarUri, onPickPhoto, error }: PerfilFieldsProps) {
  return (
    <View>
      <View style={{ alignItems: "center", marginBottom: space[6] }}>
        <Pressable onPress={onPickPhoto} accessibilityRole="button" accessibilityLabel="Escolher foto de perfil">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96, borderRadius: radius.full }} />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: radius.full,
                backgroundColor: color.bg.brandSubtle,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ ...type.h2, color: color.bg.brand }}>{nome.trim() ? nome.trim()[0].toUpperCase() : "?"}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onPickPhoto} style={{ minHeight: 44, justifyContent: "center", marginTop: space[2] }}>
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>{avatarUri ? "Trocar foto" : "Adicionar foto (opcional)"}</Text>
        </Pressable>
      </View>

      <Field label="Nome" value={nome} onChangeText={onChangeNome} placeholder="Como podemos te chamar?" />
      <Field label="Telefone" value={telefone} onChangeText={onChangeTelefone} placeholder="(11) 91234-5678" keyboardType="phone-pad" />

      {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType}
        placeholderTextColor={color.text.muted}
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
