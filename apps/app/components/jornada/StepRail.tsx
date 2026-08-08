import { Pressable, Text, View } from "react-native";
import { color, radius, space, type } from "@serdono/ui";
import type { JornadaEtapaStatus } from "@serdono/supabase";

export interface RailStepData {
  key: string;
  titulo: string;
  status: JornadaEtapaStatus;
  isCurrent: boolean;
}

export interface RailFaseData {
  key: string;
  nome: string;
  legenda?: string;
  steps: RailStepData[] | null; // null = fase sem etapas desenhadas ainda
  isCurrentFase: boolean; // na prática, "é a fase sendo exibida agora" (pode não ser a fase_atual real, ver SDD-40)
  /** Presente só em fases já visitadas (têm `jornada_etapas` semeada) — permite voltar e revisar/editar um checklist anterior, mesmo depois de já ter avançado (SDD-40). */
  onPress?: () => void;
}

interface StepRailProps {
  fases: RailFaseData[];
  compact: boolean;
  /** Só usado no modo compacto — rola a tela até o conteúdo editável da fase (ver SDD-76: no celular a trilha fica empilhada acima do formulário/checklist de verdade, e sem esse aviso visual o usuário acha que a etapa não é clicável). */
  onStepPress?: () => void;
}

/**
 * Trilha visual da Jornada (Conceito A aprovado — SDD-33, layout compacto
 * revisto na SDD-76). Larga (tablet/web, ≥768px): rail vertical fixo com
 * linha conectora. Estreita (celular): mesma ideia de rail vertical, um
 * pouco mais compacto — a versão anterior usava tiras de fase horizontais
 * roláveis, mas isso escondia a fase atual fora da viewport inicial e
 * deixava a navegação entre fases dependente de arrastar lateralmente
 * (RN gotcha real, não só preferência — ver SDD-76).
 */
export function StepRail({ fases, compact, onStepPress }: StepRailProps) {
  if (compact) return <CompactRail fases={fases} onStepPress={onStepPress} />;
  return <WideRail fases={fases} />;
}

