import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import {
  Button,
  Card,
  CollapsibleSection,
  Input,
  SECTION_ACCENT_CYCLE,
  chart,
  color,
  radius,
  space,
  type,
} from "@serdono/ui";
import { APLICACAO_LABEL, PRAZOS_MESES, type ResultadoAplicacao, type ResultadoSimulacao } from "@serdono/core";
import type { Cotacoes, IndicadorMercado } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { formatMoney } from "../diagnostico/labels";
import { ComparadorChart } from "./ComparadorChart";
import { useInvestimentos } from "./useInvestimentos";

/**
 * Módulo Mentoria em Investimentos (PRD §12.6, SDD-56/SDD-57).
 *
 * A tela ensina a decidir e mostra número real — **não recomenda aplicação**
 * (RN-33). Toda projeção de renda fixa é aritmética sobre o CDI/Selic que
 * vieram da HG Brasil; a linha de renda variável só existe se o usuário
 * digitar um cenário, e é rotulada como cenário dele em todo lugar.
 */
export function InvestimentosScreen() {
  const router = useRouter();
  const v = useInvestimentos();

  if (v.loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Voltar ao painel", onPress: () => router.push("/inicio") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary }}>Mentoria em Investimentos</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
            O dinheiro que sobra também precisa trabalhar. Aqui você vê as taxas de hoje e compara, com a conta feita,
            o que cada caminho renderia — pra decidir sabendo, não no chute.
          </Text>
        </View>

        {v.error ? (
          <Card variant="outline" padding={4}>
            <Text style={{ ...type.body, color: color.state.danger }}>
              Não consegui buscar as cotações agora: {v.error}
            </Text>
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[2] }}>
              Sem a taxa do dia eu prefiro não mostrar conta nenhuma — um número velho aqui vale menos que número
              nenhum.
            </Text>
          </Card>
        ) : null}

        {v.cotacoes ? <PainelCotacoes cotacoes={v.cotacoes} /> : null}

        {v.reserva ? (
          <CollapsibleSection title="Quanto o seu negócio precisa ter guardado" accent={SECTION_ACCENT_CYCLE[0]}>
            <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
              Estes valores vêm do planejamento que você preencheu na fase Financeiro da Jornada — não é estimativa
              minha. Antes de pensar em render mais, é isso que precisa estar de pé.
            </Text>
            <View style={{ gap: space[3] }}>
              <LinhaValor
                titulo="Reserva de emergência"
                valor={v.reserva.reservaEmergencia}
                apoio="Precisa poder ser sacado a qualquer momento, sem perder valor"
              />
              <LinhaValor
                titulo="Capital de giro"
                valor={v.reserva.capitalGiro}
                apoio="O que segura a operação nos meses em que a receita atrasa"
              />
            </View>
          </CollapsibleSection>
        ) : (
          <Card variant="outline" padding={5}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>
              Quanto o seu negócio precisa ter guardado
            </Text>
            <Text style={{ ...type.body, color: color.text.secondary }}>
              Assim que você preencher o planejamento da fase Financeiro na Jornada, eu mostro aqui a sua reserva de
              emergência e o capital de giro — calculados com os seus números, nunca com um valor de exemplo.
            </Text>
            <Button
              label="Abrir a Jornada"
              variant="ghost"
              size="sm"
              onPress={() => router.push("/jornada")}
              style={{ alignSelf: "flex-start", marginTop: space[3] }}
            />
          </Card>
        )}

        {v.simulacao && v.cotacoes ? (
          <CollapsibleSection title="Comparar aplicações" accent={SECTION_ACCENT_CYCLE[1]}>
            <Comparador
              simulacao={v.simulacao}
              cotacoes={v.cotacoes}
              cenarioInformado={v.cenarioInformado}
              valorInicial={v.valorInicial}
              setValorInicial={v.setValorInicial}
              meses={v.meses}
              setMeses={v.setMeses}
              percentualCdi={v.percentualCdi}
              setPercentualCdi={v.setPercentualCdi}
              cenarioPct={v.cenarioPct}
              setCenarioPct={v.setCenarioPct}
            />
          </CollapsibleSection>
        ) : null}

        <CollapsibleSection title="Onde deixar cada parte do dinheiro" accent={SECTION_ACCENT_CYCLE[2]}>
          <View style={{ gap: space[4] }}>
            <Bolso
              titulo="O que pode precisar amanhã"
              caracteristica="Liquidez diária, sem risco de perder valor no resgate"
              exemplos="Tesouro Selic, CDB de liquidez diária, fundo DI simples"
            />
            <Bolso
              titulo="O que não vai precisar por alguns meses"
              caracteristica="Aceita prazo em troca de render mais; sacar antes pode custar caro"
              exemplos="CDB com vencimento, LCI e LCA (isentas de IR pra pessoa física)"
            />
            <Bolso
              titulo="O que dá pra deixar anos parado"
              caracteristica="Pode oscilar bastante no meio do caminho — e pode terminar valendo menos"
              exemplos="Ações, fundos imobiliários, ETFs"
            />
          </View>
        </CollapsibleSection>

        <Card variant="brand" padding={5}>
          <Text style={{ ...type.bodyStrong, color: color.text.onBrand, marginBottom: space[1] }}>
            Ficou com dúvida em algum termo?
          </Text>
          <Text style={{ ...type.body, color: color.bg.brandSubtle, marginBottom: space[3] }}>
            Me pergunte em português comum — eu explico o que significa cada sigla e cito de onde tirei a informação.
          </Text>
          <Button
            label="Conversar comigo"
            variant="primary"
            size="sm"
            onPress={() => router.push("/assistente")}
            style={{ alignSelf: "flex-start" }}
          />
        </Card>

        {/* RN-33 + RN-21, na tela e não só nos Termos. */}
        <Text style={{ ...type.caption, color: color.text.muted }}>
          Eu mostro as contas e explico as diferenças, mas não indico onde você deve pôr seu dinheiro e não substituo
          um profissional certificado. Rentabilidade passada não garante rentabilidade futura, e o cenário de renda
          variável usa o número que você digitou — não é previsão minha.
        </Text>
      </ScrollView>
    </View>
  );
}

