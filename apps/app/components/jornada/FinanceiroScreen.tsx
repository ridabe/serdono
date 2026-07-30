import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { advanceFase, type JornadaEtapa, type JornadaInstance } from "@serdono/supabase";
import { Button, Card, Input, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import { formatMoney } from "../diagnostico/labels";
import { useFinanceiro } from "./useFinanceiro";

interface FinanceiroScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

function parseMoeda(texto: string): number {
  const limpo = texto.replace(/[^\d]/g, "");
  return limpo ? Number(limpo) : 0;
}

function parseNumero(texto: string): number {
  const limpo = texto.replace(/[^\d.,]/g, "").replace(",", ".");
  return limpo ? Number(limpo) : 0;
}

function ResultBlock({
  titulo,
  valor,
  formula,
  explicacao,
  destaque,
}: {
  titulo: string;
  valor: string;
  formula: string;
  explicacao: string;
  destaque?: "danger" | "success";
}) {
  return (
    <Card variant="outline" padding={5}>
      <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>{titulo.toUpperCase()}</Text>
      <Text
        style={{
          ...type.display,
          fontSize: 26,
          color: destaque === "danger" ? color.state.danger : destaque === "success" ? color.state.success : color.bg.brand,
          marginBottom: space[2],
        }}
      >
        {valor}
      </Text>
      <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.sm, padding: space[3], marginBottom: space[2] }}>
        <Text style={{ ...type.mono, color: color.text.secondary }}>{formula}</Text>
      </View>
      <Text style={{ ...type.body, color: color.text.secondary }}>{explicacao}</Text>
    </Card>
  );
}

