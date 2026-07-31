import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, CollapsibleSection, Input, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import type { FornecedorParceiro, JornadaEtapa, JornadaFornecedor, JornadaInstance } from "@serdono/supabase";
import { useFornecedores } from "./useFornecedores";

interface FornecedoresScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

function ParceiroCard({ parceiro, adding, onAdicionar }: { parceiro: FornecedorParceiro; adding: boolean; onAdicionar: () => void }) {
  return (
    <Card variant="outline" padding={4} style={{ width: 240 }}>
      <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>{parceiro.categoria.toUpperCase()}</Text>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{parceiro.nome}</Text>
      {parceiro.descricao ? (
        <Text style={{ ...type.caption, color: color.text.secondary, marginBottom: space[2] }}>{parceiro.descricao}</Text>
      ) : null}
      {parceiro.regiao ? <Text style={{ ...type.caption, color: color.text.muted }}>Região: {parceiro.regiao}</Text> : null}
      <Button label="Adicionar à minha lista" variant="outline" size="sm" loading={adding} onPress={onAdicionar} style={{ marginTop: space[3] }} />
    </Card>
  );
}

function FornecedorRow({ item, removing, onRemover }: { item: JornadaFornecedor; removing: boolean; onRemover: () => void }) {
  return (
    <Card variant="default" padding={4}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space[3] }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.caption, color: color.text.muted }}>{item.categoria.toUpperCase()}</Text>
          <Text style={{ ...type.bodyStrong, color: color.text.primary, marginTop: 2 }}>{item.nome_fornecedor}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[2] }}>
            {item.avaliacao ? <Text style={{ ...type.caption, color: color.text.secondary }}>Avaliação: {item.avaliacao}</Text> : null}
            {item.preco ? <Text style={{ ...type.caption, color: color.text.secondary }}>Preço: {item.preco}</Text> : null}
            {item.prazo ? <Text style={{ ...type.caption, color: color.text.secondary }}>Prazo: {item.prazo}</Text> : null}
            {item.contato ? <Text style={{ ...type.caption, color: color.text.secondary }}>Contato: {item.contato}</Text> : null}
          </View>
        </View>
        <Button label="Remover" variant="ghost" size="sm" loading={removing} onPress={onRemover} />
      </View>
    </Card>
  );
}

