import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Button, Card, color, radius, space, type } from "@serdono/ui";
import { SUCESSO_REUNIAO_LABEL, type SucessoReuniao } from "@serdono/core";
import type { ResultadoRow, SalvarResultadoParams } from "@serdono/supabase";

const OPCOES_SUCESSO = Object.keys(SUCESSO_REUNIAO_LABEL) as SucessoReuniao[];

/**
 * Registrar/editar o resultado da reunião (13/08/2026, último item que
 * restava fora de escopo em PRD §12.15) — vive dentro do resultado de um
 * guia já gerado, independente de ter agendamento salvo (o usuário pode ter
 * marcado a reunião por fora e só voltar aqui pra anotar como foi).
 * Diferente do guia gerado pela IA (imutável, RN-51): mutável, sempre
 * editável — mesmo espírito do agendamento (RN-54).
 */
export function DesfechoReuniaoSecao({
  resultado,
  salvando,
  onSalvar,
}: {
  resultado: ResultadoRow | null;
  salvando: boolean;
  onSalvar: (params: SalvarResultadoParams) => Promise<boolean>;
}) {
  const [editando, setEditando] = useState(false);
  const [sucesso, setSucesso] = useState<SucessoReuniao | null>((resultado?.sucesso as SucessoReuniao) ?? null);
  const [combinado, setCombinado] = useState(resultado?.combinado ?? "");

  function iniciarEdicao() {
    setSucesso((resultado?.sucesso as SucessoReuniao) ?? null);
    setCombinado(resultado?.combinado ?? "");
    setEditando(true);
  }

  async function handleSalvar() {
    if (!sucesso) return;
    const ok = await onSalvar({ sucesso, combinado: combinado.trim() ? combinado.trim() : undefined });
    if (ok) setEditando(false);
  }

  if (!editando && resultado) {
    return (
      <Card variant="outline" padding={5}>
        <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>RESULTADO DA REUNIÃO</Text>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{SUCESSO_REUNIAO_LABEL[resultado.sucesso as SucessoReuniao]}</Text>
        {resultado.combinado ? <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>{resultado.combinado}</Text> : null}
        <Button label="Editar" variant="info" size="sm" onPress={iniciarEdicao} style={{ alignSelf: "flex-start", marginTop: space[4] }} />
      </Card>
    );
  }

  if (!editando) {
    return (
      <Card variant="outline" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Como foi essa reunião?</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Registre se deu certo e o que ficou combinado — fica salvo junto com o guia.
        </Text>
        <Button label="Registrar resultado" variant="primary" onPress={iniciarEdicao} style={{ alignSelf: "flex-start" }} />
      </Card>
    );
  }

  return (
    <Card variant="outline" padding={5}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[4] }}>Como foi essa reunião?</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[4] }}>
        {OPCOES_SUCESSO.map((opcao) => (
          <Button
            key={opcao}
            label={SUCESSO_REUNIAO_LABEL[opcao]}
            variant={sucesso === opcao ? "primary" : "outline"}
            size="sm"
            onPress={() => setSucesso(opcao)}
          />
        ))}
      </View>

      <View style={{ marginBottom: space[4] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>O que ficou combinado? (opcional)</Text>
        <TextInput
          value={combinado}
          onChangeText={setCombinado}
          placeholder="Ex.: novo prazo de 45 dias, revisão do desconto em 3 meses"
          placeholderTextColor={color.text.muted}
          multiline
          numberOfLines={3}
          style={{
            ...type.body,
            color: color.text.primary,
            borderWidth: 1,
            borderColor: color.border.default,
            borderRadius: radius.md,
            paddingHorizontal: space[4],
            paddingVertical: space[3],
            minHeight: 22 * 3 + space[3] * 2,
            textAlignVertical: "top",
          }}
        />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
        <Button label="Salvar resultado" variant="primary" loading={salvando} disabled={!sucesso} onPress={handleSalvar} />
        <Button label="Cancelar" variant="danger" onPress={() => setEditando(false)} />
      </View>
    </Card>
  );
}
