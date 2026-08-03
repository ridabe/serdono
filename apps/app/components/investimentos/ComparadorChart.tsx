import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { chart, color, radius, space, type } from "@serdono/ui";
import { APLICACAO_LABEL, type PontoProjecao, type TipoAplicacao } from "@serdono/core";

/**
 * Comparador de aplicações ao longo do tempo (DS-21, SDD-57).
 *
 * Forma escolhida pelo trabalho do dado: são 4 séries contínuas no tempo
 * comparadas entre si — linha, não barra. Uma linha por aplicação, mesma
 * escala, **um eixo só** (comparar reais com reais; dois eixos y é o erro
 * clássico que este arquivo não comete).
 *
 * Identidade nunca é só cor:
 *  - cada linha tem rótulo direto no fim (não só legenda);
 *  - o cenário do usuário é **tracejado**, porque é hipótese dele, não conta
 *    do produto — o traço carrega essa diferença mesmo em preto e branco;
 *  - a legenda abaixo repete nome + valor final.
 */

const SERIES: { tipo: TipoAplicacao; campo: keyof Omit<PontoProjecao, "mes">; cor: string; tracejada: boolean }[] = [
  { tipo: "cdb", campo: "cdb", cor: chart.categorical.cdb, tracejada: false },
  { tipo: "selic", campo: "selic", cor: chart.categorical.selic, tracejada: false },
  { tipo: "poupanca", campo: "poupanca", cor: chart.categorical.poupanca, tracejada: false },
  { tipo: "cenario_usuario", campo: "cenarioUsuario", cor: chart.categorical.cenario, tracejada: true },
];

const ALTURA = 200;
const LARGURA = 320;
const PAD_ESQ = 8;
const PAD_DIR = 46; // espaço pro rótulo direto no fim da linha
const PAD_TOPO = 12;
const PAD_BASE = 22;

function formatarCompacto(valor: number): string {
  if (Math.abs(valor) >= 1000) return `${(valor / 1000).toFixed(1).replace(".", ",")}k`;
  return String(Math.round(valor));
}

export function ComparadorChart({
  pontos,
  mostrarCenario,
}: {
  pontos: PontoProjecao[];
  /** O cenário só entra no gráfico quando o usuário informou um número — sem isso a linha seria uma reta plana sem significado. */
  mostrarCenario: boolean;
}) {
  const series = mostrarCenario ? SERIES : SERIES.filter((s) => s.tipo !== "cenario_usuario");

  const valores = pontos.flatMap((p) => series.map((s) => p[s.campo] as number));
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  // Uma folga de 6% evita a linha encostar na borda do desenho.
  const topo = maximo + (maximo - minimo) * 0.06 || maximo * 1.06;
  const base = Math.min(minimo, pontos[0]?.cdb ?? 0);
  const amplitude = topo - base || 1;

  const larguraUtil = LARGURA - PAD_ESQ - PAD_DIR;
  const alturaUtil = ALTURA - PAD_TOPO - PAD_BASE;
  const ultimoMes = pontos[pontos.length - 1]?.mes || 1;

  const x = (mes: number) => PAD_ESQ + (mes / ultimoMes) * larguraUtil;
  const y = (valor: number) => PAD_TOPO + alturaUtil - ((valor - base) / amplitude) * alturaUtil;

  const caminho = (campo: keyof Omit<PontoProjecao, "mes">) =>
    pontos.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.mes).toFixed(1)},${y(p[campo] as number).toFixed(1)}`).join(" ");

  // Ordena as séries pelo valor final pra escalonar o rótulo quando duas
  // linhas terminam quase no mesmo lugar (senão os textos se sobrepõem).
  const finais = series
    .map((s) => ({ ...s, valor: pontos[pontos.length - 1][s.campo] as number }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <View>
      <Svg width="100%" height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
        {/* Grade recessiva — 3 linhas, só pra dar referência de altura. */}
        {[0, 0.5, 1].map((f) => (
          <Line
            key={f}
            x1={PAD_ESQ}
            y1={PAD_TOPO + alturaUtil * f}
            x2={PAD_ESQ + larguraUtil}
            y2={PAD_TOPO + alturaUtil * f}
            stroke={chart.grid}
            strokeWidth={1}
          />
        ))}

        {series.map((s) => (
          <Path
            key={s.tipo}
            d={caminho(s.campo)}
            stroke={s.cor}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.tracejada ? "5 4" : undefined}
          />
        ))}

        {finais.map((s, i) => {
          const py = y(s.valor);
          // Empurra o rótulo pra baixo quando o anterior ficaria colado.
          const anterior = i > 0 ? y(finais[i - 1].valor) : -Infinity;
          const ajustado = py - anterior < 11 && i > 0 ? anterior + 11 : py;
          return (
            <React.Fragment key={s.tipo}>
              <Circle cx={x(ultimoMes)} cy={py} r={3.5} fill={s.cor} stroke={color.bg.surface} strokeWidth={2} />
              <SvgText
                x={x(ultimoMes) + 7}
                y={ajustado + 3.5}
                fontSize={9}
                fontFamily={type.caption.fontFamily}
                fill={color.text.secondary}
              >
                {formatarCompacto(s.valor)}
              </SvgText>
            </React.Fragment>
          );
        })}

        <SvgText x={PAD_ESQ} y={ALTURA - 6} fontSize={9} fontFamily={type.caption.fontFamily} fill={chart.axis}>
          hoje
        </SvgText>
        <SvgText
          x={PAD_ESQ + larguraUtil}
          y={ALTURA - 6}
          fontSize={9}
          fontFamily={type.caption.fontFamily}
          fill={chart.axis}
          textAnchor="end"
        >
          {ultimoMes} meses
        </SvgText>
      </Svg>

      {/* Legenda sempre presente com 2+ séries — o traço do cenário aparece
          aqui também, pra quem não distingue as cores. */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[3] }}>
        {series.map((s) => (
          <View key={s.tipo} style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
            {s.tracejada ? (
              <View style={{ flexDirection: "row", gap: 2 }}>
                {[0, 1, 2].map((n) => (
                  <View key={n} style={{ width: 4, height: 3, borderRadius: 1, backgroundColor: s.cor }} />
                ))}
              </View>
            ) : (
              <View style={{ width: 14, height: 3, borderRadius: radius.full, backgroundColor: s.cor }} />
            )}
            <Text style={{ ...type.caption, color: color.text.secondary }}>{APLICACAO_LABEL[s.tipo]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
