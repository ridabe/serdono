import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Card, color, ConfirmModal, IconBadge, moduleAccent, MODULE_ACCENT_CYCLE, space, type } from "@serdono/ui";
import { labelPlano } from "@serdono/core";
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
 *
 * Desde 17/08/2026 (cobrança via AbacatePay, RN-67), módulo acima do plano
 * atual continua aparecendo aqui (`bloqueado = true`, ver
 * `packages/supabase/modules.ts`) em vez de sumir do catálogo — cadeado no
 * card, e tocar abre um aviso convidando a trocar de plano em vez de abrir a
 * tela do módulo.
 *
 * Recarrega no FOCO da tela, não só no mount (`useFocusEffect`, pedido do
 * dono do produto, 28/08/2026) — quem acabou de assinar num checkout aberto
 * a partir daqui e volta pra esta tela (app instalado) precisa ver o cadeado
 * sumir sem precisar reabrir o app.
 */
export function ModulosScreen() {
  const router = useRouter();
  const [modules, setModules] = useState<MyModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduloBloqueado, setModuloBloqueado] = useState<MyModule | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const session = await getCurrentSession();
        if (!session) {
          setLoading(false);
          return;
        }
        setModules(await listMyModules(session.user.id));
        setLoading(false);
      })();
    }, [])
  );

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
                <Card variant="default" padding={5} style={{ minWidth: 220, flexGrow: 1, opacity: m.bloqueado ? 0.7 : 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
                    <IconBadge accent={accent} size={48}>
                      <ModuleIcon slug={m.slug} color={moduleAccent[accent].fg} size={22} />
                    </IconBadge>
                    {m.bloqueado ? <Text style={{ fontSize: 18 }}>🔒</Text> : null}
                  </View>
                  <Text style={{ ...type.h3, color: color.text.primary, marginTop: space[3], marginBottom: space[1] }}>{m.nome}</Text>
                  {m.descricao ? <Text style={{ ...type.body, color: color.text.secondary }}>{m.descricao}</Text> : null}
                  <Text
                    style={{
                      ...type.bodyStrong,
                      color: m.bloqueado ? color.state.warning : rota ? color.action.secondary : color.text.muted,
                      marginTop: space[3],
                    }}
                  >
                    {m.bloqueado ? `Plano ${labelPlano(m.planoMinimo as never)}` : rota ? "Abrir →" : "Em preparação"}
                  </Text>
                </Card>
              );

              // Módulo liberado sem tela própria ainda não vira link morto
              // (RN-2) — aparece no catálogo com o estado real dele. Módulo
              // bloqueado pelo plano (RN-67) sempre é tocável — leva ao
              // aviso de upsell, nunca fica inerte feito um "em preparação".
              return (
                <Pressable
                  key={m.id}
                  onPress={() => (m.bloqueado ? setModuloBloqueado(m) : rota ? router.push(rota as never) : undefined)}
                  accessibilityRole="link"
                  accessibilityLabel={m.bloqueado ? `${m.nome}, disponível no plano ${labelPlano(m.planoMinimo as never)}` : `Abrir ${m.nome}`}
                  style={{ minWidth: 220, flexGrow: 1 }}
                >
                  {card}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!moduloBloqueado}
        title={moduloBloqueado ? moduloBloqueado.nome : ""}
        message={
          moduloBloqueado
            ? `Esse módulo faz parte do plano ${labelPlano(moduloBloqueado.planoMinimo as never)}. Assine pra desbloquear.`
            : ""
        }
        confirmLabel="Ver planos"
        confirmVariant="primary"
        onConfirm={() => {
          setModuloBloqueado(null);
          router.push("/planos");
        }}
        onCancel={() => setModuloBloqueado(null)}
      />
    </View>
  );
}
