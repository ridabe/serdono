import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { color, radius, space, type } from "@serdono/ui";
import { TIPOS_CONTRATO, type TipoContrato } from "@serdono/core";

/**
 * Seletor do tipo de contrato — variante nativa (pedido do dono do
 * produto, 17/08/2026: "listbox" em vez de chips/botões). Sem dependência
 * nova: `Modal` + lista de `Pressable` já são suficientes, mesmo espírito
 * de `ConfirmModal` de `@serdono/ui` — abre a lista, escolhe, fecha.
 */
export interface SeletorTipoContratoProps {
  value: TipoContrato | null;
  onChange: (tipo: TipoContrato) => void;
}

export function SeletorTipoContrato({ value, onChange }: SeletorTipoContratoProps) {
  const [aberto, setAberto] = useState(false);
  const selecionado = TIPOS_CONTRATO.find((t) => t.valor === value);

  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Modelo de contrato</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escolher modelo de contrato"
        onPress={() => setAberto(true)}
        style={{
          height: 48,
          borderWidth: 1,
          borderColor: color.border.default,
          borderRadius: radius.md,
          paddingHorizontal: space[4],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ ...type.body, color: selecionado ? color.text.primary : color.text.muted }}>{selecionado?.label ?? "Escolha um modelo…"}</Text>
        <Text style={{ ...type.body, color: color.text.muted }}>▾</Text>
      </Pressable>
      {selecionado ? (
        <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>{selecionado.descricao}</Text>
      ) : null}

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable
          onPress={() => setAberto(false)}
          style={{ flex: 1, backgroundColor: "rgba(17,24,39,0.5)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: color.bg.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space[5] }}
          >
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Escolha um modelo de contrato</Text>
            {TIPOS_CONTRATO.map((t) => (
              <Pressable
                key={t.valor}
                accessibilityRole="button"
                onPress={() => {
                  onChange(t.valor);
                  setAberto(false);
                }}
                style={{
                  paddingVertical: space[3],
                  borderBottomWidth: 1,
                  borderBottomColor: color.border.default,
                }}
              >
                <Text style={{ ...type.bodyStrong, color: t.valor === value ? color.bg.brand : color.text.primary }}>{t.label}</Text>
                <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{t.descricao}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
