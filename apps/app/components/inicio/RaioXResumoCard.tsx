import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Card, color, radius, space, type } from "@serdono/ui";
import { calcularResultadoMensal, gerarInsightRaioX } from "@serdono/core";
import { getCurrentSession, listUltimosFechamentos, type FechamentoMensalRow } from "@serdono/supabase";
import { GraficoComparativoBarras } from "../raioxFinanceiro/RaioXFinanceiroScreen";

/**
 * Resumo do Raio-X Financeiro na Início (pedido do dono do produto,
 * 09/08/2026) — **só o comparativo em barras + o comentário da Mary**, sem
 * repetir os 4 números do fechamento (esses já ficam na tela do módulo). Sem
 * elegibilidade própria: quem nunca fechou um mês simplesmente não tem
 * `historico`, então o card não renderiza nada (RN-2 — nunca mostrar
 * destino/dado que ainda não existe; a Início já tem o link pro módulo pelo
 * menu, não precisa de convite duplicado aqui).
 */
export function RaioXResumoCard() {
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<FechamentoMensalRow[]>([]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session || cancelado) return;
        const ultimos = await listUltimosFechamentos(session.user.id);
        if (!cancelado) setHistorico(ultimos);
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  if (loading || historico.length === 0) return null;

  const [atual, anterior] = historico;
  const resultadoAtual = calcularResultadoMensal(atual.faturamento, atual.despesas);
  const resultadoAnterior = anterior ? calcularResultadoMensal(anterior.faturamento, anterior.despesas) : null;
  const insight = gerarInsightRaioX(resultadoAtual, resultadoAnterior);

  return (
    <Card variant="default" padding={5}>
      <Text style={{ ...type.h3, color: color.text.primary, marginBottom: historico.length > 1 ? space[4] : space[3] }}>Raio-X Financeiro</Text>

      {historico.length > 1 ? <GraficoComparativoBarras historico={historico} /> : null}

      <View
        style={{
          backgroundColor: color.bg.brandSubtle,
          borderRadius: radius.md,
          padding: space[3],
          marginTop: historico.length > 1 ? space[4] : 0,
        }}
      >
        <Text style={{ ...type.body, color: color.bg.brand, fontWeight: "600" }}>{insight.texto}</Text>
      </View>
    </Card>
  );
}
