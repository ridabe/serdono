import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Card, CollapsibleSection, color, Input, radius, SECTION_ACCENT_CYCLE, space, type } from "@serdono/ui";
import { detalheObrigatorio, formatarDataHoraReuniao, TIPOS_REUNIAO, type GuiaReuniao, type TipoReuniao } from "@serdono/core";
import { signOut, type ReuniaoComAgenda, type SalvarAgendamentoParams, type SalvarResultadoParams } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { AgendamentoSecao } from "./AgendamentoSecao";
import { DesfechoReuniaoSecao } from "./DesfechoReuniaoSecao";
import { exportReuniaoPdf } from "./reuniaoPdf";
import { useReuniao } from "./useReuniao";

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS_REUNIAO.map((t) => [t.valor, t.label]));

/**
 * Tela do Assistente de Reunião (pedido do dono do produto, 12/08/2026,
 * V1). 3 estados: lista (histórico de guias já gerados), formulário (nova
 * reunião) e resultado (guia gerado, com export em PDF). Sem trava mensal —
 * diferente dos outros módulos de IA, o usuário pode gerar quantos guias
 * precisar.
 */
export function ReuniaoScreen() {
  const router = useRouter();
  const v = useReuniao();

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
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Assistente de Reunião</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Um guia de preparação pra sua próxima reunião, a partir do seu negócio real.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : !v.elegivel ? (
          <BloqueioElegibilidade onIrParaJornada={() => router.push("/jornada")} />
        ) : v.view === "formulario" ? (
          <Formulario gerando={v.gerando} onGerar={v.gerar} onVoltar={v.voltarParaLista} />
        ) : v.view === "resultado" && v.reuniaoSelecionada ? (
          <Resultado
            reuniao={v.reuniaoSelecionada}
            agendando={v.agendando}
            enviandoConvite={v.enviandoConvite}
            salvandoResultado={v.salvandoResultado}
            onSalvarAgendamento={(params) => v.agendar(v.reuniaoSelecionada!.id, params)}
            onCancelarAgendamento={() => v.cancelarAgendamento(v.reuniaoSelecionada!.id)}
            onEnviarConvite={() => v.enviarConvite(v.reuniaoSelecionada!.id)}
            onSalvarResultado={(params) => v.salvarResultado(v.reuniaoSelecionada!.id, params)}
            onVoltar={v.voltarParaLista}
          />
        ) : (
          <Lista reunioes={v.reunioes} onNovaReuniao={v.novaReuniao} onAbrirReuniao={v.abrirReuniao} />
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
        O Assistente de Reunião libera depois que você começar a Jornada — preciso saber qual é o seu negócio antes
        de montar um guia.
      </Text>
      <Button label="Ir para a Jornada" variant="primary" onPress={onIrParaJornada} style={{ alignSelf: "flex-start" }} />
    </Card>
  );
}