export function FinanceiroScreen({ jornada, etapas, onEtapasChanged }: FinanceiroScreenProps) {
  const router = useRouter();
  const v = useFinanceiro(jornada, etapas, onEtapasChanged);

  async function handleAdvance() {
    try {
      await advanceFase(jornada.id, "marketing");
      router.replace("/jornada");
    } catch {
      // erro já fica visível via v.error na próxima ação; avançar de fase raramente falha sozinho
    }
  }

  if (v.loading || !v.inputs || !v.resultado) {
    return (
      <View style={{ gap: space[5] }}>
        <Text style={{ ...type.h2, color: color.text.primary }}>Fase Financeiro — Planejamento Financeiro</Text>
        <Text style={{ ...type.body, color: color.text.secondary }}>Calculando sugestão inicial...</Text>
      </View>
    );
  }

  const { inputs, resultado } = v;
  const concluida = v.etapa?.status === "concluida";

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="jornada" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>
            Fase Financeiro — Planejamento Financeiro
          </Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Ajuste os valores abaixo e veja os 6 números mudarem na hora — a ideia não é só te dar a resposta, é te
            ensinar a fazer essa conta sozinho.
          </Text>
        </View>
      </View>

      <Card variant="brand" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>
          Estes números são uma estimativa de partida — não substituem um contador na hora de decidir de verdade.
        </Text>
        {v.etapa?.template.dica ? (
          <Text style={{ ...type.body, color: "#C7D3E3", marginTop: space[1] }}>{v.etapa.template.dica}</Text>
        ) : null}
      </Card>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <Card variant="default" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Seus valores</Text>

        <Input
          label="Quanto você tem disponível hoje?"
          keyboardType="numeric"
          value={String(inputs.capitalDisponivel)}
          onChangeText={(t) => v.updateInput("capitalDisponivel", parseMoeda(t))}
        />
        <Input
          label="Investimento inicial (gasto único pra abrir)"
          keyboardType="numeric"
          value={String(inputs.investimentoInicial)}
          onChangeText={(t) => v.updateInput("investimentoInicial", parseMoeda(t))}
        />
        <Input
          label="Custos fixos por mês (aluguel, contas, mensalidades)"
          keyboardType="numeric"
          value={String(inputs.custosFixosMensais)}
          onChangeText={(t) => v.updateInput("custosFixosMensais", parseMoeda(t))}
        />
        <Input
          label="Receita mensal esperada"
          keyboardType="numeric"
          value={String(inputs.receitaMensalEsperada)}
          onChangeText={(t) => v.updateInput("receitaMensalEsperada", parseMoeda(t))}
        />
        <Input
          label="Margem de contribuição (%) — o que sobra da venda antes dos custos fixos"
          keyboardType="numeric"
          value={String(inputs.margemContribuicaoPct)}
          onChangeText={(t) => v.updateInput("margemContribuicaoPct", parseNumero(t))}
        />
        <Input
          label="Meses de capital de giro"
          keyboardType="numeric"
          value={String(inputs.mesesCapitalGiro)}
          onChangeText={(t) => v.updateInput("mesesCapitalGiro", parseNumero(t))}
        />
        <Input
          label="Meses de reserva de emergência"
          keyboardType="numeric"
          value={String(inputs.mesesReserva)}
          onChangeText={(t) => v.updateInput("mesesReserva", parseNumero(t))}
        />

        <Button label="Salvar meus números" variant="outline" loading={v.saving} onPress={v.salvar} />
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
        <View style={{ flexBasis: "100%" }}>
          <ResultBlock
            titulo="Investimento inicial"
            valor={formatMoney(resultado.investimentoInicial)}
            formula="Investimento inicial = valor que você definiu pra abrir (equipamento, estoque, reforma, taxas)"
            explicacao={`Com ${formatMoney(inputs.capitalDisponivel)} disponíveis, sobram ${formatMoney(
              resultado.saldoAposInvestimento
            )} logo depois de investir — é esse valor que vai bancar o capital de giro e a reserva a seguir.`}
            destaque={resultado.saldoAposInvestimento < 0 ? "danger" : undefined}
          />
        </View>

        <View style={{ flexBasis: "100%" }}>
          <ResultBlock
            titulo="Capital de giro"
            valor={formatMoney(resultado.capitalGiro)}
            formula="Capital de giro = Custos fixos mensais × Meses de capital de giro"
            explicacao="Dinheiro separado pra pagar as contas nos meses em que a receita ainda não cobre tudo sozinha — sem ele, um mês fraco pode travar o negócio mesmo ele sendo viável no longo prazo."
          />
        </View>

        <View style={{ flexBasis: "100%" }}>
          <ResultBlock
            titulo="Reserva de emergência"
            valor={formatMoney(resultado.reservaEmergencia)}
            formula="Reserva = Custos fixos mensais × Meses de reserva"
            explicacao="Diferente do capital de giro (que é o plano esperado), essa reserva é pra imprevisto — conserto, equipamento que quebra, mês de demanda muito baixa. Não conte com ela pro dia a dia."
          />
        </View>

        <View style={{ flexBasis: "100%" }}>
          <ResultBlock
            titulo="Ponto de equilíbrio mensal"
            valor={formatMoney(resultado.pontoEquilibrioMensal)}
            formula="Ponto de equilíbrio = Custos fixos mensais ÷ (Margem de contribuição ÷ 100)"
            explicacao="Quanto você precisa faturar por mês só pra não ter prejuízo — abaixo disso, cada mês fecha no vermelho; acima, começa a sobrar."
          />
        </View>

        <View style={{ flexBasis: "100%" }}>
          <ResultBlock
            titulo="Lucro esperado mensal"
            valor={formatMoney(resultado.lucroEsperadoMensal)}
            formula="Lucro esperado = (Receita mensal × Margem de contribuição ÷ 100) − Custos fixos mensais"
            explicacao="O que deve sobrar todo mês depois de bater a meta de receita que você colocou acima — é o número pra comparar com o ponto de equilíbrio."
            destaque={resultado.lucroEsperadoMensal < 0 ? "danger" : "success"}
          />
        </View>

        <View style={{ flexBasis: "100%" }}>
          <Card variant="outline" padding={5}>
            <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>
              FLUXO DE CAIXA — PRÓXIMOS 12 MESES
            </Text>
            <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.sm, padding: space[3], marginBottom: space[3] }}>
              <Text style={{ ...type.mono, color: color.text.secondary }}>
                Saldo do mês = Saldo do mês anterior + Lucro esperado mensal (saldo inicial = capital disponível −
                investimento inicial)
              </Text>
            </View>

            {resultado.mesEmQueSaldoFicaNegativo !== null ? (
              <View
                style={{
                  backgroundColor: color.state.dangerBg,
                  borderRadius: radius.sm,
                  padding: space[3],
                  marginBottom: space[3],
                }}
              >
                <Text style={{ ...type.bodyStrong, color: color.state.danger }}>
                  {resultado.mesEmQueSaldoFicaNegativo === 0
                    ? "Seu saldo já começa negativo — o investimento inicial sozinho passa do que você tem disponível."
                    : `Nos valores atuais, seu saldo fica negativo no mês ${resultado.mesEmQueSaldoFicaNegativo}. Ajuste a receita, os custos ou o investimento pra ver o que muda.`}
                </Text>
              </View>
            ) : (
              <View style={{ backgroundColor: color.state.successBg, borderRadius: radius.sm, padding: space[3], marginBottom: space[3] }}>
                <Text style={{ ...type.bodyStrong, color: color.state.success }}>
                  Nos valores atuais, seu saldo se mantém positivo nos 12 meses projetados.
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
              {resultado.fluxoCaixa12Meses.map((m) => (
                <View
                  key={m.mes}
                  style={{
                    flexBasis: "22%",
                    minWidth: 90,
                    backgroundColor: m.saldo < 0 ? color.state.dangerBg : color.bg.surface,
                    borderRadius: radius.sm,
                    padding: space[2],
                    borderWidth: 1,
                    borderColor: color.border.default,
                  }}
                >
                  <Text style={{ ...type.caption, color: color.text.muted }}>Mês {m.mes}</Text>
                  <Text
                    style={{
                      ...type.bodyStrong,
                      color: m.saldo < 0 ? color.state.danger : color.text.primary,
                    }}
                  >
                    {formatMoney(m.saldo)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      <Card variant="outline" padding={5}>
        <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
          <MaryAvatar pose={concluida ? "positivo" : "checklist"} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
              {concluida ? "Planejamento financeiro revisado!" : "Quando entender os números, marque como concluído"}
            </Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
              Pode voltar aqui e mudar os valores sempre que quiser — nada trava.
            </Text>
          </View>
        </View>
        <Button
          label={concluida ? "Desmarcar" : "Concluir"}
          variant={concluida ? "outline" : "primary"}
          fullWidth
          loading={v.toggling}
          onPress={v.toggleConcluido}
          style={{ marginTop: space[4] }}
        />
        {concluida ? (
          <Button label="Avançar para Marketing" variant="secondary" fullWidth onPress={handleAdvance} style={{ marginTop: space[3] }} />
        ) : null}
      </Card>
    </View>
  );
}
