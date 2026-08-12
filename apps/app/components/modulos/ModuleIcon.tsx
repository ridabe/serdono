import Svg, { Circle, Path } from "react-native-svg";
import { icon } from "@serdono/ui";

/**
 * Ícones do catálogo de módulos (pedido do dono do produto, 08/08/2026:
 * "design flat e sem detalhes", um ícone com relação direta a cada módulo).
 * Mesmo padrão de `FaseIcon.tsx`/`TabIcon.tsx` — desenhados à mão em
 * `react-native-svg` (Lucide ainda não instalada, DS-7), viewBox 24×24,
 * stroke-only, sem fill.
 */
export function ModuleIcon({ slug, color, size = icon.md }: { slug: string; color: string; size?: number }) {
  const common = { stroke: color, strokeWidth: icon.strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Jornada Empreendedora: trilha vertical com marcos (mesma metáfora do TabIcon/StepRail). */}
      {slug === "jornada-empreendedora" ? (
        <>
          <Path d="M7 4v16" {...common} />
          <Circle cx={7} cy={7} r={2.2} {...common} />
          <Circle cx={7} cy={17} r={2.2} {...common} />
          <Path d="M12 7h7" {...common} />
          <Path d="M12 17h5" {...common} />
        </>
      ) : null}

      {/* Check-up Mensal: linha de pulso/ECG — raio-x do negócio. */}
      {slug === "checkup-mensal" ? <Path d="M2.5 12h4l2-6.5 4 13 2-9 1.5 2.5h5.5" {...common} /> : null}

      {/* Plano de Ação Mensal: alvo — prioridade do mês. */}
      {slug === "plano-acao-mensal" ? (
        <>
          <Circle cx={12} cy={12} r={8.5} {...common} />
          <Circle cx={12} cy={12} r={4.8} {...common} />
          <Circle cx={12} cy={12} r={1.3} fill={color} stroke="none" />
        </>
      ) : null}

      {/* Parceiros e Fornecedores: fachada de loja. */}
      {slug === "parceiros-fornecedores" ? (
        <>
          <Path d="M4 9.5 5 4h14l1 5.5" {...common} />
          <Path d="M4 9.5v9.5h16V9.5" {...common} />
          <Path d="M9.3 19v-5.3h5.4V19" {...common} />
        </>
      ) : null}

      {/* Retenção de Clientes: duas setas circulares — trazer de volta. */}
      {slug === "retencao-clientes" ? (
        <>
          <Path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5" {...common} />
          <Path d="M19.5 4.5v4.5H15" {...common} />
          <Path d="M19.5 12a7.5 7.5 0 0 1-12.6 5.5" {...common} />
          <Path d="M4.5 19.5V15h4.5" {...common} />
        </>
      ) : null}

      {/* Mentoria em Investimentos: linha ascendente. */}
      {slug === "mentoria-investimentos" ? (
        <>
          <Path d="M3 16.5 9 10l4 4 7-8" {...common} />
          <Path d="M14.5 6h5.5v5.5" {...common} />
        </>
      ) : null}

      {/* Raio-X Financeiro: barras em crescimento — fechamento mensal comparado. */}
      {slug === "raio-x-financeiro" ? (
        <>
          <Path d="M3.5 20.5h17" {...common} />
          <Path d="M6.5 20.5v-6" {...common} />
          <Path d="M11.5 20.5v-9.5" {...common} />
          <Path d="M16.5 20.5v-13" {...common} />
          <Path d="M14.5 5l2-1.5 2 2" {...common} />
        </>
      ) : null}

      {/* Nível de Maturidade: medalha — selo de evolução do negócio. */}
      {slug === "nivel-maturidade" ? (
        <>
          <Circle cx={12} cy={9} r={6} {...common} />
          <Path d="M9 14.2 7.5 21l4.5-2.5 4.5 2.5-1.5-6.8" {...common} />
        </>
      ) : null}

      {/* Meu Negócio em Dia: calendário com check. */}
      {slug === "meu-negocio-em-dia" ? (
        <>
          <Path d="M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" {...common} />
          <Path d="M8 3.5v4M16 3.5v4M4 10h16" {...common} />
          <Path d="M8.5 14.5l2 2 4-4.3" {...common} />
        </>
      ) : null}
    </Svg>
  );
}