// ---- Cotações ----

function formatarIndicador(i: IndicadorMercado): string {
  if (i.unidade === "pct") return `${i.valor.toFixed(2).replace(".", ",")}%`;
  if (i.unidade === "pontos") return i.valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  // Câmbio precisa das casas decimais: `formatMoney` arredonda pra inteiro
  // (certo pra valor de negócio) e transformava o dólar em "R$ 5".
  if (i.unidade === "cambio") {
    return `R$ ${i.valor.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  }
  return formatMoney(i.valor);
}

function PainelCotacoes({ cotacoes }: { cotacoes: Cotacoes }) {
  const quando = new Date(cotacoes.capturadoEm);
  return (
    <Card variant="default" padding={5}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: space[4] }}>
        <Text style={{ ...type.h3, color: color.text.primary }}>Mercado hoje</Text>
        <Text style={{ ...type.caption, color: color.text.muted }}>
          {cotacoes.fonte} · {quando.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
        {cotacoes.indicadores.map((i) => (
          <View
            key={i.chave}
            style={{
              flexGrow: 1,
              flexBasis: 120,
              minWidth: 0,
              backgroundColor: color.bg.surfaceAlt,
              borderRadius: radius.md,
              padding: space[3],
            }}
          >
            <Text style={{ ...type.caption, color: color.text.muted }} numberOfLines={1}>
              {i.nome}
            </Text>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginTop: 2, fontVariant: ["tabular-nums"] }}>
              {formatarIndicador(i)}
            </Text>
            {i.variacaoPct != null ? (
              // Sinal e seta junto da cor — variação nunca é só verde/vermelho (DS-2).
              <Text
                style={{
                  ...type.caption,
                  color: i.variacaoPct >= 0 ? color.state.success : color.state.danger,
                  marginTop: 2,
                }}
              >
                {i.variacaoPct >= 0 ? "▲" : "▼"} {Math.abs(i.variacaoPct).toFixed(2).replace(".", ",")}%
              </Text>
            ) : (
              <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>ao ano</Text>
            )}
          </View>
        ))}
      </View>
    </Card>
  );
}

// ---- Comparador ----

function Comparador({
  simulacao,
  cotacoes,
  cenarioInformado,
  valorInicial,
  setValorInicial,
  meses,
  setMeses,
  percentualCdi,
  setPercentualCdi,
  cenarioPct,
  setCenarioPct,
}: {
  simulacao: ResultadoSimulacao;
  cotacoes: Cotacoes;
  cenarioInformado: boolean;
  valorInicial: string;
  setValorInicial: (v: string) => void;
  meses: number;
  setMeses: (m: number) => void;
  percentualCdi: string;
  setPercentualCdi: (v: string) => void;
  cenarioPct: string;
  setCenarioPct: (v: string) => void;
}) {
  const resultados: ResultadoAplicacao[] = [
    simulacao.cdb,
    simulacao.selic,
    simulacao.poupanca,
    ...(cenarioInformado ? [simulacao.cenarioUsuario] : []),
  ];
  const melhor = resultados.reduce((a, b) => (b.valorFinalLiquido > a.valorFinalLiquido ? b : a));

  return (
    <View>
      <Input label="Quanto você quer aplicar" value={valorInicial} onChangeText={setValorInicial} keyboardType="decimal-pad" />

      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Por quanto tempo</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[4] }}>
        {PRAZOS_MESES.map((p) => {
          const ativo = p === meses;
          return (
            <Pressable
              key={p}
              onPress={() => setMeses(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              style={{
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: space[4],
                borderRadius: radius.full,
                borderWidth: 1.5,
                borderColor: ativo ? color.action.secondary : color.border.default,
                backgroundColor: ativo ? color.action.secondary : "transparent",
              }}
            >
              <Text style={{ ...type.bodyStrong, color: ativo ? color.text.onBrand : color.text.secondary }}>
                {p} meses
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Input
        label="Quanto do CDI o seu CDB paga (%)"
        value={percentualCdi}
        onChangeText={setPercentualCdi}
        keyboardType="decimal-pad"
        placeholder="100"
      />
      <Text style={{ ...type.caption, color: color.text.muted, marginTop: -space[2], marginBottom: space[4] }}>
        O banco te diz esse número. Hoje o CDI está em {cotacoes.taxas.cdiAnualPct.toFixed(2).replace(".", ",")}% ao ano.
      </Text>

      <Input
        label="E se a renda variável rendesse... (% ao ano)"
        value={cenarioPct}
        onChangeText={setCenarioPct}
        keyboardType="decimal-pad"
        placeholder="deixe vazio ou teste um número, inclusive negativo"
      />
      <Text style={{ ...type.caption, color: color.text.muted, marginTop: -space[2], marginBottom: space[5] }}>
        Este número é seu, não meu: ninguém sabe quanto uma ação vai render. Teste um cenário bom e um ruim — é assim
        que dá pra enxergar o risco.
      </Text>

      <ComparadorChart pontos={simulacao.pontos} mostrarCenario={cenarioInformado} />

      <View style={{ gap: space[3], marginTop: space[5] }}>
        {resultados.map((r) => (
          <LinhaResultado key={r.tipo} resultado={r} destaque={r.tipo === melhor.tipo} />
        ))}
      </View>

      <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[4] }}>
        Valores líquidos, já descontado o imposto de renda da tabela regressiva (a poupança é isenta). A poupança está
        calculada sem a TR, que a fonte não fornece — na prática ela rende um pouquinho mais que o mostrado.
      </Text>
    </View>
  );
}

function LinhaResultado({ resultado, destaque }: { resultado: ResultadoAplicacao; destaque: boolean }) {
  const cor = chart.categorical[resultado.tipo === "cenario_usuario" ? "cenario" : resultado.tipo];
  const ehCenario = resultado.tipo === "cenario_usuario";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space[3],
        backgroundColor: destaque ? color.state.successBg : color.bg.surfaceAlt,
        borderRadius: radius.md,
        padding: space[3],
      }}
    >
      <View style={{ width: 4, alignSelf: "stretch", borderRadius: radius.full, backgroundColor: cor }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
          {APLICACAO_LABEL[resultado.tipo]}
          {ehCenario ? " (hipótese sua)" : ""}
        </Text>
        <Text style={{ ...type.caption, color: color.text.muted }}>
          {resultado.aliquotaIrPct > 0 ? `IR de ${resultado.aliquotaIrPct}% já descontado` : "sem IR nesta conta"}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, fontVariant: ["tabular-nums"] }}>
          {formatMoney(resultado.valorFinalLiquido)}
        </Text>
        <Text
          style={{
            ...type.caption,
            color: resultado.rendimentoLiquido >= 0 ? color.state.success : color.state.danger,
            fontVariant: ["tabular-nums"],
          }}
        >
          {resultado.rendimentoLiquido >= 0 ? "+" : "−"}
          {formatMoney(Math.abs(resultado.rendimentoLiquido))}
        </Text>
      </View>
      {/* Destaque nunca é só cor de fundo — o texto diz o que ele significa. */}
      {destaque ? (
        <Text style={{ ...type.overline, color: color.state.success }}>MAIOR{"\n"}RETORNO</Text>
      ) : null}
    </View>
  );
}

// ---- Blocos educativos ----

function LinhaValor({ titulo, valor, apoio }: { titulo: string; valor: number; apoio: string }) {
  return (
    <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4] }}>
      <Text style={{ ...type.overline, color: color.text.muted }}>{titulo.toUpperCase()}</Text>
      <Text style={{ ...type.h2, color: color.text.primary, marginTop: space[1] }}>{formatMoney(valor)}</Text>
      <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>{apoio}</Text>
    </View>
  );
}

function Bolso({ titulo, caracteristica, exemplos }: { titulo: string; caracteristica: string; exemplos: string }) {
  return (
    <View>
      <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{titulo}</Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginTop: 2 }}>{caracteristica}</Text>
      <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>
        Onde isso costuma ficar: {exemplos}
      </Text>
    </View>
  );
}
