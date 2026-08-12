import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, chart, color, radius, space, type } from "@serdono/ui";
import { NIVEL_INFO, type NivelNegocio } from "@serdono/core";
import { getCurrentSession, getUltimoSnapshotMaturidade, type MaturidadeSnapshotRow } from "@serdono/supabase";

/**
 * Resumo do Nível de Maturidade + Ser Dono Score na Início (pedido do dono
 * do produto, 12/08/2026) — só o nível e o score, sem as categorias (essas
 * ficam na tela do módulo). Some inteiro sem snapshot nenhum ainda (RN-2 —
 * nunca mostrar destino/dado que ainda não existe; a tela do módulo mesma
 * calcula o primeiro snapshot na primeira visita).
 */
export function MaturidadeResumoCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<MaturidadeSnapshotRow | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session || cancelado) return;
        const ultimo = await getUltimoSnapshotMaturidade(session.user.id);
        if (!cancelado) setSnapshot(ultimo);
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  if (loading || !snapshot) return null;

  const info = NIVEL_INFO[snapshot.nivel as NivelNegocio];

  return (
    <Card variant="default" padding={5}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space[3] }}>
        <View>
          <Text style={{ ...type.overline, color: color.text.muted }}>NÍVEL DO SEU NEGÓCIO</Text>
          <Text style={{ ...type.h3, color: color.text.primary, marginTop: 2 }}>
            {info.emoji} {info.label}
          </Text>
        </View>
        <Text style={{ ...type.h3, color: color.bg.brand }}>{snapshot.pontuacao_total}/1000</Text>
      </View>

      <View style={{ height: 6, borderRadius: radius.full, backgroundColor: chart.track, overflow: "hidden", marginBottom: space[4] }}>
        <View style={{ width: `${Math.round((snapshot.pontuacao_total / 1000) * 100)}%`, height: "100%", backgroundColor: chart.series, borderRadius: radius.full }} />
      </View>

      <Button
        label="Ver Ser Dono Score"
        variant="ghost"
        size="sm"
        onPress={() => router.push("/maturidade")}
        style={{ alignSelf: "flex-start" }}
      />
    </Card>
  );
}
