import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Card, color, moduleAccent, MODULE_ACCENT_CYCLE, radius, space, type } from "@serdono/ui";
import type { CategoriaComMateriais } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { CategoriaIcon } from "./DicasIcons";
import { useDicasDaMary } from "./useDicasDaMary";

const TILE_GAP = space[3];
const TILE_MIN_WIDTH = 150;

/** Quantas colunas cabem na largura disponível, sem esticar tile nenhum — cada um sempre com a MESMA largura (pedido do dono do produto, 10/08/2026). */
function useTileWidth(containerWidth: number) {
  const colunas = Math.max(2, Math.floor((containerWidth + TILE_GAP) / (TILE_MIN_WIDTH + TILE_GAP)));
  return (containerWidth - TILE_GAP * (colunas - 1)) / colunas;
}

/**
 * Hub "Dicas da Mary" — nível 1 (PRD §12.7, SPEC.md SDD-59/SDD-60): lista de
 * categorias. Navegação em duas telas (categoria → assuntos dela), não tudo
 * espremido numa sanfona só — pedido do dono do produto em 03/08/2026 pra
 * dar mais respiro visual e permitir várias categorias sem a tela virar uma
 * pilha infinita de acordeões abertos.
 *
 * **Redesenho "Trilha de estudo" (pedido do dono do produto, 09/08/2026,
 * escolhido entre 3 mocks apresentados)** — referência Duolingo/Headspace:
 * cards viraram tiles cheios de cor (não mais barra lateral fina), grade de
 * 2 colunas, ícone grande num círculo translúcido. Cor cicla por
 * `MODULE_ACCENT_CYCLE` (DS-23, mesma paleta do catálogo de módulos) — troca
 * de `SECTION_ACCENT_CYCLE` porque aqui o objetivo é identidade visual por
 * card, não o vocabulário de "acento de seção" da sanfona.
 */
export function DicasDaMaryScreen() {
  const router = useRouter();
  const v = useDicasDaMary();
  const { width } = useWindowDimensions();
  const tileWidth = useTileWidth(width - 2 * space[5]);

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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: TILE_GAP }}>
            {v.categorias.map((categoria, i) => (
              <CategoriaTile
                key={categoria.id}
                categoria={categoria}
                accent={MODULE_ACCENT_CYCLE[i % MODULE_ACCENT_CYCLE.length]}
                width={tileWidth}
                onPress={() => router.push(`/dicas-da-mary/${categoria.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CategoriaTile({
  categoria,
  accent,
  width,
  onPress,
}: {
  categoria: CategoriaComMateriais;
  accent: (typeof MODULE_ACCENT_CYCLE)[number];
  width: number;
  onPress: () => void;
}) {
  const tons = moduleAccent[accent];
  const qtd = categoria.materiais.length;

  return (
    // Largura calculada em `useTileWidth` (pedido do dono do produto,
    // 10/08/2026), não `flexGrow`/`flexBasis` percentual: com grow, o último
    // tile de uma linha ímpar (ex.: 5 categorias = última linha com 1 só)
    // esticava pra preencher a linha inteira, ficando maior que os outros —
    // largura precisa ser SEMPRE a mesma, não só "no mínimo" essa.
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir categoria ${categoria.titulo}`}
      style={{ width }}
    >
      <View
        style={{
          backgroundColor: tons.bg,
          borderRadius: radius.lg,
          padding: space[4],
          // Altura FIXA, não `minHeight` (mesmo pedido): antes um título de 2
          // linhas deixava o tile mais alto que os vizinhos de título curto.
          // 164 (não 132, achado real testando: com título de 2 linhas + selo
          // de contagem, o conteúdo passava de 150px de altura e vazava pra
          // fora da área colorida) — `overflow: hidden` como rede de segurança,
          // nunca deveria precisar cortar nada com a altura certa.
          height: 164,
          overflow: "hidden",
          justifyContent: "space-between",
          gap: space[3],
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.full,
            backgroundColor: "rgba(255,255,255,0.24)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CategoriaIcon color={tons.fg} size={20} />
        </View>

        <View>
          <Text style={{ ...type.bodyStrong, color: tons.fg }} numberOfLines={2}>
            {categoria.titulo}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(255,255,255,0.22)",
              borderRadius: radius.full,
              paddingHorizontal: space[3],
              paddingVertical: 3,
              marginTop: space[2],
            }}
          >
            <Text style={{ ...type.caption, color: tons.fg, fontWeight: "700" }}>
              {qtd === 0 ? "Em breve" : `${qtd} ${qtd === 1 ? "material" : "materiais"}`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
