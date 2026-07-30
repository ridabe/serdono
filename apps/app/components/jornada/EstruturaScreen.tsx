import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import type { JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { useEstrutura } from "./useEstrutura";

interface EstruturaScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

function ChecklistItemCard({
  etapa,
  opcional,
  toggling,
  onToggle,
}: {
  etapa: JornadaEtapa;
  opcional: boolean;
  toggling: boolean;
  onToggle: () => void;
}) {
  const [showDica, setShowDica] = useState(false);
  const concluida = etapa.status === "concluida";

  return (
    <Card variant={concluida ? "outline" : "default"} padding={5}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space[3] }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>{etapa.template.titulo}</Text>
          {etapa.template.descricao ? (
            <Text style={{ ...type.body, color: color.text.secondary }}>{etapa.template.descricao}</Text>
          ) : null}
        </View>
        <View
          style={{
            backgroundColor: concluida ? color.state.successBg : color.bg.surfaceAlt,
            borderRadius: radius.full,
            paddingHorizontal: space[3],
            paddingVertical: space[1],
          }}
        >
          <Text style={{ ...type.caption, color: concluida ? color.state.success : color.text.muted, fontWeight: "700" }}>
            {concluida ? "RESOLVIDO" : "PENDENTE"}
          </Text>
        </View>
      </View>

      {opcional ? (
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: color.state.infoBg,
            borderRadius: radius.sm,
            paddingHorizontal: space[2],
            paddingVertical: 2,
            marginTop: space[3],
          }}
        >
          <Text style={{ ...type.caption, color: color.state.info, fontWeight: "700" }}>
            NÃO ESSENCIAL PARA O SEU TIPO DE NEGÓCIO
          </Text>
        </View>
      ) : null}

      {etapa.template.dica ? (
        <View style={{ marginTop: space[4] }}>
          <Button
            label={showDica ? "Ocultar dica" : "Como faço isso?"}
            variant="ghost"
            size="sm"
            onPress={() => setShowDica((s) => !s)}
          />
          {showDica ? (
            <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4], marginTop: space[2] }}>
              <Text style={{ ...type.body, color: color.text.secondary }}>{etapa.template.dica}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Button
        label={concluida ? "Desmarcar" : "Já resolvi"}
        variant={concluida ? "outline" : "primary"}
        size="sm"
        loading={toggling}
        onPress={onToggle}
        style={{ marginTop: space[4], alignSelf: "flex-start" }}
      />
    </Card>
  );
}

export function EstruturaScreen({ jornada, etapas, onEtapasChanged }: EstruturaScreenProps) {
  const router = useRouter();
  const v = useEstrutura(jornada, etapas, onEtapasChanged);
  const [showOpcionais, setShowOpcionais] = useState(false);

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="checklist" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase 7 — Estrutura</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            A base que seu negócio vai precisar pra funcionar no dia a dia. Marque o que já tem e volte aqui sempre que
            resolver mais um item — nada aqui trava sua Jornada.
          </Text>
        </View>
      </View>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
          Itens essenciais para o seu negócio ({v.concluidos}/{v.itensEssenciais.length})
        </Text>
      </View>

      <Text style={{ ...type.caption, color: color.text.muted }}>
        Nenhum item bloqueia o avanço para a próxima fase — marque quando resolver, mesmo depois de já estar em
        Marketing.
      </Text>

      <View style={{ gap: space[3] }}>
        {v.itensEssenciais.map((etapa) => (
          <ChecklistItemCard
            key={etapa.id}
            etapa={etapa}
            opcional={false}
            toggling={v.togglingSlug === etapa.template.slug}
            onToggle={() => v.toggleEtapa(etapa)}
          />
        ))}
      </View>

      {v.itensOpcionais.length > 0 ? (
        <View style={{ gap: space[3] }}>
          <Button
            label={
              showOpcionais
                ? "Ocultar itens não essenciais"
                : `Ver itens não essenciais para o seu negócio (${v.itensOpcionais.length})`
            }
            variant="ghost"
            size="sm"
            onPress={() => setShowOpcionais((s) => !s)}
            style={{ alignSelf: "flex-start" }}
          />
          {showOpcionais ? (
            <View style={{ gap: space[3] }}>
              {v.itensOpcionais.map((etapa) => (
                <ChecklistItemCard
                  key={etapa.id}
                  etapa={etapa}
                  opcional
                  toggling={v.togglingSlug === etapa.template.slug}
                  onToggle={() => v.toggleEtapa(etapa)}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Card variant={v.checklistComplete ? "outline" : "brand"} padding={5}>
        {v.checklistComplete ? (
          <View style={{ flexDirection: "row", gap: space[3], alignItems: "center", marginBottom: space[4] }}>
            <MaryAvatar pose="positivo" size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Estrutura pronta!</Text>
              <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
                Você pode voltar aqui e desmarcar qualquer item se precisar revisar algo.
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ ...type.bodyStrong, color: color.text.onBrand, marginBottom: space[4] }}>
            Pode seguir para Marketing quando quiser — o checklist continua aqui, esperando você voltar.
          </Text>
        )}
        <Button label="Avançar para Marketing" variant="primary" fullWidth loading={v.advancing} onPress={handleAdvance} />
      </Card>
    </View>
  );
}
