import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Card, SECTION_ACCENT_CYCLE, color, radius, space, type } from "@serdono/ui";
import type { CategoriaComMateriais } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { ChevronRightIcon } from "./DicasIcons";
import { useDicasDaMary } from "./useDicasDaMary";

/**
 * Hub "Dicas da Mary" — nível 1 (PRD §12.7, SPEC.md SDD-59/SDD-60): lista de
 * categorias. Navegação em duas telas (categoria → assuntos dela), não tudo
 * espremido numa sanfona só — pedido do dono do produto em 03/08/2026 pra
 * dar mais respiro visual e permitir várias categorias sem a tela virar uma
 * pilha infinita de acordeões abertos.
 */
export function DicasDaMaryScreen() {
  const router = useRouter();
  const v = useDicasDaMary();

  if (v.loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Voltar ao painel", onPress: () => router.push("/inicio") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary }}>Dicas da Mary</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
            Separei material por tema pra você estudar no seu ritmo — escolha uma categoria pra ver os assuntos dela.
          </Text>
        </View>

        {v.error ? (
          <Card variant="outline" padding={4}>
            <Text style={{ ...type.body, color: color.state.danger }}>Não consegui carregar agora: {v.error}</Text>
          </Card>
        ) : v.categorias.length === 0 ? (
          <Card variant="outline" padding={6}>
            <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center" }}>
              Ainda estou preparando o primeiro material. Assim que publicar, ele aparece aqui.
            </Text>
          </Card>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
            {v.categorias.map((categoria, i) => (
              <CategoriaCard
                key={categoria.id}
                categoria={categoria}
                accent={SECTION_ACCENT_CYCLE[i % SECTION_ACCENT_CYCLE.length]}
                onPress={() => router.push(`/dicas-da-mary/${categoria.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const ACCENT_HEX: Record<string, string> = {
  brand: color.bg.brand,
  gold: color.action.primaryHover,
  info: color.state.info,
  success: color.state.success,
  warning: color.state.warning,
  danger: color.state.danger,
};

function CategoriaCard({
  categoria,
  accent,
  onPress,
}: {
  categoria: CategoriaComMateriais;
  accent: string;
  onPress: () => void;
}) {
  const cor = ACCENT_HEX[accent] ?? color.bg.brand;
  const qtd = categoria.materiais.length;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir categoria ${categoria.titulo}`}
      style={{ flexGrow: 1, flexBasis: 280, minWidth: 260, maxWidth: 420 }}
    >
      <Card variant="default" padding={0} style={{ overflow: "hidden" }}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: 6, backgroundColor: cor }} />
          <View style={{ flex: 1, padding: space[5] }}>
            <Text style={{ ...type.h3, color: color.text.primary }} numberOfLines={1}>
              {categoria.titulo}
            </Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }} numberOfLines={2}>
              {categoria.descricao}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: space[4],
              }}
            >
              <View
                style={{
                  backgroundColor: color.bg.surfaceAlt,
                  borderRadius: radius.full,
                  paddingHorizontal: space[3],
                  paddingVertical: 4,
                }}
              >
                <Text style={{ ...type.caption, color: color.text.secondary, fontWeight: "700" }}>
                  {qtd} {qtd === 1 ? "assunto" : "assuntos"}
                </Text>
              </View>
              <ChevronRightIcon color={color.text.muted} />
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
