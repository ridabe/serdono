import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { breakpoint, Button, Card, chart, color, radius, space, type } from "@serdono/ui";
import { agruparItensPorSemana, calcularProgressoPlanoAcao, formatarMesReferencia, type PlanoAcaoItemCore } from "@serdono/core";
import { signOut } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { ItemCheckRow } from "./PlanoAcaoItens";
import { exportPlanoAcaoPdf } from "./planoAcaoPdf";
import { usePlanoAcao } from "./usePlanoAcao";

/**
 * Tela principal do módulo Plano de Ação Mensal (pedido do dono do produto,
 * 08/08/2026). 3 estados: sem elegibilidade (Jornada não passou da Fase 2),
 * elegível sem plano do mês (convite pra gerar) e plano gerado (checklist +
 * progresso + PDF).
 */
export function PlanoAcaoScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < breakpoint.medium;
  const v = usePlanoAcao();
  const [baixando, setBaixando] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  async function handleBaixarPdf() {
    if (!v.plano) return;
    setBaixando(true);
    try {
      await exportPlanoAcaoPdf(v.plano.plano.mes_referencia, v.plano.plano.objetivo, v.plano.itens);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[
          { label: "← Painel", onPress: () => router.push("/inicio") },
          { label: "Ver histórico", onPress: () => router.push("/plano-acao/historico") },
          { label: "Sair", onPress: handleSignOut },
        ]}
      />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Plano de Ação Mensal</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Todo mês, um plano com um objetivo e 4 semanas de passos práticos, gerado a partir do seu negócio real.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : !v.elegivel ? (
          <BloqueioElegibilidade onIrParaJornada={() => router.push("/jornada")} />
        ) : !v.plano ? (
          <ConviteGerar mesAtual={v.mesAtual} gerando={v.gerando} onGerar={v.gerar} />
        ) : (
          <PlanoGerado
            mesReferenciaISO={v.plano.plano.mes_referencia}
            objetivo={v.plano.plano.objetivo}
            itens={v.plano.itens}
            compact={compact}
            baixando={baixando}
            onMarcar={v.marcarItem}
            onBaixarPdf={handleBaixarPdf}
            onVerHistorico={() => router.push("/plano-acao/historico")}
          />
        )}
      </ScrollView>
    </View>
  );
}

function BloqueioElegibilidade({ onIrParaJornada }: { onIrParaJornada: () => void }) {
  return (
    <Card variant="outline" padding={5}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>
        Ainda não deu pra desbloquear
      </Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
        O Plano de Ação Mensal libera depois que você concluir a Fase 2 (Validação da Ideia) da Jornada — é o mínimo de
        contexto do seu negócio que eu preciso pra montar um plano de verdade, em vez de algo genérico demais.
      </Text>
      <Button label="Ir para a Jornada" variant="primary" onPress={onIrParaJornada} style={{ alignSelf: "flex-start" }} />
    </Card>
  );
}

function ConviteGerar({ mesAtual, gerando, onGerar }: { mesAtual: string; gerando: boolean; onGerar: () => void }) {
  return (
    <Card variant="brand" padding={6}>
      <Text style={{ ...type.h2, color: color.text.onBrand, marginBottom: space[2] }}>
        Seu plano de {formatarMesReferencia(mesAtual)} ainda não foi gerado
      </Text>
      <Text style={{ ...type.body, color: color.bg.brandSubtle, marginBottom: space[4] }}>
        Eu vou olhar tudo o que você já construiu na Jornada — nicho, entregáveis, etapas concluídas — e montar um
        objetivo e 4 semanas de passos práticos pra este mês.
      </Text>
      <Button label="Gerar plano do mês" variant="primary" loading={gerando} onPress={onGerar} style={{ alignSelf: "flex-start" }} />
    </Card>
  );
}

