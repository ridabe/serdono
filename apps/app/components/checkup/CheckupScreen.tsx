import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Button, Card, CollapsibleSection, color, radius, space, type } from "@serdono/ui";
import {
  formatarMesReferencia,
  PERGUNTAS_CHECKUP,
  perguntaVisivel,
  perguntasDaSecao,
  SECOES_CHECKUP,
  type PerguntaCheckup,
  type SaudeCheckup,
  type StatusSaude,
} from "@serdono/core";
import { signOut, type CheckupMensalRow } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { PerguntaField } from "./PerguntaField";
import { useCheckupMensal } from "./useCheckupMensal";

/**
 * Tela do Check-up Mensal do Negócio (pedido do dono do produto, 08/08/2026,
 * prioridade nº 1). 3 estados: sem elegibilidade (Jornada nem começou),
 * elegível sem check-up do mês (formulário) e check-up feito (resultado).
 */
export function CheckupScreen() {
  const router = useRouter();
  const v = useCheckupMensal();

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
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Check-up Mensal do Negócio</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Um raio-x rápido do seu negócio, todo mês — menos de 5 minutos.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : !v.elegivel ? (
          <BloqueioElegibilidade onIrParaJornada={() => router.push("/jornada")} />
        ) : v.checkup ? (
          <ResultadoCheckup checkup={v.checkup} />
        ) : (
          <Formulario mesAtual={v.mesAtual} enviando={v.enviando} onEnviar={v.enviar} />
        )}
      </ScrollView>
    </View>
  );
}

function BloqueioElegibilidade({ onIrParaJornada }: { onIrParaJornada: () => void }) {
  return (
    <Card variant="outline" padding={5}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Ainda não deu pra desbloquear</Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
        O Check-up Mensal libera depois que você começar a Jornada — preciso saber qual é o seu negócio antes de
        perguntar como ele andou este mês.
      </Text>
      <Button label="Ir para a Jornada" variant="primary" onPress={onIrParaJornada} style={{ alignSelf: "flex-start" }} />
    </Card>
  );
}

const ACCENT_POR_SECAO: Record<string, "brand" | "gold" | "info" | "success"> = {
  financeiro: "brand",
  clientes: "gold",
  marketing: "info",
  operacao: "success",
};

function Formulario({
  mesAtual,
  enviando,
  onEnviar,
}: {
  mesAtual: string;
  enviando: boolean;
  onEnviar: (respostas: Record<string, unknown>) => Promise<boolean>;
}) {
  const [respostas, setRespostas] = useState<Record<string, unknown>>({});

  function responder(slug: string, valor: unknown) {
    setRespostas((atual) => ({ ...atual, [slug]: valor }));
  }

  // Obrigatório só o que está visível e não é o texto condicional opcional —
  // os dois campos de detalhe (despesa/processo) nunca bloqueiam o envio.
  const perguntasObrigatorias = PERGUNTAS_CHECKUP.filter((p) => p.tipo !== "texto" && perguntaVisivel(p, respostas));
  const completo = perguntasObrigatorias.every((p) => respostas[p.slug] !== undefined);

  async function handleEnviar() {
    await onEnviar(respostas);
  }

  return (
    <View style={{ gap: space[4] }}>
      <Card variant="brand" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>Seu check-up de {formatarMesReferencia(mesAtual)}</Text>
        <Text style={{ ...type.body, color: color.bg.brandSubtle, marginTop: space[1] }}>
          Responda as 4 seções abaixo — vou usar isso pra montar um raio-x do seu negócio e as prioridades do mês.
        </Text>
      </Card>

      {SECOES_CHECKUP.map((secao) => (
        <CollapsibleSection key={secao.chave} title={secao.titulo} accent={ACCENT_POR_SECAO[secao.chave]} defaultExpanded>
          <View style={{ gap: space[4] }}>
            {perguntasDaSecao(secao.chave).map((pergunta: PerguntaCheckup) =>
              perguntaVisivel(pergunta, respostas) ? (
                <PerguntaField key={pergunta.slug} pergunta={pergunta} valor={respostas[pergunta.slug]} onResponder={(v) => responder(pergunta.slug, v)} />
              ) : null
            )}
          </View>
        </CollapsibleSection>
      ))}

      <Button label="Gerar meu check-up" variant="primary" fullWidth loading={enviando} disabled={!completo} onPress={handleEnviar} />
      {!completo ? (
        <Text style={{ ...type.caption, color: color.text.muted, textAlign: "center" }}>Responda todas as perguntas pra liberar o botão.</Text>
      ) : null}
    </View>
  );
}

const STATUS_LABEL: Record<StatusSaude, string> = {
  bom: "Bom",
  atencao: "Atenção",
  precisa_melhorar: "Precisa melhorar",
};

const STATUS_TONES: Record<StatusSaude, { bg: string; fg: string }> = {
  bom: { bg: color.state.successBg, fg: color.state.success },
  atencao: { bg: color.state.warningBg, fg: color.state.warning },
  precisa_melhorar: { bg: color.state.dangerBg, fg: color.state.danger },
};

function ResultadoCheckup({ checkup }: { checkup: CheckupMensalRow }) {
  const saude = checkup.saude as unknown as SaudeCheckup;

  return (
    <View style={{ gap: space[5] }}>
      <Card variant="brand" padding={6}>
        <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[2] }}>
          🩺 SAÚDE DO NEGÓCIO — {formatarMesReferencia(checkup.mes_referencia).toUpperCase()}
        </Text>
        <Text style={{ ...type.display, color: color.text.onBrand }}>{saude.pontuacao_geral}/100</Text>
      </Card>

      <Card variant="default" padding={5}>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[4] }}>Por categoria</Text>
        <View style={{ gap: space[3] }}>
          {SECOES_CHECKUP.map((secao) => (
            <CategoriaSaudeRow key={secao.chave} titulo={secao.titulo} categoria={saude[secao.chave]} />
          ))}
        </View>
      </Card>

      <Card variant="default" padding={5}>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[4] }}>Mary recomenda pra este mês</Text>
        <View style={{ gap: space[3] }}>
          {saude.prioridades.map((prioridade, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space[3], alignItems: "flex-start" }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radius.full,
                  backgroundColor: color.bg.brandSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ ...type.caption, fontWeight: "700", color: color.bg.brand }}>{i + 1}</Text>
              </View>
              <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>{prioridade}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={{ ...type.caption, color: color.text.muted, textAlign: "center" }}>
        Esse check-up também vai me ajudar a montar seu Plano de Ação deste mês.
      </Text>
    </View>
  );
}

function CategoriaSaudeRow({ titulo, categoria }: { titulo: string; categoria: { status: StatusSaude; comentario: string } }) {
  const tons = STATUS_TONES[categoria.status];
  return (
    <View style={{ flexDirection: "row", gap: space[3], alignItems: "flex-start" }}>
      <View style={{ backgroundColor: tons.bg, borderRadius: radius.sm, paddingHorizontal: space[3], paddingVertical: space[1], minWidth: 108 }}>
        <Text style={{ ...type.caption, fontWeight: "700", color: tons.fg }}>{STATUS_LABEL[categoria.status]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{titulo}</Text>
        <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>{categoria.comentario}</Text>
      </View>
    </View>
  );
}
