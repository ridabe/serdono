import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, CollapsibleSection, Input, color, radius, space, type } from "@serdono/ui";
import {
  calcularResultadoMensal,
  formatarMesReferencia,
  gerarInsightRaioX,
  type ResultadoMensal,
} from "@serdono/core";
import { signOut, type DespesaDiariaRow, type FechamentoMensalRow } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { formatMoney } from "../diagnostico/labels";
import { useRaioXFinanceiro } from "./useRaioXFinanceiro";

function parseMoeda(texto: string): number {
  const limpo = texto.replace(/[^\d]/g, "");
  return limpo ? Number(limpo) : 0;
}

function hojeISO(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

/**
 * Tela do Raio-X Financeiro (pedido do dono do produto, 09/08/2026). 3
 * blocos: sem elegibilidade (Jornada nem começou), despesas do dia a dia
 * (sempre disponível) e fechamento do mês (formulário até fechar, resultado
 * depois — imutável até o mês seguinte).
 */
export function RaioXFinanceiroScreen() {
  const router = useRouter();
  const v = useRaioXFinanceiro();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[
          { label: "← Painel", onPress: () => router.push("/inicio") },
          { label: "Sair", onPress: handleSignOut },
        ]}
      />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Raio-X Financeiro</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Uma vez por mês, feche seu faturamento, despesas e retirada — e acompanhe como está evoluindo.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : !v.elegivel ? (
          <BloqueioElegibilidade onIrParaJornada={() => router.push("/jornada")} />
        ) : (
          <>
            <CollapsibleSection title="Despesas do dia a dia" accent="info" rightLabel={formatMoney(v.somaDespesasDoMes)} defaultExpanded={!v.fechamento}>
              <DespesasDoMes
                despesas={v.despesas}
                salvando={v.salvandoDespesa}
                onAdicionar={v.adicionarDespesa}
                onRemover={v.removerDespesa}
              />
            </CollapsibleSection>

            {v.fechamento ? (
              <ResultadoFechamento mesAtual={v.mesAtual} fechamento={v.fechamento} historico={v.historico} />
            ) : (
              <FechamentoForm
                mesAtual={v.mesAtual}
                sugestaoDespesas={v.somaDespesasDoMes}
                fechando={v.fechandoMes}
                onFechar={v.fecharMes}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function BloqueioElegibilidade({ onIrParaJornada }: { onIrParaJornada: () => void }) {
  return (
    <Card variant="outline" padding={5}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Ainda não deu pra desbloquear</Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
        O Raio-X Financeiro libera depois que você começar a Jornada — preciso saber qual é o seu negócio antes de
        acompanhar as finanças dele.
      </Text>
      <Button label="Ir para a Jornada" variant="primary" onPress={onIrParaJornada} style={{ alignSelf: "flex-start" }} />
    </Card>
  );
}

function DespesasDoMes({
  despesas,
  salvando,
  onAdicionar,
  onRemover,
}: {
  despesas: DespesaDiariaRow[];
  salvando: boolean;
  onAdicionar: (params: { data: string; tipo: string; descricao?: string; valor: number }) => Promise<boolean>;
  onRemover: (id: string) => void;
}) {
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);

  async function handleAdicionar() {
    if (!tipo.trim() || valor <= 0) return;
    const ok = await onAdicionar({ data: hojeISO(), tipo: tipo.trim(), descricao: descricao.trim() || undefined, valor });
    if (ok) {
      setTipo("");
      setDescricao("");
      setValor(0);
    }
  }

  return (
    <View style={{ gap: space[4] }}>
      <Text style={{ ...type.body, color: color.text.secondary }}>
        Lance aqui qualquer despesa do dia a dia (aluguel, insumo, frete, o que for) — a soma delas vira a sugestão de
        "quanto gastou" na hora de fechar o mês.
      </Text>

      <View style={{ gap: space[2] }}>
        <Input label="Tipo da despesa" placeholder="Ex.: Aluguel, insumo, frete" value={tipo} onChangeText={setTipo} />
        <Input label="Descrição (opcional)" placeholder="Detalhe curto" value={descricao} onChangeText={setDescricao} />
        <Input label="Valor" keyboardType="numeric" placeholder="R$ 0" value={valor ? String(valor) : ""} onChangeText={(t) => setValor(parseMoeda(t))} />
        <Button label="Lançar despesa" variant="outline" loading={salvando} disabled={!tipo.trim() || valor <= 0} onPress={handleAdicionar} />
      </View>

      {despesas.length === 0 ? (
        <Text style={{ ...type.caption, color: color.text.muted }}>Nenhuma despesa lançada este mês ainda.</Text>
      ) : (
        <View style={{ gap: space[2] }}>
          {despesas.map((d) => (
            <View key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{d.tipo}</Text>
                <Text style={{ ...type.caption, color: color.text.muted }}>
                  {new Date(`${d.data}T12:00:00`).toLocaleDateString("pt-BR")}
                  {d.descricao ? ` · ${d.descricao}` : ""}
                </Text>
              </View>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{formatMoney(d.valor)}</Text>
              <Pressable onPress={() => onRemover(d.id)} accessibilityRole="button" accessibilityLabel={`Remover despesa ${d.tipo}`} hitSlop={8}>
                <Text style={{ ...type.body, color: color.state.danger }}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function FechamentoForm({
  mesAtual,
  sugestaoDespesas,
  fechando,
  onFechar,
}: {
  mesAtual: string;
  sugestaoDespesas: number;
  fechando: boolean;
  onFechar: (params: { faturamento: number; despesas: number; retiradaSocio: number }) => Promise<boolean>;
}) {
  const [faturamento, setFaturamento] = useState(0);
  const [despesas, setDespesas] = useState(sugestaoDespesas);
  const [retirada, setRetirada] = useState(0);
  const [tocouDespesas, setTocouDespesas] = useState(false);

  const despesasExibidas = tocouDespesas ? despesas : sugestaoDespesas;

  return (
    <Card variant="brand" padding={5}>
      <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>Fechamento de {formatarMesReferencia(mesAtual)}</Text>
      <Text style={{ ...type.body, color: color.bg.brandSubtle, marginTop: space[1], marginBottom: space[4] }}>
        Confirme os 3 números do mês — é só uma vez, dá pra ajustar antes de fechar.
      </Text>

      <View style={{ backgroundColor: color.bg.surface, borderRadius: radius.lg, padding: space[4], gap: space[3] }}>
        <Input label="Quanto você faturou?" keyboardType="numeric" value={faturamento ? String(faturamento) : ""} onChangeText={(t) => setFaturamento(parseMoeda(t))} placeholder="R$ 0" />
        <View>
          <Input
            label="Quanto aproximadamente gastou?"
            keyboardType="numeric"
            value={despesasExibidas ? String(despesasExibidas) : ""}
            onChangeText={(t) => {
              setTocouDespesas(true);
              setDespesas(parseMoeda(t));
            }}
            placeholder="R$ 0"
          />
          <Text style={{ ...type.caption, color: color.text.muted, marginTop: -space[3], marginBottom: space[3] }}>
            Sugestão calculada a partir das despesas do dia a dia que você lançou este mês ({formatMoney(sugestaoDespesas)}) — pode ajustar
            antes de confirmar.
          </Text>
        </View>
        <Input label="Quanto retirou para você?" keyboardType="numeric" value={retirada ? String(retirada) : ""} onChangeText={(t) => setRetirada(parseMoeda(t))} placeholder="R$ 0" />

        <Button
          label="Fechar o mês"
          variant="primary"
          fullWidth
          loading={fechando}
          disabled={faturamento <= 0}
          onPress={() => onFechar({ faturamento, despesas: despesasExibidas, retiradaSocio: retirada })}
        />
      </View>
    </Card>
  );
}

function ResultadoFechamento({
  mesAtual,
  fechamento,
  historico,
}: {
  mesAtual: string;
  fechamento: FechamentoMensalRow;
  historico: FechamentoMensalRow[];
}) {
  const resultado = calcularResultadoMensal(fechamento.faturamento, fechamento.despesas);
  const anterior = historico.find((f) => f.mes_referencia !== mesAtual) ?? null;
  const resultadoAnterior = anterior ? calcularResultadoMensal(anterior.faturamento, anterior.despesas) : null;
  const insight = gerarInsightRaioX(resultado, resultadoAnterior);

  return (
    <View style={{ gap: space[5] }}>
      <Card variant="default" padding={5}>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[4] }}>{formatarMesReferencia(mesAtual)}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4] }}>
          <NumeroDestaque titulo="Faturamento" valor={formatMoney(resultado.faturamento)} />
          <NumeroDestaque titulo="Despesas" valor={formatMoney(resultado.despesas)} />
          <NumeroDestaque
            titulo="Resultado estimado"
            valor={formatMoney(resultado.resultado)}
            destaque={resultado.resultado >= 0 ? "success" : "danger"}
          />
          <NumeroDestaque titulo="Margem estimada" valor={resultado.margemPct != null ? `${resultado.margemPct.toFixed(1).replace(".", ",")}%` : "—"} />
        </View>
        <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[3] }}>
          Retirada pra você neste mês: {formatMoney(fechamento.retirada_socio)}
        </Text>
      </Card>

      <Card variant="brand" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>{insight.texto}</Text>
      </Card>

      {historico.length > 1 ? <ComparativoMensal historico={historico} /> : null}
    </View>
  );
}

function NumeroDestaque({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: "success" | "danger" }) {
  return (
    <View style={{ minWidth: 140, flexGrow: 1 }}>
      <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>{titulo.toUpperCase()}</Text>
      <Text style={{ ...type.h2, color: destaque === "danger" ? color.state.danger : destaque === "success" ? color.state.success : color.text.primary }}>
        {valor}
      </Text>
    </View>
  );
}

/** Comparativo mês a mês, dentro do próprio card com título — usado na tela do módulo. Reaproveita `GraficoComparativoBarras` (também usado sozinho no resumo da Início, `RaioXResumoCard.tsx`). */
function ComparativoMensal({ historico }: { historico: FechamentoMensalRow[] }) {
  return (
    <Card variant="default" padding={5}>
      <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Comparativo mês a mês</Text>
      <GraficoComparativoBarras historico={historico} />
    </Card>
  );
}

/** Só o gráfico de barras (sem `Card`/título) — sem lib de gráfico (nenhuma instalada no projeto), `View`s com altura proporcional ao maior valor da série. Exportado pra ser reaproveitado no resumo da Início (`RaioXResumoCard.tsx`), que já tem seu próprio `Card`/título e não pode aninhar outro. */
export function GraficoComparativoBarras({ historico }: { historico: FechamentoMensalRow[] }) {
  // Mais antigo primeiro na leitura da esquerda pra direita, mesmo padrão de leitura de linha do tempo.
  const meses = [...historico].reverse().slice(-6);
  const resultados: (ResultadoMensal & { mes: string })[] = meses.map((m) => ({
    mes: m.mes_referencia,
    ...calcularResultadoMensal(m.faturamento, m.despesas),
  }));
  const maiorValor = Math.max(1, ...resultados.flatMap((r) => [r.faturamento, r.despesas]));
  const ALTURA_MAX = 96;

  return (
    <View>
      <View style={{ flexDirection: "row", gap: space[3], marginBottom: space[4] }}>
        <LegendaBarra cor={color.bg.brand} label="Faturamento" />
        <LegendaBarra cor={color.state.danger} label="Despesas" />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", gap: space[3] }}>
        {resultados.map((r) => (
          <View key={r.mes} style={{ alignItems: "center", gap: space[1] }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: ALTURA_MAX }}>
              <View
                style={{
                  width: 18,
                  height: Math.max(4, (r.faturamento / maiorValor) * ALTURA_MAX),
                  backgroundColor: color.bg.brand,
                  borderRadius: radius.sm,
                }}
              />
              <View
                style={{
                  width: 18,
                  height: Math.max(4, (r.despesas / maiorValor) * ALTURA_MAX),
                  backgroundColor: color.state.danger,
                  borderRadius: radius.sm,
                }}
              />
            </View>
            <Text style={{ ...type.caption, color: color.text.muted }}>{formatarMesReferencia(r.mes).split(" ")[0].slice(0, 3).toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LegendaBarra({ cor, label }: { cor: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space[1] }}>
      <View style={{ width: 10, height: 10, borderRadius: radius.sm, backgroundColor: cor }} />
      <Text style={{ ...type.caption, color: color.text.muted }}>{label}</Text>
    </View>
  );
}