function PlanoGerado({
  mesReferenciaISO,
  objetivo,
  itens,
  compact,
  baixando,
  onMarcar,
  onBaixarPdf,
  onVerHistorico,
}: {
  mesReferenciaISO: string;
  objetivo: string;
  itens: PlanoAcaoItemCore[];
  compact: boolean;
  baixando: boolean;
  onMarcar: (itemId: string, concluido: boolean) => void;
  onBaixarPdf: () => void;
  onVerHistorico: () => void;
}) {
  const progresso = calcularProgressoPlanoAcao(itens);
  const porSemana = agruparItensPorSemana(itens);

  return (
    <View style={{ gap: space[5] }}>
      <Card variant="brand" padding={6}>
        <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[2] }}>
          {formatarMesReferencia(mesReferenciaISO).toUpperCase()}
        </Text>
        <View style={{ flexDirection: compact ? "column" : "row", alignItems: compact ? "flex-start" : "center", gap: space[5] }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.h2, color: color.text.onBrand, marginBottom: space[2] }}>Objetivo: {objetivo}</Text>
            <Text style={{ ...type.body, color: color.bg.brandSubtle }}>
              {progresso.concluidos} de {progresso.total} atividades concluídas
            </Text>
          </View>
          <AnelProgressoPlano percentual={progresso.percentual} />
        </View>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
        {[1, 2, 3, 4].map((numero) => (
          <SemanaCard key={numero} numero={numero} itens={porSemana[numero]} compact={compact} onMarcar={onMarcar} />
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
        <Button label="Baixar PDF" variant="outline" loading={baixando} onPress={onBaixarPdf} />
        <Button label="Ver histórico e comparar meses" variant="ghost" onPress={onVerHistorico} />
      </View>
    </View>
  );
}

/** Medidor de razão (0–100%), mesma linguagem visual de `AnelProgresso` do Início — cor sempre com o percentual junto (DS-2). */
function AnelProgressoPlano({ percentual }: { percentual: number }) {
  const raio = 30;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = (Math.max(0, Math.min(100, percentual)) / 100) * circunferencia;

  return (
    <View style={{ width: 76, height: 76, alignItems: "center", justifyContent: "center" }}>
      <Svg width={76} height={76} accessibilityLabel={`Progresso do plano: ${percentual} por cento`}>
        <Circle cx={38} cy={38} r={raio} stroke="rgba(255,255,255,0.20)" strokeWidth={8} fill="none" />
        <Circle
          cx={38}
          cy={38}
          r={raio}
          stroke={chart.accent}
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${preenchido} ${circunferencia}`}
          transform="rotate(-90 38 38)"
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand, fontVariant: ["tabular-nums"] }}>{percentual}%</Text>
      </View>
    </View>
  );
}

const SEMANA_ACCENT = [chart.series, chart.accent, chart.series, chart.accent];

function SemanaCard({
  numero,
  itens,
  compact,
  onMarcar,
}: {
  numero: number;
  itens: PlanoAcaoItemCore[];
  compact: boolean;
  onMarcar: (itemId: string, concluido: boolean) => void;
}) {
  const progresso = calcularProgressoPlanoAcao(itens);
  return (
    // Grade de 2 colunas em telas largas, 1 coluna no celular — mesmo
    // princípio de `KpiCard` (flexBasis com folga, não `flex:1`, DS-24).
    <Card variant="default" padding={5} style={{ flexBasis: compact ? "100%" : "47%", flexGrow: 1, minWidth: 260 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space[3] }}>
        <Text style={{ ...type.h3, color: color.text.primary }}>Semana {numero}</Text>
        <View
          style={{
            backgroundColor: color.bg.surfaceAlt,
            borderRadius: radius.full,
            paddingHorizontal: space[3],
            paddingVertical: 2,
          }}
        >
          <Text style={{ ...type.caption, color: SEMANA_ACCENT[numero - 1], fontWeight: "700" }}>
            {progresso.concluidos}/{progresso.total}
          </Text>
        </View>
      </View>
      <View style={{ gap: space[3] }}>
        {itens.map((item) => (
          <ItemCheckRow key={item.id} item={item} onToggle={() => onMarcar(item.id, !item.concluido)} />
        ))}
      </View>
    </Card>
  );
}