export function FornecedoresScreen({ jornada, etapas, onEtapasChanged }: FornecedoresScreenProps) {
  const router = useRouter();
  const v = useFornecedores(jornada, etapas, onEtapasChanged);

  const [categoria, setCategoria] = useState("");
  const [nomeFornecedor, setNomeFornecedor] = useState("");
  const [avaliacao, setAvaliacao] = useState("");
  const [preco, setPreco] = useState("");
  const [prazo, setPrazo] = useState("");
  const [contato, setContato] = useState("");

  const concluida = v.etapa?.status === "concluida";

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  async function handleAdicionar() {
    if (!categoria.trim() || !nomeFornecedor.trim()) return;
    const ok = await v.adicionarFornecedor({
      categoria: categoria.trim(),
      nome_fornecedor: nomeFornecedor.trim(),
      avaliacao: avaliacao.trim() || undefined,
      preco: preco.trim() || undefined,
      prazo: prazo.trim() || undefined,
      contato: contato.trim() || undefined,
    });
    if (ok) {
      setCategoria("");
      setNomeFornecedor("");
      setAvaliacao("");
      setPreco("");
      setPrazo("");
      setContato("");
    }
  }

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="jornada" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase 8 — Fornecedores</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Quem vai te ajudar a operar: matéria-prima, equipamento, embalagem, serviço terceirizado. Monte sua lista no
            seu ritmo — nada aqui trava a Jornada.
          </Text>
        </View>
      </View>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <CollapsibleSection title="Roteiro de busca" accent="brand">
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
          Eu te aponto quais categorias de fornecedor o seu tipo de negócio costuma precisar, e o que avaliar em cada
          uma — não invento nome de empresa nenhuma, isso você pesquisa e confirma.
        </Text>

        {!v.loading && !v.roteiro ? (
          <Button label="Montar roteiro de busca" variant="primary" loading={v.generatingRoteiro} onPress={v.gerarRoteiro} />
        ) : null}

        {v.roteiro ? (
          <View style={{ gap: space[3] }}>
            {v.roteiro.map((cat) => (
              <Card key={cat.nome} variant="default" padding={4}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{cat.nome}</Text>
                <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[2] }}>{cat.explicacao}</Text>
                <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[3], marginBottom: space[3] }}>
                  <Text style={{ ...type.caption, color: color.text.muted, marginBottom: 2 }}>O QUE AVALIAR</Text>
                  <Text style={{ ...type.body, color: color.text.secondary }}>{cat.o_que_avaliar}</Text>
                </View>
                <Button
                  label="Buscar no Google"
                  variant="outline"
                  size="sm"
                  onPress={() => Linking.openURL(cat.busca_google_url)}
                />
              </Card>
            ))}
            <Button
              label="Montar roteiro novamente"
              variant="ghost"
              size="sm"
              loading={v.generatingRoteiro}
              onPress={v.gerarRoteiro}
              style={{ alignSelf: "flex-start" }}
            />
          </View>
        ) : null}
      </CollapsibleSection>

      {v.parceiros.length > 0 ? (
        <CollapsibleSection title="Parceiros indicados pro seu nicho" accent="gold">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
            {v.parceiros.map((p) => (
              <ParceiroCard key={p.id} parceiro={p} adding={v.addingFornecedor} onAdicionar={() => v.adicionarParceiro(p)} />
            ))}
          </View>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection title="Adicionar fornecedor à minha lista" accent="info">
        <Input label="Categoria" value={categoria} onChangeText={setCategoria} placeholder="Ex.: Embalagens" />
        <Input label="Fornecedor" value={nomeFornecedor} onChangeText={setNomeFornecedor} placeholder="Nome do fornecedor" />
        <Input label="Avaliação (opcional)" value={avaliacao} onChangeText={setAvaliacao} placeholder="Ex.: 4.5 no Google" />
        <Input label="Preço (opcional)" value={preco} onChangeText={setPreco} placeholder="Ex.: R$ 500/mês" />
        <Input label="Prazo (opcional)" value={prazo} onChangeText={setPrazo} placeholder="Ex.: 5 dias úteis" />
        <Input label="Contato (opcional)" value={contato} onChangeText={setContato} placeholder="Telefone, e-mail ou site" />
        <Button
          label="Adicionar"
          variant="primary"
          loading={v.addingFornecedor}
          disabled={!categoria.trim() || !nomeFornecedor.trim()}
          onPress={handleAdicionar}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Minha lista de fornecedores" accent="success" rightLabel={String(v.lista.length)}>
        {v.lista.length === 0 ? (
          <Text style={{ ...type.body, color: color.text.muted }}>Nenhum fornecedor adicionado ainda.</Text>
        ) : (
          <View style={{ gap: space[3] }}>
            {v.lista.map((item) => (
              <FornecedorRow key={item.id} item={item} removing={v.removingId === item.id} onRemover={() => v.removerFornecedor(item.id)} />
            ))}
          </View>
        )}
      </CollapsibleSection>

      <Card variant="outline" padding={5}>
        <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
          <MaryAvatar pose={concluida ? "positivo" : "checklist"} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
              {concluida ? "Lista de fornecedores marcada como pronta!" : "Quando achar que já tem o essencial, marque como concluído"}
            </Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
              Pode voltar aqui e adicionar mais fornecedores sempre que quiser — nada trava.
            </Text>
          </View>
        </View>
        <Button
          label={concluida ? "Desmarcar" : "Concluir"}
          variant={concluida ? "outline" : "primary"}
          fullWidth
          loading={v.toggling}
          onPress={v.toggleConcluido}
          style={{ marginTop: space[4] }}
        />
      </Card>

      <Card variant="brand" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand, marginBottom: space[4] }}>
          Pode seguir para Produto quando quiser — a lista continua aqui, esperando você voltar.
        </Text>
        <Button label="Avançar para Produto" variant="primary" fullWidth loading={v.advancing} onPress={handleAdvance} />
      </Card>
    </View>
  );
}
