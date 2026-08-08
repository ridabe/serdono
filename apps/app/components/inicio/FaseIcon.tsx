import Svg, { Circle, Path } from "react-native-svg";
import { icon } from "@serdono/ui";
import type { JornadaFaseCore } from "@serdono/core";

/**
 * Ícones do grid "Módulos da jornada" do Início (DS-23, §9.14). Desenhados
 * aqui em `react-native-svg` em vez de virem de uma lib — mesmo motivo já
 * registrado em `apps/app/components/shell/TabIcon.tsx`: Lucide (§7) ainda
 * não está instalada. Traço/proporção seguem o mesmo padrão do TabIcon
 * (viewBox 24×24, stroke-only, sem fill) — quando Lucide entrar, este
 * arquivo sai inteiro junto com o TabIcon.
 */
export function FaseIcon({ fase, color, size = icon.md }: { fase: JornadaFaseCore; color: string; size?: number }) {
  const common = {
    stroke: color,
    strokeWidth: icon.strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Validação da Ideia: lupa — investigar/checar antes de seguir. */}
      {fase === "validacao_ideia" ? (
        <>
          <Circle cx={10.5} cy={10.5} r={6} {...common} />
          <Path d="M15 15l5.5 5.5" {...common} />
        </>
      ) : null}

      {/* Planejamento: prancheta com checklist. */}
      {fase === "planejamento" ? (
        <>
          <Path d="M7 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1" {...common} />
          <Path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z" {...common} />
          <Path d="M8.5 12.5l1.5 1.5 3-3M8.5 17h6" {...common} />
        </>
      ) : null}

      {/* Formalização: fachada estilo banco/prédio público (CNPJ, registro formal). */}
      {fase === "formalizacao" ? (
        <>
          <Path d="M3.5 10 12 4l8.5 6" {...common} />
          <Path d="M5 10v9M9.3 10v9M14.7 10v9M19 10v9" {...common} />
          <Path d="M3.5 19h17" {...common} />
        </>
      ) : null}

      {/* Financeiro: moedas empilhadas. */}
      {fase === "financeiro" ? (
        <>
          <Circle cx={9} cy={14.5} r={5} {...common} />
          <Path d="M13 6.5a5 5 0 1 1-5 8.7" {...common} />
        </>
      ) : null}

      {/* Estrutura: chave inglesa — base operacional do negócio. */}
      {fase === "estrutura" ? (
        <>
          <Path
            d="M14.8 6.2a4 4 0 0 0-5.3 5.3L4 17l3 3 5.5-5.5a4 4 0 0 0 5.3-5.3l-2.7 2.7-2.3-2.3z"
            {...common}
          />
        </>
      ) : null}

      {/* Fornecedores: caminhão de entrega. */}
      {fase === "fornecedores" ? (
        <>
          <Path d="M3 7h10v9H3z" {...common} />
          <Path d="M13 10h4l3.5 3.5V16H13z" {...common} />
          <Circle cx={7.5} cy={17.3} r={1.7} {...common} />
          <Circle cx={16.5} cy={17.3} r={1.7} {...common} />
        </>
      ) : null}

      {/* Produto: etiqueta de preço. */}
      {fase === "produto" ? (
        <>
          <Path d="M11.2 3.5H5.5a1 1 0 0 0-1 1v5.7a1 1 0 0 0 .3.7l9.1 9.1a1 1 0 0 0 1.4 0l5.7-5.7a1 1 0 0 0 0-1.4l-9.1-9.1a1 1 0 0 0-.7-.3z" {...common} />
          <Circle cx={8} cy={8} r={1.4} {...common} />
        </>
      ) : null}

      {/* Marketing: megafone. */}
      {fase === "marketing" ? (
        <>
          <Path d="M3 10.5v4h3l7 4.2V6.3l-7 4.2H3z" {...common} />
          <Path d="M16.2 9.3a4 4 0 0 1 0 6.4" {...common} />
          <Path d="M18.6 7a7.3 7.3 0 0 1 0 11" {...common} />
        </>
      ) : null}

      {/* Clientes: duas pessoas. */}
      {fase === "clientes" ? (
        <>
          <Circle cx={9} cy={8} r={3} {...common} />
          <Path d="M3.5 20c0-3.3 2.6-5 5.5-5s5.5 1.7 5.5 5" {...common} />
          <Circle cx={17} cy={8.7} r={2.2} {...common} />
          <Path d="M14.8 20c.2-2.6 2-4.2 4.2-4.2" {...common} />
        </>
      ) : null}

      {/* Primeira Venda: carrinho de compras. */}
      {fase === "primeira_venda" ? (
        <>
          <Path d="M3 4h2.2l2.1 11h9.7L19 8.5H6.4" {...common} />
          <Circle cx={9.5} cy={19} r={1.4} {...common} />
          <Circle cx={16} cy={19} r={1.4} {...common} />
        </>
      ) : null}

      {/* Organização: calendário com check — rotina do negócio em dia. */}
      {fase === "organizacao" ? (
        <>
          <Path d="M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" {...common} />
          <Path d="M8 3.5v4M16 3.5v4M4 10h16" {...common} />
          <Path d="M8.5 14.5l2 2 4-4.3" {...common} />
        </>
      ) : null}
    </Svg>
  );
}
