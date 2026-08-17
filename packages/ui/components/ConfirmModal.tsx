import { Modal, Pressable, Text, View } from "react-native";
import { color, space, type } from "../tokens";
import { Button } from "./Button";
import { Card } from "./Card";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Cor do botão de confirmação — `"danger"` (padrão) pra ação irreversível, `"primary"` pra confirmação neutra/positiva (ex.: convite pra assinar um plano). */
  confirmVariant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmação em duas etapas antes de ação irreversível (excluir, remover em
 * lote) — nenhum clique isolado executa a ação de verdade. Padrão nascido em
 * `AdminUsersScreen.tsx` (Painel Admin), extraído aqui pra reuso — toda tela
 * admin com exclusão usa este componente, nunca reimplementa o overlay.
 *
 * O backdrop (`Pressable` de tela cheia que fecha ao tocar fora) NUNCA
 * recebe `accessibilityRole="button"` — o conteúdo do modal, logo abaixo na
 * árvore, tem botões de verdade (Cancelar/Confirmar), e a web renderiza
 * `accessibilityRole="button"` como `<button>`; um `<button>` de tela cheia
 * envolvendo outros `<button>` é HTML inválido (erro de hidratação do
 * React). O backdrop continua clicável — só não é semanticamente um botão.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{ flex: 1, backgroundColor: "rgba(17, 24, 39, 0.5)", alignItems: "center", justifyContent: "center", padding: space[5] }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420 }}>
          <Card variant="default" padding={5}>
            <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[2] }}>{title}</Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>{message}</Text>
            <View style={{ flexDirection: "row", gap: space[2], justifyContent: "flex-end" }}>
              <Button label="Cancelar" variant="ghost" onPress={onCancel} />
              <Button label={confirmLabel} variant={confirmVariant} loading={loading} onPress={onConfirm} />
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
