import { Modal, Text, View } from "react-native";
import { Button, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import { useNovidadesModulos } from "./useNovidadesModulos";

/**
 * Pop-up "novo módulo por aqui" (SDD nova, 08/08/2026) — a Mary avisa quem
 * já tinha conta que apareceu algo novo, um grupo por vez (`useNovidadesModulos`
 * já cuida da fila). Só existe conteúdo quando há algo pendente — sem
 * `grupoAtual`, o componente não renderiza nada.
 */
export function NovidadeModuloPopup() {
  const { grupoAtual, entendi, naoMostrarMais } = useNovidadesModulos();
  if (!grupoAtual) return null;

  const multiplo = grupoAtual.modulos.length > 1;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(17, 24, 39, 0.6)",
          alignItems: "center",
          justifyContent: "center",
          padding: space[5],
        }}
      >
        <View
          style={{
            backgroundColor: color.bg.surface,
            borderRadius: radius.lg,
            padding: space[6],
            width: "100%",
            maxWidth: 400,
            gap: space[4],
          }}
        >
          <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
            <MaryAvatar pose="positivo" size={64} />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: color.action.primarySubtle,
                  borderRadius: radius.sm,
                  paddingHorizontal: space[3],
                  paddingVertical: space[1],
                  marginBottom: space[2],
                }}
              >
                <Text style={{ ...type.caption, color: color.action.primaryHover, fontWeight: "700" }}>
                  {multiplo ? "NOVIDADES POR AQUI" : "NOVIDADE POR AQUI"}
                </Text>
              </View>
              <Text style={{ ...type.h3, color: color.text.primary }}>
                {multiplo ? "Chegou coisa nova pra você" : `Chegou o módulo ${grupoAtual.modulos[0].nome}`}
              </Text>
            </View>
          </View>

          <View style={{ gap: space[4] }}>
            {grupoAtual.modulos.map((modulo) => (
              <View key={modulo.id}>
                {multiplo ? <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{modulo.nome}</Text> : null}
                {modulo.descricao ? <Text style={{ ...type.body, color: color.text.secondary }}>{modulo.descricao}</Text> : null}
              </View>
            ))}
          </View>

          <View style={{ gap: space[2] }}>
            <Button label="Entendi" variant="primary" fullWidth onPress={entendi} />
            <Button label="Não mostrar mais" variant="ghost" fullWidth onPress={naoMostrarMais} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
