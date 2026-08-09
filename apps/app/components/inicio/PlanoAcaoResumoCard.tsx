import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, chart, color, radius, space, type } from "@serdono/ui";
import { agruparItensPorSemana, calcularProgressoPlanoAcao, formatarMesReferencia } from "@serdono/core";
import { usePlanoAcao } from "../planoAcao/usePlanoAcao";

/**
 * Resumo do Plano de Ação Mensal na Início (pedido do dono do produto,
 * 08/08/2026) — reaproveita `usePlanoAcao` (mesmo hook da tela do módulo,
 * `components/planoAcao/`) em vez de duplicar a lógica de elegibilidade/mês
 * corrente. Some inteiro pra quem não é elegível (RN-2 — nunca listar
 * destino indisponível); mostra convite pra gerar quando ainda não tem plano
 * do mês, ou o HISTÓRICO de status quando tem.
 *
 * **Só histórico/status, sem a ação em si** (pedido do dono do produto,
 * 08/08/2026) — a versão anterior listava os itens da semana corrente com
 * checkbox pra marcar, o que fazia a Início virar mais uma tela de tarefa em
 * vez de painel de acompanhamento. Marcar item continua exclusivo da tela do
 * módulo (`/plano-acao`); aqui é só "quanto já foi feito, o que falta".
 */
export function PlanoAcaoResumoCard() {
  const router = useRouter();
  const v = usePlanoAcao();

  if (v.loading || !v.elegivel) return null;

  if (!v.plano) {
    return (
      <Card variant="outline" padding={5}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space[4] }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Plano de Ação de {formatarMesReferencia(v.mesAtual)}</Text>
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>Ainda não gerado este mês</Text>
          </View>
          <Button label="Criar" variant="primary" size="sm" onPress={() => router.push("/plano-acao")} />
        </View>
      </Card>
    );
  }

  const progresso = calcularProgressoPlanoAcao(v.plano.itens);
  const porSemana = agruparItensPorSemana(v.plano.itens);

  return (
    <Card variant="default" padding={5}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space[1] }}>
        <View>
          <Text style={{ ...type.overline, color: color.text.muted }}>{formatarMesReferencia(v.plano.plano.mes_referencia).toUpperCase()}</Text>
          <Text style={{ ...type.h3, color: color.text.primary, marginTop: 2 }}>Plano de Ação Mensal</Text>
        </View>
        <Text style={{ ...type.h3, color: color.bg.brand }}>{progresso.percentual}%</Text>
      </View>
      <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
        {progresso.concluidos} de {progresso.total} atividades concluídas
      </Text>

      <View style={{ height: 6, borderRadius: radius.full, backgroundColor: chart.track, overflow: "hidden", marginBottom: space[4] }}>
        <View style={{ width: `${progresso.percentual}%`, height: "100%", backgroundColor: chart.series, borderRadius: radius.full }} />
      </View>

      {/* Histórico por semana — status, não os itens em si (marcar item é só
          na tela do módulo). */}
      <View style={{ flexDirection: "row", gap: space[2] }}>
        {[1, 2, 3, 4].map((numero) => (
          <SemanaStatusChip key={numero} numero={numero} itens={porSemana[numero]} />
        ))}
      </View>

      <Button
        label="Ver plano completo"
        variant="ghost"
        size="sm"
        onPress={() => router.push("/plano-acao")}
        style={{ alignSelf: "flex-start", marginTop: space[4] }}
      />
    </Card>
  );
}

function SemanaStatusChip({ numero, itens }: { numero: number; itens: { concluido: boolean }[] }) {
  const total = itens.length;
  const concluidos = itens.filter((i) => i.concluido).length;
  const status: "concluido" | "andamento" | "pendente" = total > 0 && concluidos === total ? "concluido" : concluidos > 0 ? "andamento" : "pendente";
  const tons = {
    concluido: { bg: color.state.successBg, fg: color.state.success },
    andamento: { bg: color.bg.brandSubtle, fg: color.bg.brand },
    pendente: { bg: color.bg.surfaceAlt, fg: color.text.muted },
  }[status];

  return (
    <View style={{ flex: 1, alignItems: "center", gap: space[1], backgroundColor: tons.bg, borderRadius: radius.md, paddingVertical: space[2] }}>
      <Text style={{ ...type.caption, fontWeight: "700", color: tons.fg }}>Sem {numero}</Text>
      <Text style={{ ...type.caption, fontSize: 10.5, color: tons.fg }}>
        {concluidos}/{total}
      </Text>
    </View>
  );
}
