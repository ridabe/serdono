import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Card, color, space, type } from "@serdono/ui";
import { agruparItensPorSemana, calcularProgressoPlanoAcao, formatarMesReferencia } from "@serdono/core";
import { getPlanosAcaoPorIds, type PlanoAcaoComItens } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { ItemCheckRow } from "./PlanoAcaoItens";

const LARGURA_COLUNA = 280;

/** Comparação lado a lado de 2-3 planos selecionados no histórico (SDD nova, 08/08/2026). */
export function PlanoAcaoComparacaoScreen() {
  const router = useRouter();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const idsArray = useMemo(() => (ids ? ids.split(",").filter(Boolean) : []), [ids]);

  const [planos, setPlanos] = useState<PlanoAcaoComItens[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (idsArray.length === 0) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await getPlanosAcaoPorIds(idsArray);
        // Mais antigo primeiro — leitura da esquerda pra direita, mesma ordem cronológica da Linha do tempo do Início.
        setPlanos([...data].sort((a, b) => a.plano.mes_referencia.localeCompare(b.plano.mes_referencia)));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [idsArray]);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Histórico", onPress: () => router.push("/plano-acao/historico") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Comparar meses</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Objetivo e progresso de cada mês, lado a lado.
          </Text>
        </View>

        {error ? <Text style={{ ...type.caption, color: color.state.danger }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : idsArray.length === 0 ? (
          <Card variant="outline" padding={5}>
            <Text style={{ ...type.body, color: color.text.muted }}>
              Nenhum mês selecionado — volte ao histórico e escolha pelo menos 2 planos pra comparar.
            </Text>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: space[4] }}>
              {planos.map((p) => (
                <ColunaMes key={p.plano.id} planoComItens={p} />
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

function ColunaMes({ planoComItens }: { planoComItens: PlanoAcaoComItens }) {
  const { plano, itens } = planoComItens;
  const progresso = calcularProgressoPlanoAcao(itens);
  const porSemana = agruparItensPorSemana(itens);

  return (
    <Card variant="default" padding={5} style={{ width: LARGURA_COLUNA }}>
      <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>
        {formatarMesReferencia(plano.mes_referencia).toUpperCase()}
      </Text>
      <Text style={{ ...type.h2, color: color.bg.brand }}>{progresso.percentual}%</Text>
      <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
        {progresso.concluidos} de {progresso.total} atividades concluídas
      </Text>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[4] }}>{plano.objetivo}</Text>

      <View style={{ gap: space[4] }}>
        {[1, 2, 3, 4].map((numero) => (
          <View key={numero} style={{ gap: space[2] }}>
            <Text style={{ ...type.overline, color: color.text.muted }}>SEMANA {numero}</Text>
            {porSemana[numero].map((item) => (
              <ItemCheckRow key={item.id} item={item} />
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}