function formatarDataRelativa(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function Lista({
  reunioes,
  onNovaReuniao,
  onAbrirReuniao,
}: {
  reunioes: ReuniaoComAgenda[];
  onNovaReuniao: () => void;
  onAbrirReuniao: (reuniao: ReuniaoComAgenda) => void;
}) {
  return (
    <View style={{ gap: space[4] }}>
      <Button label="Nova reunião" variant="primary" onPress={onNovaReuniao} style={{ alignSelf: "flex-start" }} />

      {reunioes.length === 0 ? (
        <Card variant="outline" padding={5}>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Você ainda não gerou nenhum guia. Toque em "Nova reunião" pra preparar a primeira.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: space[3] }}>
          {reunioes.map((reuniao) => (
            <Pressable key={reuniao.id} onPress={() => onAbrirReuniao(reuniao)} accessibilityRole="button">
              <Card variant="default" padding={5}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
                      {TIPO_LABEL[reuniao.tipo] ?? reuniao.tipo}
                      {reuniao.tipo === "outro" && reuniao.tipo_outro_detalhe ? ` — ${reuniao.tipo_outro_detalhe}` : ""}
                    </Text>
                    <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }} numberOfLines={1}>
                      {reuniao.com_quem} · {formatarDataRelativa(reuniao.created_at)}
                    </Text>
                    {reuniao.agendamento ? (
                      <Text style={{ ...type.caption, color: color.bg.brand, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                        Agendada para {formatarDataHoraReuniao(reuniao.agendamento.data_hora)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ ...type.body, color: color.text.muted }}>›</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function CampoTexto({
  label,
  value,
  onChangeText,
  placeholder,
  linhas = 1,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  linhas?: number;
}) {
  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.text.muted}
        multiline={linhas > 1}
        numberOfLines={linhas}
        style={{
          ...type.body,
          color: color.text.primary,
          borderWidth: 1,
          borderColor: color.border.default,
          borderRadius: radius.md,
          paddingHorizontal: space[4],
          paddingVertical: space[3],
          minHeight: linhas > 1 ? 22 * linhas + space[3] * 2 : 48,
          textAlignVertical: linhas > 1 ? "top" : "center",
        }}
      />
    </View>
  );
}

function Formulario({
  gerando,
  onGerar,
  onVoltar,
}: {
  gerando: boolean;
  onGerar: (params: { tipo: TipoReuniao; tipoOutroDetalhe?: string; comQuem: string; objetivo: string; observacoes?: string }) => Promise<boolean>;
  onVoltar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoReuniao | null>(null);
  const [tipoOutroDetalhe, setTipoOutroDetalhe] = useState("");
  const [comQuem, setComQuem] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const completo =
    tipo != null &&
    (!detalheObrigatorio(tipo) || tipoOutroDetalhe.trim().length > 0) &&
    comQuem.trim().length > 0 &&
    objetivo.trim().length > 0;

  async function handleGerar() {
    if (!tipo) return;
    await onGerar({
      tipo,
      tipoOutroDetalhe: detalheObrigatorio(tipo) ? tipoOutroDetalhe : undefined,
      comQuem,
      objetivo,
      observacoes: observacoes.trim() ? observacoes : undefined,
    });
  }

  return (
    <View style={{ gap: space[4] }}>
      <Button label="← Voltar" variant="ghost" size="sm" onPress={onVoltar} style={{ alignSelf: "flex-start" }} />

      <View>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Que tipo de reunião é essa?</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
          {TIPOS_REUNIAO.map((opcao) => (
            <Button
              key={opcao.valor}
              label={opcao.label}
              variant={tipo === opcao.valor ? "primary" : "outline"}
              size="sm"
              onPress={() => setTipo(opcao.valor)}
            />
          ))}
        </View>
      </View>

      {tipo && detalheObrigatorio(tipo) ? (
        <Input label="Com quem é essa reunião?" value={tipoOutroDetalhe} onChangeText={setTipoOutroDetalhe} placeholder="Ex.: contador, advogado..." />
      ) : null}

      <Input label="Com quem você vai se reunir?" value={comQuem} onChangeText={setComQuem} placeholder="Ex.: João, dono da gráfica X" />
      <CampoTexto label="O que você quer conseguir com essa reunião?" value={objetivo} onChangeText={setObjetivo} placeholder="Ex.: negociar prazo de pagamento com o fornecedor" linhas={3} />
      <CampoTexto
        label="Alguma observação a mais? (opcional)"
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Ex.: já tivemos uma reunião difícil antes sobre isso"
        linhas={3}
      />

      <Button label="Gerar meu guia" variant="primary" fullWidth loading={gerando} disabled={!completo} onPress={handleGerar} />
      {!completo ? <Text style={{ ...type.caption, color: color.text.muted, textAlign: "center" }}>Preencha os campos acima pra liberar o botão.</Text> : null}
    </View>
  );
}

function ItensLista({ itens }: { itens: string[] }) {
  return (
    <View style={{ gap: space[2] }}>
      {itens.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", gap: space[2], alignItems: "flex-start" }}>
          <Text style={{ ...type.body, color: color.bg.brand }}>•</Text>
          <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** Ordem em que as 5 seções do guia aparecem como sanfonas — cor alternada (SECTION_ACCENT_CYCLE) só pra diferenciar visualmente, sem significado próprio. */
const SECOES_GUIA: { titulo: string; campo: keyof Omit<GuiaReuniao, "resumo"> }[] = [
  { titulo: "Pauta sugerida", campo: "pauta" },
  { titulo: "Perguntas a fazer", campo: "perguntas_a_fazer" },
  { titulo: "Dicas de comportamento", campo: "dicas_comportamento" },
  { titulo: "Erros a evitar", campo: "erros_a_evitar" },
  { titulo: "Checklist de preparação", campo: "checklist_preparacao" },
];

function Resultado({
  reuniao,
  agendando,
  enviandoConvite,
  salvandoResultado,
  onSalvarAgendamento,
  onCancelarAgendamento,
  onEnviarConvite,
  onSalvarResultado,
  onVoltar,
}: {
  reuniao: ReuniaoComAgenda;
  agendando: boolean;
  enviandoConvite: boolean;
  salvandoResultado: boolean;
  onSalvarAgendamento: (params: SalvarAgendamentoParams) => Promise<boolean>;
  onCancelarAgendamento: () => Promise<boolean>;
  onEnviarConvite: () => Promise<boolean>;
  onSalvarResultado: (params: SalvarResultadoParams) => Promise<boolean>;
  onVoltar: () => void;
}) {
  const guia = reuniao.guia as unknown as GuiaReuniao;
  const tipoLabel = TIPO_LABEL[reuniao.tipo] ?? reuniao.tipo;
  const [exportando, setExportando] = useState(false);

  async function handleExportar() {
    setExportando(true);
    try {
      await exportReuniaoPdf(tipoLabel, reuniao.com_quem, guia);
    } finally {
      setExportando(false);
    }
  }

  return (
    <View style={{ gap: space[5] }}>
      <Button label="← Voltar" variant="ghost" size="sm" onPress={onVoltar} style={{ alignSelf: "flex-start" }} />

      <Card variant="brand" padding={6}>
        <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[2] }}>
          {tipoLabel.toUpperCase()} · {reuniao.com_quem}
        </Text>
        <Text style={{ ...type.body, color: color.text.onBrand }}>{guia.resumo}</Text>
      </Card>

      <AgendamentoSecao
        agendamento={reuniao.agendamento}
        agendando={agendando}
        enviandoConvite={enviandoConvite}
        onSalvar={onSalvarAgendamento}
        onCancelar={onCancelarAgendamento}
        onEnviarConvite={onEnviarConvite}
      />

      <DesfechoReuniaoSecao resultado={reuniao.resultado} salvando={salvandoResultado} onSalvar={onSalvarResultado} />

      {SECOES_GUIA.map((secao, i) => (
        <CollapsibleSection key={secao.campo} title={secao.titulo} accent={SECTION_ACCENT_CYCLE[i % SECTION_ACCENT_CYCLE.length]}>
          <ItensLista itens={guia[secao.campo]} />
        </CollapsibleSection>
      ))}

      <Button label="Exportar PDF" variant="primary" fullWidth loading={exportando} onPress={handleExportar} />
    </View>
  );
}
