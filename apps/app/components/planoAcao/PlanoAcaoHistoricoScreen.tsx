import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, color, radius, space, type } from "@serdono/ui";
import { agruparItensPorSemana, calcularProgressoPlanoAcao, formatarMesReferencia } from "@serdono/core";
import type { PlanoAcaoComItens } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { CheckIcon, ItemCheckRow } from "./PlanoAcaoItens";
import { MAX_PLANOS_COMPARACAO, useHistoricoPlanoAcao } from "./useHistoricoPlanoAcao";

/** Histórico de planos gerados + seleção pra comparação lado a lado (SDD nova, pedido do dono do produto em 08/08/2026). */
export function PlanoAcaoHistoricoScreen() {
  const router = useRouter();
  const v = useHistoricoPlanoAcao();

  function handleComparar() {
    router.push({ pathname: "/plano-acao/comparar", params: { ids: Array.from(v.selecionados).join(",") } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Plano de Ação", onPress: () => router.push("/plano-acao") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Histórico de planos</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Selecione até {MAX_PLANOS_COMPARACAO} meses pra comparar lado a lado, ou toque num plano pra ver os detalhes.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : v.planos.length === 0 ? (
          <Card variant="outline" padding={5}>
            <Text style={{ ...type.body, color: color.text.muted }}>Nenhum plano gerado ainda.</Text>
          </Card>
        ) : (
          <View style={{ gap: space[3] }}>
            {v.planos.map((p) => (
              <PlanoHistoricoCard
                key={p.plano.id}
                planoComItens={p}
                selecionado={v.selecionados.has(p.plano.id)}
                onAlternarSelecao={() => v.alternarSelecao(p.plano.id)}
              />
            ))}
          </View>
        )}

        {v.selecionados.size >= 2 ? (
          <Button
            label={`Comparar ${v.selecionados.size} meses selecionados`}
            variant="primary"
            fullWidth
            onPress={handleComparar}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function PlanoHistoricoCard({
  planoComItens,
  selecionado,
  onAlternarSelecao,
}: {
  planoComItens: PlanoAcaoComItens;
  selecionado: boolean;
  onAlternarSelecao: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const { plano, itens } = planoComItens;
  const progresso = calcularProgressoPlanoAcao(itens);
  const porSemana = agruparItensPorSemana(itens);

  return (
    // Seleção indicada por borda/fundo tintado, não por trocar pra `variant="brand"`
    // (fundo escuro) — o conteúdo expandido (itens em `color.text.primary`) ficaria
    // ilegível em cima de um fundo escuro se a seleção usasse essa variante.
    <Card
      variant="outline"
      padding={5}
      style={selecionado ? { borderColor: color.action.secondary, borderWidth: 2, backgroundColor: color.action.primarySubtle } : undefined}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[3] }}>
        <Pressable
          onPress={onAlternarSelecao}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selecionado }}
          accessibilityLabel={`Selecionar ${formatarMesReferencia(plano.mes_referencia)} pra comparação`}
          style={{ marginTop: 2 }}
        >
          <CheckIcon checked={selecionado} />
        </Pressable>

        <Pressable style={{ flex: 1 }} onPress={() => setExpandido((v) => !v)} accessibilityRole="button">
          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{formatarMesReferencia(plano.mes_referencia)}</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginTop: 2 }} numberOfLines={expandido ? undefined : 1}>
            {plano.objetivo}
          </Text>
        </Pressable>

        <View style={{ alignItems: "flex-end" }}>
          <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: 4 }}>
            <Text style={{ ...type.caption, color: color.text.primary, fontWeight: "700" }}>{progresso.percentual}%</Text>
          </View>
          <Text onPress={() => setExpandido((v) => !v)} style={{ ...type.caption, color: color.action.secondary, marginTop: space[2] }}>
            {expandido ? "Ocultar" : "Ver semanas"}
          </Text>
        </View>
      </View>

      {expandido ? (
        <View style={{ gap: space[4], marginTop: space[4] }}>
          {[1, 2, 3, 4].map((numero) => (
            <View key={numero} style={{ gap: space[2] }}>
              <Text style={{ ...type.overline, color: color.text.muted }}>SEMANA {numero}</Text>
              {porSemana[numero].map((item) => (
                <ItemCheckRow key={item.id} item={item} />
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
