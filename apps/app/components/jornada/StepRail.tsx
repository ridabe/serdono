import { Pressable, ScrollView, Text, View } from "react-native";
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
}

/**
 * Trilha visual da Jornada (Conceito A aprovado — SDD-33). Larga (tablet/web,
 * ≥768px): rail vertical fixo com linha conectora. Estreita (celular):
 * tiras de fase horizontais roláveis + lista vertical só da fase atual —
 * não é decisão de gosto, é o mesmo shell tendo que caber em telas de ~360px
 * de largura sem virar ilegível (código único, SPEC §2).
 */
export function StepRail({ fases, compact }: StepRailProps) {
  if (compact) return <CompactRail fases={fases} />;
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

function StepList({ steps }: { steps: RailStepData[] }) {
  return (
    <View style={{ position: "relative" }}>
      <View style={{ position: "absolute", left: 12, top: 13, bottom: 13, width: 2, backgroundColor: color.border.default }} />
      {steps.map((step) => (
        <View key={step.key} style={{ flexDirection: "row", alignItems: "center", gap: space[2], paddingVertical: 6 }}>
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
        </View>
      ))}
    </View>
  );
}

function CompactRail({ fases }: { fases: RailFaseData[] }) {
  const atual = fases.find((f) => f.isCurrentFase);
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space[4], gap: space[3], paddingVertical: space[3] }}>
        {fases.map((fase) => (
          <Pressable
            key={fase.key}
            onPress={fase.onPress}
            disabled={!fase.onPress}
            accessibilityRole={fase.onPress ? "button" : undefined}
            style={{ alignItems: "center", minWidth: 84 }}
          >
            <FasePill fase={fase} />
            <Text
              numberOfLines={1}
              style={{
                ...type.caption,
                fontSize: 11,
                marginTop: space[1],
                color: fase.isCurrentFase ? color.bg.brand : color.text.muted,
                fontWeight: fase.isCurrentFase ? "700" : "500",
                maxWidth: 84,
                textAlign: "center",
              }}
            >
              {fase.nome}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {atual?.steps ? (
        <View style={{ paddingHorizontal: space[4], paddingBottom: space[3] }}>
          <StepList steps={atual.steps} />
        </View>
      ) : null}
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
