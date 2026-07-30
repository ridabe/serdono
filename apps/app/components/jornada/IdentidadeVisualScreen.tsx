import * as Linking from "expo-linking";
import { Image, Text, View } from "react-native";
import { Button, Card, Input, MaryAvatar, color, space, type } from "@serdono/ui";
import type { JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { useIdentidadeVisual } from "./useIdentidadeVisual";

interface IdentidadeVisualScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

const ESTILO_LABEL = { minimalista: "Minimalista", moderno: "Moderno", classico: "Clássico" } as const;

export function IdentidadeVisualScreen({ jornada, etapas, onEtapasChanged }: IdentidadeVisualScreenProps) {
  const v = useIdentidadeVisual(jornada, etapas, onEtapasChanged);

  if (v.bloqueada) {
    return (
      <View style={{ gap: space[3] }}>
        <Text style={{ ...type.h3, color: color.text.muted }}>Etapa 2 — Identidade visual</Text>
        <Card variant="outline" padding={5}>
          <Text style={{ ...type.body, color: color.text.muted }}>Escolha o nome da empresa na etapa 1 para desbloquear.</Text>
        </Card>
      </View>
    );
  }

  async function handleDownload() {
    const url = await v.downloadLogo();
    if (url) Linking.openURL(url);
  }

  return (
    <View style={{ gap: space[5] }}>
      <View>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Etapa 2 — Identidade visual</Text>
        <Text style={{ ...type.body, color: color.text.secondary }}>
          Me conta um pouco sobre a alma da sua marca e eu gero um slogan e 3 opções de logo pra você escolher.
        </Text>
      </View>

      <Card variant="default" padding={5}>
        <Input
          label="Valores da marca"
          value={v.valoresInput}
          onChangeText={v.setValoresInput}
          placeholder="Ex.: honestidade, cuidado, praticidade"
        />
        <Input
          label="Personalidade (3 palavras)"
          value={v.personalidadeInput}
          onChangeText={v.setPersonalidadeInput}
          placeholder="Ex.: moderna, acolhedora, confiável"
        />

        <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[1] }}>Tom de comunicação</Text>
        <View style={{ flexDirection: "row", gap: space[2], marginBottom: space[3] }}>
          <Button
            label="Casual"
            variant={v.tomComunicacao === "casual" ? "primary" : "outline"}
            size="sm"
            onPress={() => v.setTomComunicacao("casual")}
          />
          <Button
            label="Formal"
            variant={v.tomComunicacao === "formal" ? "primary" : "outline"}
            size="sm"
            onPress={() => v.setTomComunicacao("formal")}
          />
        </View>

        <Input
          label="Cores preferidas"
          value={v.coresPreferidasInput}
          onChangeText={v.setCoresPreferidasInput}
          placeholder="Ex.: azul, dourado"
        />
        <Input
          label="Cores a evitar (opcional)"
          value={v.coresEvitarInput}
          onChangeText={v.setCoresEvitarInput}
          placeholder="Ex.: vermelho"
        />

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{v.error}</Text> : null}

        <Button
          label={v.generating ? "Gerando..." : v.candidatos.length > 0 ? "Gerar novamente" : "Gerar identidade"}
          variant="primary"
          fullWidth
          loading={v.generating}
          disabled={!v.canGenerate}
          onPress={v.generate}
        />
      </Card>

      {v.loading ? null : v.slogan ? (
        <Card variant="brand" padding={5}>
          <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[1] }}>SLOGAN</Text>
          <Text style={{ ...type.h3, color: color.text.onBrand }}>{v.slogan}</Text>
        </Card>
      ) : null}

      {v.candidatos.length > 0 ? (
        <View style={{ gap: space[3] }}>
          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Escolha seu logo</Text>
          {/* Repetido aqui (não só no card do formulário lá em cima) porque
              o erro de "Escolher" acontece nesta seção — sem isso, o
              feedback de falha ficava fora da vista de quem clica aqui e
              parecia que o botão não tinha feito nada (bug real de
              produção, 30/07/2026). */}
          {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
            {v.candidatos.map((c) => (
              <Card key={c.estilo} variant="outline" padding={4} style={{ width: 200 }}>
                <Image
                  source={{ uri: `data:image/png;base64,${c.imagem_base64}` }}
                  style={{ width: "100%", aspectRatio: 1, borderRadius: 8, marginBottom: space[3] }}
                  resizeMode="contain"
                />
                <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>
                  {ESTILO_LABEL[c.estilo]}
                </Text>
                <Button
                  label="Escolher"
                  variant="primary"
                  size="sm"
                  fullWidth
                  loading={v.choosingEstilo === c.estilo}
                  onPress={() => v.chooseLogo(c.estilo)}
                />
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {v.logoPath ? (
        <Card variant="outline" padding={5}>
          <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
            <MaryAvatar pose="checklist" size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Sua identidade visual está pronta!</Text>
              <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
                O logo em alta qualidade fica guardado com você — baixe quando precisar.
              </Text>
            </View>
          </View>
          <Button
            label="Baixar logo"
            variant="secondary"
            fullWidth
            loading={v.downloadingLogo}
            onPress={handleDownload}
            style={{ marginTop: space[4] }}
          />
        </Card>
      ) : null}
    </View>
  );
}