function WideRail({ fases }: { fases: RailFaseData[] }) {
  return (
    <View style={{ width: 300, flexShrink: 0 }}>
      {fases.map((fase) => (
        <View key={fase.key} style={{ marginBottom: space[2] }}>
          <Pressable
            onPress={fase.onPress}
            disabled={!fase.onPress}
            accessibilityRole={fase.onPress ? "button" : undefined}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space[1], marginBottom: space[2], minHeight: 28 }}
          >
            <Text style={{ ...type.overline, color: fase.isCurrentFase ? color.bg.brand : color.text.muted }}>{fase.nome}</Text>
            {fase.legenda ? <FaseBadge legenda={fase.legenda} isCurrentFase={fase.isCurrentFase} /> : null}
          </Pressable>
          {fase.steps ? (
            <StepList steps={fase.steps} />
          ) : (
            <Text style={{ ...type.caption, color: color.text.muted, paddingHorizontal: space[1], marginBottom: space[3] }}>
              Chega em breve
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function StepList({ steps, onStepPress }: { steps: RailStepData[]; onStepPress?: () => void }) {
  return (
    <View style={{ position: "relative" }}>
      <View style={{ position: "absolute", left: 12, top: 13, bottom: 13, width: 2, backgroundColor: color.border.default }} />
      {steps.map((step) => {
        const Row = onStepPress ? Pressable : View;
        return (
          <Row
            key={step.key}
            {...(onStepPress ? { onPress: onStepPress, accessibilityRole: "button" as const } : {})}
            style={{ flexDirection: "row", alignItems: "center", gap: space[2], paddingVertical: 6 }}
          >
            <StepDot status={step.status} isCurrent={step.isCurrent} size={26} />
            <Text
              style={{
                ...type.body,
                fontSize: 13.5,
                color: step.status === "bloqueada" ? color.text.muted : color.text.primary,
                fontWeight: step.isCurrent ? "700" : "400",
                flex: 1,
              }}
            >
              {step.titulo}
            </Text>
            {onStepPress ? <Text style={{ color: color.text.muted, fontSize: 16 }}>›</Text> : null}
          </Row>
        );
      })}
    </View>
  );
}

function CompactRail({ fases, onStepPress }: { fases: RailFaseData[]; onStepPress?: () => void }) {
  return (
    <View style={{ width: "100%", paddingHorizontal: space[2] }}>
      {fases.map((fase) => {
        // Tocar numa fase clicável só troca `viewFase` — o conteúdo de
        // verdade (formulário/checklist editável) fica abaixo da trilha, fora
        // da viewport inicial no celular. Sem rolar até lá, o toque na fase
        // atual em particular não move nada visível e parece clique morto
        // (motivo original desta mudança, SDD-76).
        const handlePress = fase.onPress ? () => { fase.onPress?.(); onStepPress?.(); } : undefined;
        return (
          <View key={fase.key} style={{ marginBottom: space[1] }}>
            <Pressable
              onPress={handlePress}
              disabled={!handlePress}
              accessibilityRole={handlePress ? "button" : undefined}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space[3],
                paddingVertical: space[3],
                paddingHorizontal: space[2],
                borderRadius: radius.md,
                backgroundColor: fase.isCurrentFase ? color.action.primarySubtle : "transparent",
              }}
            >
              <FasePill fase={fase} />
              <Text
                style={{
                  ...type.body,
                  flex: 1,
                  color: fase.isCurrentFase ? color.bg.brand : color.text.primary,
                  fontWeight: fase.isCurrentFase ? "700" : "500",
                }}
              >
                {fase.nome}
              </Text>
              {fase.legenda ? <FaseBadge legenda={fase.legenda} isCurrentFase={fase.isCurrentFase} /> : null}
              {handlePress ? <Text style={{ color: fase.isCurrentFase ? color.bg.brand : color.text.muted, fontSize: 16 }}>›</Text> : null}
            </Pressable>
            {fase.isCurrentFase && fase.steps ? (
              <View style={{ paddingLeft: 34 + space[3] + space[2], paddingRight: space[2], paddingBottom: space[2] }}>
                <StepList steps={fase.steps} onStepPress={fase.isCurrentFase ? onStepPress : undefined} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function FasePill({ fase }: { fase: RailFaseData }) {
  const allDone = fase.steps ? fase.steps.every((s) => s.status === "concluida") : false;
  const bg = allDone ? color.state.success : fase.isCurrentFase ? color.action.primary : fase.steps ? color.bg.surface : color.bg.surfaceAlt;
  const fg = allDone ? "#fff" : fase.isCurrentFase ? color.bg.brand : color.text.muted;
  const border = fase.isCurrentFase ? color.action.primary : color.border.default;
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        borderWidth: fase.isCurrentFase ? 0 : 1.5,
        borderColor: border,
      }}
    >
      <Text style={{ ...type.caption, fontWeight: "700", color: fg }}>{allDone ? "✓" : ""}</Text>
    </View>
  );
}

function FaseBadge({ legenda, isCurrentFase }: { legenda: string; isCurrentFase: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: space[2],
        paddingVertical: 2,
        borderRadius: radius.sm,
        backgroundColor: isCurrentFase ? color.action.primarySubtle : color.bg.surfaceAlt,
      }}
    >
      <Text style={{ ...type.caption, fontSize: 10.5, fontWeight: "700", color: isCurrentFase ? "#8A5B06" : color.text.muted }}>{legenda}</Text>
    </View>
  );
}

function StepDot({ status, isCurrent, size }: { status: JornadaEtapaStatus; isCurrent: boolean; size: number }) {
  const base = { width: size, height: size, borderRadius: radius.full, alignItems: "center" as const, justifyContent: "center" as const };

  if (status === "concluida") {
    return (
      <View style={{ ...base, backgroundColor: color.state.success }}>
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>✓</Text>
      </View>
    );
  }
  if (status === "aguardando_usuario") {
    return (
      <View style={{ ...base, backgroundColor: color.state.warningBg, borderWidth: 2, borderColor: color.state.warning }}>
        <Text style={{ color: color.state.warning, fontSize: 11, fontWeight: "700" }}>!</Text>
      </View>
    );
  }
  if (status === "bloqueada") {
    return <View style={{ ...base, borderWidth: 2, borderColor: color.border.default, borderStyle: "dashed" }} />;
  }
  // disponivel
  if (isCurrent) {
    return (
      <View style={{ ...base, backgroundColor: color.action.primary, shadowColor: color.action.primary, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 }}>
        <Text style={{ color: color.bg.brand, fontSize: 11, fontWeight: "700" }}>▸</Text>
      </View>
    );
  }
  return <View style={{ ...base, borderWidth: 2, borderColor: color.border.default, backgroundColor: color.bg.surface }} />;
}
