import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, CollapsibleSection, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import type { JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { useMarketing } from "./useMarketing";

interface MarketingScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

function ChecklistItemCard({
  etapa,
  toggling,
  onToggle,
}: {
  etapa: JornadaEtapa;
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
            {concluida ? "FEITO" : "PENDENTE"}
          </Text>
        </View>
      </View>

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

export function MarketingScreen({ jornada, etapas, onEtapasChanged }: MarketingScreenProps) {
  const router = useRouter();
  const v = useMarketing(jornada, etapas, onEtapasChanged);

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="jornada" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase 10 — Marketing</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Vou te mostrar como abrir e configurar as contas certas, e já deixo pronta a bio, sugestões de post e de
            anúncio pra você usar.
          </Text>
        </View>
      </View>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <CollapsibleSection title="Contas do negócio" accent="brand" rightLabel={`${v.concluidos}/${v.etapasOrdenadas.length}`}>
        <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
          Nenhum item bloqueia o avanço — marque quando resolver, na ordem que preferir.
        </Text>

        <View style={{ gap: space[3] }}>
          {v.etapasOrdenadas.map((etapa) => (
            <ChecklistItemCard
              key={etapa.id}
              etapa={etapa}
              toggling={v.togglingSlug === etapa.template.slug}
              onToggle={() => v.toggleEtapa(etapa)}
            />
          ))}
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="Bio, posts e anúncios" accent="gold">
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
          Uso o que já sei do seu negócio (nome, slogan, nicho, persona) pra montar isso — sem inventar promoção ou
          preço, essa parte você completa com a oferta real.
        </Text>

        {!v.loading && !v.conteudo ? (
          <Button label="Gerar bio, posts e anúncios" variant="primary" loading={v.generating} onPress={v.gerarConteudo} />
        ) : null}

        {v.conteudo ? (
          <View style={{ gap: space[4] }}>
            <View>
              <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[1] }}>BIO</Text>
              <Card variant="default" padding={4}>
                <Text style={{ ...type.body, color: color.text.primary }}>{v.conteudo.bio}</Text>
              </Card>
            </View>

            <View>
              <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>SUGESTÕES DE POST</Text>
              <View style={{ gap: space[2] }}>
                {v.conteudo.posts.map((post, i) => (
                  <Card key={i} variant="default" padding={4}>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{post.titulo}</Text>
                    <Text style={{ ...type.body, color: color.text.secondary }}>{post.legenda}</Text>
                  </Card>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>SUGESTÕES DE ANÚNCIO</Text>
              <View style={{ gap: space[2] }}>
                {v.conteudo.anuncios.map((anuncio, i) => (
                  <Card key={i} variant="default" padding={4}>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{anuncio.titulo}</Text>
                    <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[2] }}>{anuncio.corpo}</Text>
                    <View style={{ alignSelf: "flex-start", backgroundColor: color.bg.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: space[2], paddingVertical: 2 }}>
                      <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "700" }}>{anuncio.cta.toUpperCase()}</Text>
                    </View>
                  </Card>
                ))}
              </View>
            </View>

            <Button
              label="Gerar novamente"
              variant="ghost"
              size="sm"
              loading={v.generating}
              onPress={v.gerarConteudo}
              style={{ alignSelf: "flex-start" }}
            />
          </View>
        ) : null}
      </CollapsibleSection>

      <Card variant="brand" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand, marginBottom: space[4] }}>
          Pode seguir para Clientes quando quiser — tudo isso continua aqui, esperando você voltar.
        </Text>
        <Button label="Avançar" variant="primary" fullWidth loading={v.advancing} onPress={handleAdvance} />
      </Card>
    </View>
  );
}
