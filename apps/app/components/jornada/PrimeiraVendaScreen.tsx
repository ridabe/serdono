import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, CollapsibleSection, Input, MaryAvatar, color, space, type } from "@serdono/ui";
import type { JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { formatMoney } from "../diagnostico/labels";
import { usePrimeiraVenda } from "./usePrimeiraVenda";

interface PrimeiraVendaScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

function parseNumero(texto: string): number {
  const limpo = texto.replace(/[^\d.,]/g, "").replace(",", ".");
  return limpo ? Number(limpo) : 0;
}

export function PrimeiraVendaScreen({ jornada, etapas, onEtapasChanged }: PrimeiraVendaScreenProps) {
  const router = useRouter();
  const v = usePrimeiraVenda(jornada, etapas, onEtapasChanged);

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="positivo" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase Primeira Venda</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Parabéns por chegar até aqui — se você seguiu os passos da Fase Clientes, já está pronto pra vender de
            verdade. Continue trabalhando seus contatos e volte aqui assim que fechar a primeira.
          </Text>
        </View>
      </View>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <CollapsibleSection title="Seus clientes já conquistados" accent="brand" rightLabel={String(v.contatosCliente.length)}>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
          Estes são os contatos que você já marcou como cliente na Fase Clientes.
        </Text>
        {v.loading ? null : v.contatosCliente.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>
            Nenhum contato marcado como cliente ainda — volte à Fase Clientes e conquiste o primeiro.
          </Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {v.contatosCliente.map((c) => (
              <Card key={c.id} variant="default" padding={4}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{c.nome}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[1] }}>
                  {c.empresa ? <Text style={{ ...type.caption, color: color.text.secondary }}>{c.empresa}</Text> : null}
                  {c.telefone ? <Text style={{ ...type.caption, color: color.text.secondary }}>{c.telefone}</Text> : null}
                  {c.email ? <Text style={{ ...type.caption, color: color.text.secondary }}>{c.email}</Text> : null}
                </View>
              </Card>
            ))}
          </View>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Registrar sua primeira venda" accent="gold">
        {v.contatosCliente.length > 0 ? (
          <>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>
              Qual desses foi a sua primeira venda? (opcional)
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[4] }}>
              {v.contatosCliente.map((c) => (
                <Button
                  key={c.id}
                  label={c.nome}
                  variant={v.contatoId === c.id ? "primary" : "outline"}
                  size="sm"
                  onPress={() => v.selecionarContato(c.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        <Input
          label="Valor da venda (R$) — opcional"
          keyboardType="numeric"
          value={String(v.valor)}
          onChangeText={(t) => v.setValor(parseNumero(t))}
          placeholder="0"
        />

        <Button
          label={v.concluida ? "Atualizar registro" : "Registrar minha primeira venda"}
          variant="primary"
          fullWidth
          loading={v.saving}
          onPress={v.registrar}
        />
      </CollapsibleSection>

      {v.concluida ? (
        <Card variant="brand" padding={5}>
          <Text style={{ ...type.h3, color: color.text.onBrand, marginBottom: space[1] }}>
            🎉 Parabéns! Sua empresa realizou a primeira venda.
          </Text>
          {v.valor > 0 && v.metaSalva && v.metaSalva.ticketMedio > 0 ? (
            <Text style={{ ...type.body, color: "#C7D3E3", marginBottom: space[4] }}>
              Você tinha estimado um ticket médio de {formatMoney(v.metaSalva.ticketMedio)} — essa venda foi de{" "}
              {formatMoney(v.valor)}.
            </Text>
          ) : (
            <Text style={{ ...type.body, color: "#C7D3E3", marginBottom: space[4] }}>
              Esse é só o primeiro passo — a partir de agora, siga captando e registrando cada nova venda.
            </Text>
          )}
          <Button label="Avançar para Retenção" variant="primary" fullWidth loading={v.advancing} onPress={handleAdvance} />
        </Card>
      ) : (
        <Card variant="default" padding={5}>
          <Text style={{ ...type.body, color: color.text.muted }}>
            O avanço pra Retenção libera assim que você registrar sua primeira venda acima.
          </Text>
        </Card>
      )}
    </View>
  );
}
