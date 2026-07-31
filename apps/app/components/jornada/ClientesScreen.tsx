import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, CollapsibleSection, Input, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import type { ClienteContatoStatus, JornadaClienteContato, JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { formatMoney } from "../diagnostico/labels";
import { useClientes } from "./useClientes";

interface ClientesScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

function parseNumero(texto: string): number {
  const limpo = texto.replace(/[^\d.,]/g, "").replace(",", ".");
  return limpo ? Number(limpo) : 0;
}

const STATUS_LABEL: Record<ClienteContatoStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  orcamento_enviado: "Orçamento enviado",
  cliente: "Cliente",
};
const STATUS_ORDEM: ClienteContatoStatus[] = ["novo", "contatado", "respondeu", "orcamento_enviado", "cliente"];

function ContatoRow({
  item,
  updating,
  removing,
  onStatusChange,
  onRemover,
}: {
  item: JornadaClienteContato;
  updating: boolean;
  removing: boolean;
  onStatusChange: (status: ClienteContatoStatus) => void;
  onRemover: () => void;
}) {
  return (
    <Card variant="default" padding={4}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space[3] }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{item.nome}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[1] }}>
            {item.empresa ? <Text style={{ ...type.caption, color: color.text.secondary }}>{item.empresa}</Text> : null}
            {item.telefone ? <Text style={{ ...type.caption, color: color.text.secondary }}>{item.telefone}</Text> : null}
            {item.email ? <Text style={{ ...type.caption, color: color.text.secondary }}>{item.email}</Text> : null}
          </View>
          {item.notas ? <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>{item.notas}</Text> : null}
        </View>
        <Button label="Remover" variant="ghost" size="sm" loading={removing} onPress={onRemover} />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] }}>
        {STATUS_ORDEM.map((status) => (
          <Button
            key={status}
            label={STATUS_LABEL[status]}
            variant={item.status === status ? "primary" : "outline"}
            size="sm"
            loading={updating}
            onPress={() => onStatusChange(status)}
          />
        ))}
      </View>
    </Card>
  );
}

function CriterioRow({ atendido, label }: { atendido: boolean; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.full,
          backgroundColor: atendido ? color.state.successBg : color.bg.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ ...type.caption, color: atendido ? color.state.success : color.text.muted, fontWeight: "700" }}>
          {atendido ? "✓" : "—"}
        </Text>
      </View>
      <Text style={{ ...type.body, color: atendido ? color.text.primary : color.text.secondary, flex: 1 }}>{label}</Text>
    </View>
  );
}

