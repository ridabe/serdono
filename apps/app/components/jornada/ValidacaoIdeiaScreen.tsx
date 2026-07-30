import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, Input, color, radius, space, type } from "@serdono/ui";
import type { JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { useValidacaoIdeia } from "./useValidacaoIdeia";

interface Persona {
  nome: string;
  idade: number;
  ocupacao: string;
  dores: string[];
  desejos: string[];
  comportamento: string;
}
interface Swot {
  forcas: string[];
  fraquezas: string[];
  oportunidades: string[];
  ameacas: string[];
}
interface Canvas {
  segmentos_clientes: string;
  proposta_valor: string;
  canais: string;
  relacionamento_clientes: string;
  fontes_receita: string;
  recursos_chave: string;
  atividades_chave: string;
  parcerias_chave: string;
  estrutura_custos: string;
}
interface PropostaValor {
  headline: string;
  dores_resolvidas: string[];
  ganhos_entregues: string[];
  diferenciais: string[];
}

interface ValidacaoIdeiaScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

export function ValidacaoIdeiaScreen({ jornada, etapas, onEtapasChanged }: ValidacaoIdeiaScreenProps) {
  const router = useRouter();
  const v = useValidacaoIdeia(jornada, etapas, onEtapasChanged);
  const [showDica, setShowDica] = useState(false);

  const persona = v.deliverables.find((d) => d.tipo === "persona")?.conteudo as unknown as Persona | undefined;
  const swot = v.deliverables.find((d) => d.tipo === "swot")?.conteudo as unknown as Swot | undefined;
  const canvas = v.deliverables.find((d) => d.tipo === "canvas")?.conteudo as unknown as Canvas | undefined;
  const propostaValor = v.deliverables.find((d) => d.tipo === "proposta_valor")?.conteudo as unknown as
    | PropostaValor
    | undefined;

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  return (
    <View style={{ gap: space[5] }}>
      <View>
        <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase 2 — Validação da Ideia</Text>
        <Text style={{ ...type.body, color: color.text.secondary }}>
          Preencha os campos abaixo e deixe a IA gerar os documentos que ajudam a validar sua ideia.
        </Text>
      </View>

      <Card variant="outline" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Checklist</Text>
        <View style={{ gap: space[2] }}>
          {v.checklist.map((item) => (
            <View key={item.slug} style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
              <Text style={{ color: item.done ? color.state.success : color.text.muted }}>{item.done ? "✓" : "○"}</Text>
              <Text style={{ ...type.body, color: item.done ? color.text.primary : color.text.muted }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card variant="default" padding={5}>
        <Input label="Público-alvo" value={v.publicoAlvo} onChangeText={v.setPublicoAlvo} placeholder="Quem é o cliente ideal?" />
        <Input label="Concorrentes" value={v.concorrentes} onChangeText={v.setConcorrentes} placeholder="Quem já faz algo parecido?" />
        <Input label="Diferenciais" value={v.diferenciais} onChangeText={v.setDiferenciais} placeholder="O que te diferencia deles?" />

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{v.error}</Text> : null}

        <Button
          label={v.generating ? "Gerando..." : v.deliverables.length > 0 ? "Gerar novamente" : "Gerar documentos"}
          variant="primary"
          fullWidth
          loading={v.generating}
          disabled={!v.canGenerate}
          onPress={v.generate}
        />
      </Card>

      {v.etapaClientesReais ? (
        <Card variant={v.etapaClientesReais.status === "concluida" ? "outline" : "default"} padding={5}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[3] }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: radius.full,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
                backgroundColor: v.etapaClientesReais.status === "concluida" ? color.state.success : color.state.warningBg,
                borderWidth: v.etapaClientesReais.status === "concluida" ? 0 : 2,
                borderColor: color.state.warning,
              }}
            >
              <Text style={{ color: v.etapaClientesReais.status === "concluida" ? "#fff" : color.state.warning, fontSize: 12, fontWeight: "700" }}>
                {v.etapaClientesReais.status === "concluida" ? "✓" : "!"}
              </Text>
            </View>
            <View style={{ flex: 1, gap: space[1] }}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{v.etapaClientesReais.template.titulo}</Text>
              {v.etapaClientesReais.status !== "concluida" ? (
                <Text style={{ ...type.caption, color: color.state.warning, fontWeight: "700" }}>AGUARDANDO VOCÊ</Text>
              ) : null}
              {showDica && v.etapaClientesReais.template.dica ? (
                <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>{v.etapaClientesReais.template.dica}</Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: space[2], flexWrap: "wrap", marginTop: space[2] }}>
                <Button
                  label={v.etapaClientesReais.status === "concluida" ? "Desmarcar" : "Marquei, feito"}
                  variant={v.etapaClientesReais.status === "concluida" ? "outline" : "primary"}
                  size="sm"
                  loading={v.togglingClientes}
                  onPress={v.toggleClientesReais}
                />
                {v.etapaClientesReais.template.dica ? (
                  <Button label={showDica ? "Ocultar dica" : "Como eu faço isso?"} variant="ghost" size="sm" onPress={() => setShowDica((s) => !s)} />
                ) : null}
              </View>
            </View>
          </View>
        </Card>
      ) : null}

      {persona ? (
        <Card variant="default" padding={5}>
          <Text style={{ ...type.h3, color: color.bg.brand, marginBottom: space[2] }}>Persona</Text>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
            {persona.nome}, {persona.idade} anos — {persona.ocupacao}
          </Text>
          <ListSection title="Dores" items={persona.dores} />
          <ListSection title="Desejos" items={persona.desejos} />
          <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[2] }}>{persona.comportamento}</Text>
        </Card>
      ) : null}

      {swot ? (
        <Card variant="default" padding={5}>
          <Text style={{ ...type.h3, color: color.bg.brand, marginBottom: space[3] }}>SWOT</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
            <View style={{ flexGrow: 1, minWidth: 200 }}>
              <ListSection title="Forças" items={swot.forcas} />
              <ListSection title="Oportunidades" items={swot.oportunidades} />
            </View>
            <View style={{ flexGrow: 1, minWidth: 200 }}>
              <ListSection title="Fraquezas" items={swot.fraquezas} />
              <ListSection title="Ameaças" items={swot.ameacas} />
            </View>
          </View>
        </Card>
      ) : null}

      {canvas ? (
        <Card variant="default" padding={5}>
          <Text style={{ ...type.h3, color: color.bg.brand, marginBottom: space[3] }}>Business Model Canvas</Text>
          <View style={{ gap: space[3] }}>
            <TextBlock title="Segmentos de clientes" text={canvas.segmentos_clientes} />
            <TextBlock title="Proposta de valor" text={canvas.proposta_valor} />
            <TextBlock title="Canais" text={canvas.canais} />
            <TextBlock title="Relacionamento com clientes" text={canvas.relacionamento_clientes} />
            <TextBlock title="Fontes de receita" text={canvas.fontes_receita} />
            <TextBlock title="Recursos-chave" text={canvas.recursos_chave} />
            <TextBlock title="Atividades-chave" text={canvas.atividades_chave} />
            <TextBlock title="Parcerias-chave" text={canvas.parcerias_chave} />
            <TextBlock title="Estrutura de custos" text={canvas.estrutura_custos} />
          </View>
        </Card>
      ) : null}

      {propostaValor ? (
        <Card variant="default" padding={5}>
          <Text style={{ ...type.h3, color: color.bg.brand, marginBottom: space[2] }}>Proposta de Valor</Text>
          <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>{propostaValor.headline}</Text>
          <ListSection title="Dores resolvidas" items={propostaValor.dores_resolvidas} />
          <ListSection title="Ganhos entregues" items={propostaValor.ganhos_entregues} />
          <ListSection title="Diferenciais" items={propostaValor.diferenciais} />
        </Card>
      ) : null}

      <Button
        label={v.advancing ? "Avançando..." : "Avançar para Planejamento"}
        variant="primary"
        fullWidth
        loading={v.advancing}
        disabled={!v.checklistComplete}
        onPress={handleAdvance}
      />
    </View>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={{ marginTop: space[2] }}>
      <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[1] }}>{title.toUpperCase()}</Text>
      {items.map((item, i) => (
        <Text key={i} style={{ ...type.body, color: color.text.secondary }}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <View>
      <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[1] }}>{title.toUpperCase()}</Text>
      <Text style={{ ...type.body, color: color.text.secondary }}>{text}</Text>
    </View>
  );
}
