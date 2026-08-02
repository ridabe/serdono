import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { avancarParaProximaFasePendente, type JornadaEtapa, type JornadaInstance } from "@serdono/supabase";
import { Button, Card, MaryAvatar, color, space, type } from "@serdono/ui";
import { IdentidadeVisualScreen } from "./IdentidadeVisualScreen";
import { NomeEmpresaScreen } from "./NomeEmpresaScreen";

interface PlanejamentoScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

/** Fase 3 — Planejamento: hoje com 2 etapas (Nome da Empresa, SDD-34; Identidade Visual, SDD-35). */
export function PlanejamentoScreen({ jornada, etapas, onEtapasChanged }: PlanejamentoScreenProps) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checklistComplete = etapas.length > 0 && etapas.every((e) => e.status === "concluida");

  async function handleAdvance() {
    setAdvancing(true);
    setError(null);
    try {
      await avancarParaProximaFasePendente(jornada.id);
      router.replace("/jornada");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <View style={{ gap: space[6] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="jornada" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase 3 — Planejamento</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Vamos dar nome e identidade visual ao seu negócio, um passo de cada vez.
          </Text>
        </View>
      </View>

      <NomeEmpresaScreen jornada={jornada} onEtapasChanged={onEtapasChanged} />
      <IdentidadeVisualScreen jornada={jornada} etapas={etapas} onEtapasChanged={onEtapasChanged} />

      {checklistComplete ? (
        <Card variant="outline" padding={5}>
          {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}
          <Button label="Avançar" variant="primary" fullWidth loading={advancing} onPress={handleAdvance} />
        </Card>
      ) : null}
    </View>
  );
}
