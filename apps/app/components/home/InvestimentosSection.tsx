import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { HoverLift, Reveal, chart, color, content, motion, radius, space, type } from "@serdono/ui";

/**
 * Seção "mentoria em investimentos" da landing (SDD-55).
 *
 * **O texto desta seção descreve só o que existe:** a Mary responde sobre
 * finanças e investimentos a partir da base curada (SDD-21), citando fonte e
 * data em toda afirmação (RN-20), e todo conteúdo sensível carrega o aviso de
 * não substituir profissional habilitado (RN-21). Ela **ensina a decidir** —
 * não indica carteira, não promete dado de mercado ao vivo e não personaliza
 * recomendação de aplicação, que é atividade regulada (CVM). Se algum dia o
 * produto passar a fazer isso, o texto muda junto; até lá, nenhuma frase aqui
 * pode sugerir que já faz.
 *
 * **A imagem é um mockup ilustrativo**, escolhido pelo dono do produto em
 * 02/08/2026 para comunicar a ideia com impacto visual. Duas decisões
 * deliberadas dentro dessa escolha: os ativos são **categorias reais**
 * (Tesouro Selic, CDB, LCI) e não fundos de instituições nomeadas — usar
 * marca de terceiro numa peça de venda é um problema separado e evitável — e
 * o rótulo "exemplo ilustrativo" fica visível no próprio card.
 */

const alocacao = [
  { nome: "Tesouro Selic", papel: "Reserva de emergência", pct: 40, cor: chart.ramp[4] },
  { nome: "CDB de liquidez diária", papel: "Sobra de caixa do mês", pct: 30, cor: chart.ramp[3] },
  { nome: "LCI", papel: "Dinheiro que não vai precisar tão cedo", pct: 20, cor: chart.ramp[2] },
  { nome: "Fundo DI", papel: "Giro de curto prazo", pct: 10, cor: chart.ramp[1] },
];

const pontosDeApoio = [
  "Quanto deixar parado como reserva antes de pensar em render mais",
  "A diferença entre poder sacar amanhã e render mais no fim do ano",
  "Por que o dinheiro do negócio e o seu não moram na mesma conta",
  "O que significa cada sigla, em português, sem você fingir que já sabia",
];

export function InvestimentosSection({ compact }: { compact: boolean }) {
  return (
    <View
      style={{
        backgroundColor: color.bg.surface,
        paddingVertical: space[16],
        paddingHorizontal: compact ? space[4] : space[10],
      }}
    >
      <View
        style={{
          maxWidth: content.maxWidthWide,
          width: "100%",
          alignSelf: "center",
          flexDirection: compact ? "column" : "row",
          alignItems: "center",
          gap: compact ? space[10] : space[12],
        }}
      >
        <Reveal style={{ flex: compact ? undefined : 1, width: compact ? "100%" : undefined }}>
          <Text style={{ ...type.overline, color: color.action.primaryHover, marginBottom: space[2] }}>
            MENTORIA EM INVESTIMENTOS
          </Text>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 26 : 34,
              lineHeight: compact ? 34 : 42,
              color: color.bg.brand,
              marginBottom: space[3],
            }}
          >
            O dinheiro que sobra também precisa trabalhar
          </Text>
          <Text style={{ ...type.bodyLg, color: color.text.secondary, marginBottom: space[5] }}>
            Faturar bem e deixar tudo parado na conta é perder dinheiro devagar. A Mary te explica o que fazer com a
            reserva do negócio e com a sobra de cada mês — em português comum, citando a fonte e a data de cada
            informação, pra você decidir sabendo.
          </Text>

          <View style={{ gap: space[3], marginBottom: space[5] }}>
            {pontosDeApoio.map((ponto) => (
              <View key={ponto} style={{ flexDirection: "row", gap: space[3], alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: radius.full,
                    backgroundColor: color.action.primary,
                    marginTop: 7,
                  }}
                />
                <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>{ponto}</Text>
              </View>
            ))}
          </View>

          {/* RN-21 no texto de venda, não só dentro do produto. */}
          <Text style={{ ...type.caption, color: color.text.muted }}>
            A Mary ensina a decidir e mostra os caminhos — ela não indica onde você deve pôr seu dinheiro nem substitui
            um profissional certificado.
          </Text>
        </Reveal>

        <Reveal
          delay={motion.revealStagger * 2}
          style={{ flex: compact ? undefined : 1, width: compact ? "100%" : undefined }}
        >
          <MockupCarteira />
        </Reveal>
      </View>
    </View>
  );
}

/** Curva de evolução — desenhada, não medida. Ver nota de topo do arquivo. */
const CURVA = "M0,86 C24,80 40,74 62,66 C84,58 100,60 124,50 C148,40 164,34 188,28 C212,22 228,16 252,8";

function MockupCarteira() {
  return (
    <HoverLift
      style={{
        backgroundColor: color.bg.canvas,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: color.border.default,
        overflow: "hidden",
        shadowColor: "#111827",
        shadowOpacity: 0.16,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
      }}
    >
      <View
        style={{
          backgroundColor: color.bg.brand,
          paddingHorizontal: space[5],
          paddingVertical: space[4],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ ...type.overline, color: color.action.primary }}>ONDE SEU DINHEIRO ESTÁ</Text>
          <Text style={{ ...type.h2, color: color.text.onBrand, marginTop: 2 }}>R$ 42.180</Text>
        </View>
        <View style={{ backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: 4 }}>
          <Text style={{ ...type.caption, color: color.text.onBrand, fontWeight: "700" }}>+8,4% no ano</Text>
        </View>
      </View>

      <View style={{ padding: space[5] }}>
        <Svg width="100%" height={96} viewBox="0 0 252 96">
          <Defs>
            <LinearGradient id="areaCarteira" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={chart.series} stopOpacity={0.22} />
              <Stop offset="1" stopColor={chart.series} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={`${CURVA} L252,96 L0,96 Z`} fill="url(#areaCarteira)" />
          <Path d={CURVA} stroke={chart.series} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Circle cx={252} cy={8} r={4} fill={chart.accent} />
        </Svg>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: space[2], marginBottom: space[4] }}>
          {["mar", "abr", "mai", "jun", "jul", "ago"].map((mes) => (
            <Text key={mes} style={{ ...type.caption, color: color.text.muted }}>
              {mes}
            </Text>
          ))}
        </View>

        <View style={{ gap: space[3] }}>
          {alocacao.map((item) => (
            <View key={item.nome}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{item.nome}</Text>
                <Text style={{ ...type.bodyStrong, color: color.text.primary, fontVariant: ["tabular-nums"] }}>
                  {item.pct}%
                </Text>
              </View>
              <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[1] }}>{item.papel}</Text>
              <View style={{ height: 6, borderRadius: radius.full, backgroundColor: chart.track, overflow: "hidden" }}>
                <View style={{ width: `${item.pct}%`, height: "100%", backgroundColor: item.cor, borderRadius: radius.full }} />
              </View>
            </View>
          ))}
        </View>

        {/* Marcação obrigatória: os números acima são desenhados pra ilustrar a
            ideia, não uma leitura de mercado nem uma carteira sugerida. */}
        <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[4], textAlign: "center" }}>
          Exemplo ilustrativo — valores e proporções fictícios
        </Text>
      </View>
    </HoverLift>
  );
}
