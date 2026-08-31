import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, Logo, color, radius, space, type } from "@serdono/ui";
import type { NichoRow } from "@serdono/supabase";
import { useAdminNichos } from "./useAdminNichos";

function moeda(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

/**
 * Admin — Nichos gerados pela IA (SDD-137). Lista os `origem = 'ia'`: ramos
 * que a Mary montou no diagnóstico porque a pessoa descreveu algo que não
 * existia no catálogo. Os números são estimativa. O admin confere e ou
 * promove a 'curado' (vira dado oficial) ou apaga.
 */
export function AdminNichosScreen() {
  const router = useRouter();
  const { nichos, totalCurados, loading, acaoEmId, error, promover, apagar } = useAdminNichos();
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: space[3],
          borderBottomWidth: 1,
          borderBottomColor: color.border.default,
          backgroundColor: color.bg.surface,
        }}
      >
        <Logo size={28} />
        <Pressable onPress={() => router.push("/admin")} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Painel</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5], maxWidth: 760, alignSelf: "center", width: "100%" }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Nichos gerados pela IA</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Ramos que a Mary montou no diagnóstico porque a pessoa descreveu algo fora do catálogo. Os números são
          estimativa dela, não pesquisa de mercado. Confira e{" "}
          <Text style={{ fontWeight: "700" }}>promova a curado</Text> (vira dado oficial, sem o aviso de estimativa) ou{" "}
          <Text style={{ fontWeight: "700" }}>apague</Text>.
          {totalCurados != null ? ` Catálogo curado hoje: ${totalCurados} ramos.` : ""}
        </Text>

        {error ? (
          <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text>
        ) : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : nichos.length === 0 ? (
          <Card>
            <Text style={{ ...type.body, color: color.text.secondary }}>
              Nenhum nicho gerado pela IA no momento. Quando alguém descrever um ramo que não está no catálogo, ele
              aparece aqui pra revisão.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: space[4] }}>
            {nichos.map((n) => (
              <NichoCard
                key={n.id}
                nicho={n}
                ocupado={acaoEmId === n.id}
                confirmando={confirmandoId === n.id}
                onPromover={() => promover(n.id)}
                onPedirConfirmacao={() => setConfirmandoId(n.id)}
                onCancelar={() => setConfirmandoId(null)}
                onApagar={() => {
                  setConfirmandoId(null);
                  apagar(n.id);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function NichoCard({
  nicho,
  ocupado,
  confirmando,
  onPromover,
  onPedirConfirmacao,
  onCancelar,
  onApagar,
}: {
  nicho: NichoRow;
  ocupado: boolean;
  confirmando: boolean;
  onPromover: () => void;
  onPedirConfirmacao: () => void;
  onCancelar: () => void;
  onApagar: () => void;
}) {
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space[2] }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.overline, color: color.text.muted }}>{nicho.categoria.toUpperCase()}</Text>
          <Text style={{ ...type.h3, color: color.text.primary }}>{nicho.nome}</Text>
        </View>
        <View
          style={{
            backgroundColor: color.state.infoBg,
            borderRadius: radius.full,
            paddingHorizontal: space[3],
            paddingVertical: 2,
          }}
        >
          <Text style={{ ...type.caption, color: color.text.primary }}>estimativa da IA</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[4], marginTop: space[3] }}>
        <Meta label="Investimento" valor={`${moeda(nicho.investimento_min)} – ${moeda(nicho.investimento_max)}`} />
        {nicho.tempo_ate_equilibrio_meses != null ? (
          <Meta label="Equilíbrio" valor={`${nicho.tempo_ate_equilibrio_meses} meses`} />
        ) : null}
        {nicho.margem_tipica_pct != null ? <Meta label="Margem" valor={`${nicho.margem_tipica_pct}%`} /> : null}
        <Meta label="Concorrência" valor={`${nicho.nivel_concorrencia}/5`} />
        <Meta label="Regulação" valor={`${nicho.complexidade_regulatoria}/5`} />
        <Meta label="Ponto físico" valor={nicho.dependencia_ponto_fisico ? "Sim" : "Não"} />
      </View>

      {nicho.perfil_cliente ? (
        <Text style={{ ...type.caption, color: color.text.secondary, marginTop: space[3] }}>
          Quem compra: {nicho.perfil_cliente}
        </Text>
      ) : null}
      <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>
        Gerado em {new Date(nicho.created_at).toLocaleDateString("pt-BR")} · slug {nicho.slug}
      </Text>

      {confirmando ? (
        <View style={{ marginTop: space[4], gap: space[2] }}>
          <Text style={{ ...type.caption, color: color.text.primary }}>
            Apagar “{nicho.nome}” de vez? As sugestões já mostradas com esse ramo somem junto.
          </Text>
          <View style={{ flexDirection: "row", gap: space[2] }}>
            <Button label="Apagar" variant="danger" onPress={onApagar} disabled={ocupado} />
            <Button label="Cancelar" variant="outline" onPress={onCancelar} disabled={ocupado} />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: space[2], marginTop: space[4] }}>
          <Button label={ocupado ? "..." : "Promover a curado"} onPress={onPromover} disabled={ocupado} />
          <Button label="Apagar" variant="outline" onPress={onPedirConfirmacao} disabled={ocupado} />
        </View>
      )}
    </Card>
  );
}

function Meta({ label, valor }: { label: string; valor: string }) {
  return (
    <View>
      <Text style={{ ...type.caption, color: color.text.muted }}>{label.toUpperCase()}</Text>
      <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{valor}</Text>
    </View>
  );
}
