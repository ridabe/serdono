import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { icon } from "@serdono/ui";

export type TabIconName = "inicio" | "jornada" | "mary" | "modulos" | "perfil" | "sobre" | "dicas";

/**
 * Ícones da barra de abas nativa (DS-20).
 *
 * Desenhados aqui em `react-native-svg` em vez de virem de uma biblioteca:
 * o DESIGN_SYSTEM §7 registra Lucide como padrão futuro, mas ela ainda não
 * está instalada, e uma barra de abas sem ícone não é uma barra de abas.
 * Traço, tamanho e cor saem de tokens (`icon.md`, `icon.strokeWidth`) — DS-0.
 * Quando Lucide entrar no projeto, este arquivo sai inteiro.
 */
export function TabIcon({ name, color, size = icon.md }: { name: TabIconName; color: string; size?: number }) {
  const common = {
    stroke: color,
    strokeWidth: icon.strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "inicio" ? (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...common} />
          <Path d="M5.5 9.5V20h13V9.5" {...common} />
          <Path d="M9.75 20v-5.5h4.5V20" {...common} />
        </>
      ) : null}

      {/* Jornada: a trilha vertical com marcos — mesma metáfora da tela (SDD-33). */}
      {name === "jornada" ? (
        <>
          <Path d="M7 4v16" {...common} />
          <Circle cx={7} cy={7} r={2.2} {...common} />
          <Circle cx={7} cy={17} r={2.2} {...common} />
          <Path d="M12 7h7" {...common} />
          <Path d="M12 17h5" {...common} />
        </>
      ) : null}

      {name === "mary" ? (
        <>
          <Path d="M20 14.5c0 1.1-.9 2-2 2H9l-4 3.5V6c0-1.1.9-2 2-2h11c1.1 0 2 .9 2 2z" {...common} />
          <Path d="M9 8.5h6M9 12h4" {...common} />
        </>
      ) : null}

      {/* Dicas da Mary: documento com dobra + play — mesmo glifo já usado nas
          categorias da tela (`DicaIcon`, DS-24), reaproveitado aqui pra
          identidade visual consistente entre os dois lugares. */}
      {name === "dicas" ? (
        <>
          <Path d="M6.5 3.5h8l4 4V19a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" {...common} />
          <Path d="M14.5 3.5V8h4" {...common} />
          <Path d="M10 12l4 2.3-4 2.3z" {...common} />
        </>
      ) : null}

      {name === "modulos" ? (
        <>
          <Path d="M4 4.5h6.5V11H4zM13.5 4.5H20V11h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z" {...common} />
        </>
      ) : null}

      {name === "perfil" ? (
        <>
          <Circle cx={12} cy={8.5} r={3.5} {...common} />
          <Path d="M4.5 20c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5" {...common} />
        </>
      ) : null}

      {name === "sobre" ? (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 11v6" {...common} />
          <Circle cx={12} cy={7.75} r={0.75} fill={color} stroke="none" />
        </>
      ) : null}
    </Svg>
  );
}
