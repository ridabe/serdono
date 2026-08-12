import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, chart, color, MaryAvatar, radius, space, type } from "@serdono/ui";
import { CATEGORIAS_SCORE, NIVEIS_NEGOCIO, NIVEL_INFO, type CategoriaResultado, type CategoriaScore, type NivelNegocio } from "@serdono/core";
import { signOut } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { useMaturidade } from "./useMaturidade";

/**
 * Tela do Nível de Maturidade do Negócio + Ser Dono Score (pedido do dono do
 * produto, 12/08/2026). Sem formulário — o snapshot é calculado sozinho ao
 * abrir a tela (ver `useMaturidade`). 3 estados: sem elegibilidade (Jornada
 * nem começou), calculando (primeira vez no mês) e resultado.
 */
export function MaturidadeScreen() {
  const router = useRouter();
  const v = useMaturidade();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[
          { label: "← Painel", onPress: () => router.push("/inicio") },
          { label: "Sair", onPress: handleSignOut },
        ]}
      />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Nível de Maturidade</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Como seu negócio está evoluindo, a partir do que você já preencheu nos outros módulos.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.loading || v.calculando ? (
          <View style={{ alignItems: "center", gap: space[3], marginTop: space[6] }}>
            <ActivityIndicator color={color.bg.brand} size="large" />
            {v.calculando ? (
              <Text style={{ ...type.caption, color: color.text.muted }}>Calculando seu nível deste mês…</Text>
            ) : null}
          </View>
        ) : !v.elegivel ? (
          <BloqueioElegibilidade onIrParaJornada={() => router.push("/jornada")} />
        ) : v.snapshot ? (
          <Resultado
            nivel={v.snapshot.nivel as NivelNegocio}
            pontuacaoTotal={v.snapshot.pontuacao_total}
            categorias={v.snapshot.categorias as unknown as Record<CategoriaScore, CategoriaResultado>}
            onCriarPlano={() => router.push("/plano-acao")}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function BloqueioElegibilidade({ onIrParaJornada }: { onIrParaJornada: () => void }) {
  return (
    <Card variant="outline" padding={5}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Ainda não deu pra desbloquear</Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
        O Nível de Maturidade libera depois que você começar a Jornada — preciso ter algo do seu negócio pra avaliar.
      </Text>
      <Button label="Ir para a Jornada" variant="primary" onPress={onIrParaJornada} style={{ alignSelf: "flex-start" }} />
    </Card>
  );
}

function Resultado({
  nivel,
  pontuacaoTotal,
  categorias,
  onCriarPlano,
}: {
  nivel: NivelNegocio;
  pontuacaoTotal: number;
  categorias: Record<CategoriaScore, CategoriaResultado>;
  onCriarPlano: () => void;
}) {
  return (
    <View style={{ gap: space[5] }}>
      <NivelBanner nivel={nivel} />

      <Card variant="default" padding={6}>
        <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>SER DONO SCORE</Text>
        <Text style={{ ...type.display, color: color.text.primary, marginBottom: space[3] }}>
          {pontuacaoTotal}
          <Text style={{ ...type.h3, color: color.text.muted }}> /1000</Text>
        </Text>
        <View style={{ height: 14, borderRadius: radius.full, backgroundColor: chart.track, overflow: "hidden" }}>
          <View
            style={{
              width: `${Math.round((pontuacaoTotal / 1000) * 100)}%`,
              height: "100%",
              backgroundColor: chart.series,
              borderRadius: radius.full,
            }}
          />
        </View>
      </Card>

      <Card variant="default" padding={5}>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[4] }}>Por categoria</Text>
        <View style={{ gap: space[1] }}>
          {CATEGORIAS_SCORE.map((c) => (
            <CategoriaLinha key={c.chave} titulo={c.titulo} resultado={categorias[c.chave]} onCriarPlano={onCriarPlano} />
          ))}
        </View>
      </Card>
    </View>
  );
}

function NivelBanner({ nivel }: { nivel: NivelNegocio }) {
  const info = NIVEL_INFO[nivel];
  const indiceAtual = NIVEIS_NEGOCIO.indexOf(nivel);

  return (
    <Card variant="brand" padding={6}>
      <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[2] }}>NÍVEL DO SEU NEGÓCIO</Text>
      <Text style={{ ...type.h1, color: color.text.onBrand, marginBottom: space[1] }}>
        {info.emoji} {info.label}
      </Text>
      <Text style={{ ...type.body, color: color.bg.brandSubtle, marginBottom: space[5] }}>{info.descricao}</Text>

      <View style={{ flexDirection: "row", gap: space[2] }}>
        {NIVEIS_NEGOCIO.map((n, i) => (
          <View
            key={n}
            style={{
              flex: 1,
              height: 8,
              borderRadius: radius.full,
              backgroundColor: i <= indiceAtual ? chart.accent : "rgba(255,255,255,0.28)",
            }}
          />
        ))}
      </View>
    </Card>
  );
}

const LIMIAR_ATENCAO = 70;
const LIMIAR_RISCO = 40;

function tonsPorNota(pontuacao: number): { fg: string; bg: string } {
  if (pontuacao >= LIMIAR_ATENCAO) return { fg: color.state.success, bg: color.state.successBg };
  if (pontuacao >= LIMIAR_RISCO) return { fg: color.state.warning, bg: color.state.warningBg };
  return { fg: color.state.danger, bg: color.state.dangerBg };
}

function CategoriaLinha({
  titulo,
  resultado,
  onCriarPlano,
}: {
  titulo: string;
  resultado: CategoriaResultado;
  onCriarPlano: () => void;
}) {
  const [aberta, setAberta] = useState(false);
  const tons = tonsPorNota(resultado.pontuacao);

  return (
    <View>
      <Pressable
        onPress={() => setAberta((a) => !a)}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}: ${resultado.pontuacao} de 100${aberta ? ", recolher explicação" : ", ver explicação da Mary"}`}
        style={{ paddingVertical: space[3] }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space[2] }}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{titulo}</Text>
          <Text style={{ ...type.bodyStrong, color: tons.fg }}>{resultado.pontuacao}</Text>
        </View>
        <View style={{ height: 6, borderRadius: radius.full, backgroundColor: chart.track, overflow: "hidden" }}>
          <View style={{ width: `${resultado.pontuacao}%`, height: "100%", backgroundColor: tons.fg, borderRadius: radius.full }} />
        </View>
      </Pressable>

      {aberta ? (
        <View style={{ flexDirection: "row", gap: space[3], backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4], marginBottom: space[3] }}>
          <MaryAvatar pose="checklist" size={40} shape="circle" />
          <View style={{ flex: 1, gap: space[3] }}>
            <Text style={{ ...type.body, color: color.text.primary }}>{resultado.comentario}</Text>
            <Button label="Criar plano" variant="primary" size="sm" onPress={onCriarPlano} style={{ alignSelf: "flex-start" }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