export function ClientesScreen({ jornada, etapas, onEtapasChanged }: ClientesScreenProps) {
  const router = useRouter();
  const v = useClientes(jornada, etapas, onEtapasChanged);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [notas, setNotas] = useState("");

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  async function handleAdicionar() {
    if (!nome.trim()) return;
    const ok = await v.adicionarContato({
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
      empresa: empresa.trim() || undefined,
      notas: notas.trim() || undefined,
    });
    if (ok) {
      setNome("");
      setTelefone("");
      setEmail("");
      setEmpresa("");
      setNotas("");
    }
  }

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="jornada" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase Clientes — Captação de Clientes</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Agora é buscar receita de forma organizada: uma meta concreta, uma oferta pronta pra usar, e o registro de
            cada contato até virar cliente de verdade.
          </Text>
        </View>
      </View>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <CollapsibleSection title="Sua meta de captação" accent="brand">
        <Input
          label="Quantos clientes você quer conquistar?"
          keyboardType="numeric"
          value={String(v.metaInputs.metaClientes)}
          onChangeText={(t) => v.updateMetaInput("metaClientes", parseNumero(t))}
        />
        <Input
          label="Em quantos dias?"
          keyboardType="numeric"
          value={String(v.metaInputs.periodoDias)}
          onChangeText={(t) => v.updateMetaInput("periodoDias", parseNumero(t))}
        />
        <Input
          label="Ticket médio esperado (R$)"
          keyboardType="numeric"
          value={String(v.metaInputs.ticketMedio)}
          onChangeText={(t) => v.updateMetaInput("ticketMedio", parseNumero(t))}
        />
        <Input
          label="Taxa de conversão de referência (%) — editável"
          keyboardType="numeric"
          value={String(v.metaInputs.taxaConversaoPct)}
          onChangeText={(t) => v.updateMetaInput("taxaConversaoPct", parseNumero(t))}
        />
        <Button label="Salvar minha meta" variant="primary" loading={v.savingMeta} onPress={v.salvarMeta} />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[4] }}>
          <View style={{ flexBasis: "48%", flexGrow: 1, backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4] }}>
            <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>FATURAMENTO ESTIMADO</Text>
            <Text style={{ ...type.h3, color: color.bg.brand }}>{formatMoney(v.resultado.faturamentoEstimado)}</Text>
          </View>
          <View style={{ flexBasis: "48%", flexGrow: 1, backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4] }}>
            <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>CONTATOS NECESSÁRIOS</Text>
            <Text style={{ ...type.h3, color: color.bg.brand }}>{v.resultado.contatosNecessarios}</Text>
          </View>
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="Oferta comercial" accent="gold">
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
          Uso o que já sei do seu negócio (nome, slogan, nicho, persona) pra montar isso — sem inventar preço ou
          desconto, essa parte você completa com a condição real.
        </Text>

        {!v.loading && !v.oferta ? (
          <Button label="Gerar oferta comercial" variant="primary" loading={v.generatingOferta} onPress={v.gerarOferta} />
        ) : null}

        {v.oferta ? (
          <View style={{ gap: space[3] }}>
            {(
              [
                ["PRODUTO", v.oferta.produto],
                ["BENEFÍCIO", v.oferta.beneficio],
                ["DIFERENCIAL", v.oferta.diferencial],
                ["CONDIÇÃO", v.oferta.condicao],
                ["PRAZO", v.oferta.prazo],
                ["CHAMADA PARA AÇÃO", v.oferta.cta],
              ] as const
            ).map(([titulo, valor]) => (
              <View key={titulo}>
                <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>{titulo}</Text>
                <Card variant="default" padding={4}>
                  <Text style={{ ...type.body, color: color.text.primary }}>{valor}</Text>
                </Card>
              </View>
            ))}
            <Button
              label="Gerar novamente"
              variant="ghost"
              size="sm"
              loading={v.generatingOferta}
              onPress={v.gerarOferta}
              style={{ alignSelf: "flex-start" }}
            />
          </View>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection title="Adicionar contato" accent="info">
        <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Nome do contato" />
        <Input label="Telefone (opcional)" value={telefone} onChangeText={setTelefone} placeholder="Ex.: (11) 99999-9999" />
        <Input label="E-mail (opcional)" value={email} onChangeText={setEmail} placeholder="Ex.: contato@email.com" />
        <Input label="Empresa (opcional)" value={empresa} onChangeText={setEmpresa} placeholder="Ex.: Buffet Alegria" />
        <Input label="Notas (opcional)" value={notas} onChangeText={setNotas} placeholder="Como chegou até você, interesse, etc." />
        <Button label="Adicionar" variant="primary" loading={v.addingContato} disabled={!nome.trim()} onPress={handleAdicionar} />
      </CollapsibleSection>

      <CollapsibleSection title="Meus contatos" accent="success" rightLabel={String(v.contatos.length)}>
        {v.contatos.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum contato cadastrado ainda.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {v.contatos.map((item) => (
              <ContatoRow
                key={item.id}
                item={item}
                updating={v.updatingContatoId === item.id}
                removing={v.removingContatoId === item.id}
                onStatusChange={(status) => v.atualizarStatusContato(item.id, status)}
                onRemover={() => v.removerContato(item.id)}
              />
            ))}
          </View>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Critérios de conclusão" accent="warning">
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Diferente das fases anteriores, aqui o avanço só libera com ação real — captar Instagram não é o mesmo que
          captar cliente.
        </Text>
        <View style={{ gap: space[3] }}>
          <CriterioRow atendido={v.criterios.metaDefinida} label="Meta de captação definida" />
          <CriterioRow atendido={v.criterios.ofertaCriada} label="Oferta comercial criada" />
          <CriterioRow
            atendido={v.criterios.contatosCadastrados >= v.criterios.contatosMinimos}
            label={`Pelo menos ${v.criterios.contatosMinimos} contatos cadastrados — baseado na sua meta (${v.criterios.contatosCadastrados}/${v.criterios.contatosMinimos})`}
          />
          <CriterioRow
            atendido={v.criterios.abordagensRealizadas >= v.criterios.abordagensMinimas}
            label={`Pelo menos ${v.criterios.abordagensMinimas} abordagens realizadas — baseado na sua meta (${v.criterios.abordagensRealizadas}/${v.criterios.abordagensMinimas})`}
          />
          <CriterioRow
            atendido={v.criterios.respostasRecebidas >= v.criterios.respostasMinimas}
            label={`Pelo menos ${v.criterios.respostasMinimas} respostas recebidas — baseado na sua meta (${v.criterios.respostasRecebidas}/${v.criterios.respostasMinimas})`}
          />
          <CriterioRow
            atendido={v.criterios.orcamentosEnviados >= v.criterios.orcamentosMinimos}
            label={`Pelo menos ${v.criterios.orcamentosMinimos} orçamentos enviados — baseado na sua meta (${v.criterios.orcamentosEnviados}/${v.criterios.orcamentosMinimos})`}
          />
          <CriterioRow atendido={v.criterios.primeiroClienteConquistado} label="Primeiro cliente conquistado" />
        </View>
      </CollapsibleSection>

      {v.criterios.todosAtendidos ? (
        <Card variant="brand" padding={5}>
          <Text style={{ ...type.bodyStrong, color: color.text.onBrand, marginBottom: space[4] }}>
            Todos os critérios atendidos — pode seguir para Primeira Venda quando quiser.
          </Text>
          <Button label="Avançar para Primeira Venda" variant="primary" fullWidth loading={v.advancing} onPress={handleAdvance} />
        </Card>
      ) : (
        <Card variant="default" padding={5}>
          <Text style={{ ...type.body, color: color.text.muted }}>
            O avanço pra Primeira Venda libera automaticamente quando todos os critérios de conclusão acima forem atendidos.
          </Text>
        </Card>
      )}
    </View>
  );
}
