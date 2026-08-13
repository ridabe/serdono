import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, color, ConfirmModal, Input, space, type } from "@serdono/ui";
import { agendamentoValido, emailValido, formatarDataHoraReuniao, LOCAL_TIPO_LABEL, type LocalTipoReuniao } from "@serdono/core";
import type { AgendamentoRow, SalvarAgendamentoParams } from "@serdono/supabase";
import { DateTimeField } from "./DateTimeField";

/**
 * Agendar/reagendar/cancelar a reunião (Assistente de Reunião, V2 fatia 1,
 * 12/08/2026) — vive dentro do resultado de um guia já gerado. Sem
 * agendamento: convite pra marcar. Com agendamento: mostra data/local/
 * contato + reagendar/cancelar. Nunca dispara sozinho (RN-53/54) — sempre
 * ação explícita do usuário, mesmo espírito de RN-49 do Ser Dono Score.
 *
 * Convite por e-mail (13/08/2026): botão condicionado a ter `contato_email`
 * salvo — reagendar zera `convite_enviado_em` no client (`salvarAgendamento`),
 * então o botão volta a "Enviar convite" (nunca "Reenviar") depois de uma
 * mudança de data/local, mesmo que o e-mail em si não tenha mudado.
 */
export function AgendamentoSecao({
  agendamento,
  agendando,
  enviandoConvite,
  onSalvar,
  onCancelar,
  onEnviarConvite,
}: {
  agendamento: AgendamentoRow | null;
  agendando: boolean;
  enviandoConvite: boolean;
  onSalvar: (params: SalvarAgendamentoParams) => Promise<boolean>;
  onCancelar: () => Promise<boolean>;
  onEnviarConvite: () => Promise<boolean>;
}) {
  const [editando, setEditando] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [dataHora, setDataHora] = useState<Date | null>(agendamento ? new Date(agendamento.data_hora) : null);
  const [localTipo, setLocalTipo] = useState<LocalTipoReuniao>((agendamento?.local_tipo as LocalTipoReuniao) ?? "online");
  const [localValor, setLocalValor] = useState(agendamento?.local_valor ?? "");
  const [contatoNome, setContatoNome] = useState(agendamento?.contato_nome ?? "");
  const [contatoEmail, setContatoEmail] = useState(agendamento?.contato_email ?? "");

  function iniciarEdicao() {
    setDataHora(agendamento ? new Date(agendamento.data_hora) : null);
    setLocalTipo((agendamento?.local_tipo as LocalTipoReuniao) ?? "online");
    setLocalValor(agendamento?.local_valor ?? "");
    setContatoNome(agendamento?.contato_nome ?? "");
    setContatoEmail(agendamento?.contato_email ?? "");
    setEditando(true);
  }

  const emailPreenchidoValido = contatoEmail.trim().length === 0 || emailValido(contatoEmail);
  const completo = dataHora != null && agendamentoValido(dataHora.toISOString()) && localValor.trim().length > 0 && emailPreenchidoValido;

  async function handleSalvar() {
    if (!dataHora) return;
    const ok = await onSalvar({
      dataHoraISO: dataHora.toISOString(),
      localTipo,
      localValor,
      contatoNome: contatoNome.trim() ? contatoNome : undefined,
      contatoEmail: contatoEmail.trim() ? contatoEmail.trim() : undefined,
    });
    if (ok) setEditando(false);
  }

  async function handleCancelar() {
    const ok = await onCancelar();
    setConfirmandoCancelamento(false);
    if (ok) setEditando(false);
  }

  if (!editando && agendamento) {
    const localInfo = LOCAL_TIPO_LABEL[agendamento.local_tipo as LocalTipoReuniao];
    return (
      <Card variant="outline" padding={5}>
        <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>REUNIÃO AGENDADA</Text>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{formatarDataHoraReuniao(agendamento.data_hora)}</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
          {localInfo.tipoLabel} · {agendamento.local_valor}
        </Text>
        {agendamento.contato_nome ? (
          <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>Contato: {agendamento.contato_nome}</Text>
        ) : null}
        {agendamento.contato_email ? (
          <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>Convidado: {agendamento.contato_email}</Text>
        ) : null}

        {agendamento.convite_enviado_em ? (
          <Text style={{ ...type.caption, color: color.state.success, marginTop: space[2] }}>
            Convite enviado em {formatarDataHoraReuniao(agendamento.convite_enviado_em)}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[4] }}>
          <Button label="Reagendar" variant="info" size="sm" onPress={iniciarEdicao} />
          <Button label="Cancelar" variant="danger" size="sm" onPress={() => setConfirmandoCancelamento(true)} />
          {agendamento.contato_email ? (
            <Button
              label={agendamento.convite_enviado_em ? "Reenviar convite" : "Enviar convite por e-mail"}
              variant="primary"
              size="sm"
              loading={enviandoConvite}
              onPress={onEnviarConvite}
            />
          ) : null}
        </View>

        <ConfirmModal
          visible={confirmandoCancelamento}
          title="Cancelar agendamento?"
          message="A data, o local e o contato dessa reunião vão ser removidos. O guia continua salvo normalmente."
          confirmLabel="Cancelar agendamento"
          loading={agendando}
          onConfirm={handleCancelar}
          onCancel={() => setConfirmandoCancelamento(false)}
        />
      </Card>
    );
  }

  if (!editando) {
    return (
      <Card variant="outline" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Quer marcar essa reunião?</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Guarde a data, o local e o contato — fica registrado junto com o guia.
        </Text>
        <Button label="Agendar esta reunião" variant="primary" onPress={iniciarEdicao} style={{ alignSelf: "flex-start" }} />
      </Card>
    );
  }

  return (
    <Card variant="outline" padding={5}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[4] }}>
        {agendamento ? "Reagendar reunião" : "Agendar reunião"}
      </Text>

      <DateTimeField label="Data e hora" value={dataHora} onChange={setDataHora} minimumDate={new Date()} />

      <View style={{ marginBottom: space[4] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Como vai ser?</Text>
        <View style={{ flexDirection: "row", gap: space[2] }}>
          <Button label="Online" variant={localTipo === "online" ? "primary" : "outline"} size="sm" onPress={() => setLocalTipo("online")} />
          <Button label="Presencial" variant={localTipo === "presencial" ? "primary" : "outline"} size="sm" onPress={() => setLocalTipo("presencial")} />
        </View>
      </View>

      <Input label={LOCAL_TIPO_LABEL[localTipo].campoLabel} value={localValor} onChangeText={setLocalValor} placeholder={LOCAL_TIPO_LABEL[localTipo].placeholder} />
      <Input label="Contato (opcional)" value={contatoNome} onChangeText={setContatoNome} placeholder="Ex.: João" />
      <Input
        label="E-mail do convidado (opcional)"
        value={contatoEmail}
        onChangeText={setContatoEmail}
        placeholder="Ex.: joao@empresa.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {dataHora && !agendamentoValido(dataHora.toISOString()) ? (
        <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>A data precisa ser no futuro.</Text>
      ) : null}
      {!emailPreenchidoValido ? (
        <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>Esse e-mail não parece válido.</Text>
      ) : null}
      {contatoEmail.trim().length > 0 ? (
        <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
          Preenchendo isso, você libera um botão pra enviar um convite com a data e o local dessa reunião.
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
        <Button label="Salvar agendamento" variant="primary" loading={agendando} disabled={!completo} onPress={handleSalvar} />
        <Button label="Cancelar" variant="danger" onPress={() => setEditando(false)} />
      </View>
    </Card>
  );
}
