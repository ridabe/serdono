import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Card, color, IconBadge, moduleAccent, MODULE_ACCENT_CYCLE, space, type } from "@serdono/ui";
import { getCurrentSession, listMyModules, type MyModule } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { ModuleIcon } from "./ModuleIcon";
import { ROTA_POR_SLUG } from "./rotas";

/**
 * Catálogo de módulos (pedido do dono do produto, 08/08/2026: "design mais
 * moderno... ícones coloridos em SVG com relação direta ao módulo... flat e
 * sem detalhes"). Antes era só nome + descrição em texto; ganhou um
 * `IconBadge` colorido por módulo (`ModuleIcon.tsx`, cor cíclica de
 * `MODULE_ACCENT_CYCLE`, mesma paleta já usada na grade de fases da Início).
 */
export function ModulosScreen() {
  const router = useRouter();
  const [modules, setModules] = useState<MyModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setModules(await listMyModules(session.user.id));
      setLoading(false);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Voltar ao painel", onPress: () => router.push("/inicio") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Módulos</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Aqui aparecem os módulos liberados pra sua conta.
        </Text>

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : modules.length === 0 ? (
          <Card variant="outline" padding={6}>
            <Text style={{ ...type.body, color: color.text.secondary, textAlign: "center" }}>
              Nenhum módulo disponível ainda. Assim que um módulo novo for liberado pra sua conta, ele aparece aqui.
            </Text>
          </Card>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
            {modules.map((m, i) => {
              const rota = ROTA_POR_SLUG[m.slug];
              const accent = MODULE_ACCENT_CYCLE[i % MODULE_ACCENT_CYCLE.length];
              const card = (
                <Card variant="default" padding={5} style={{ minWidth: 220, flexGrow: 1 }}>
                  <IconBadge accent={accent} size={48}>
                    <ModuleIcon slug={m.slug} color={moduleAccent[accent].fg} size={22} />
                  </IconBadge>
                  <Text style={{ ...type.h3, color: color.text.primary, marginTop: space[3], marginBottom: space[1] }}>{m.nome}</Text>
                  {m.descricao ? <Text style={{ ...type.body, color: color.text.secondary }}>{m.descricao}</Text> : null}
                  <Text style={{ ...type.bodyStrong, color: rota ? color.action.secondary : color.text.muted, marginTop: space[3] }}>
                    {rota ? "Abrir →" : "Em preparação"}
                  </Text>
                </Card>
              );

              // Módulo liberado sem tela própria ainda não vira link morto
              // (RN-2) — aparece no catálogo com o estado real dele.
              return rota ? (
                <Pressable
                  key={m.id}
                  onPress={() => router.push(rota as never)}
                  accessibilityRole="link"
                  accessibilityLabel={`Abrir ${m.nome}`}
                  style={{ minWidth: 220, flexGrow: 1 }}
                >
                  {card}
                </Pressable>
              ) : (
                <View key={m.id} style={{ minWidth: 220, flexGrow: 1 }}>
                  {card}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
