import { Text, View } from "react-native";
import { Button, Card, CollapsibleSection, Input, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import type { JornadaInstance } from "@serdono/supabase";
import { useNomeEmpresa } from "./useNomeEmpresa";

interface NomeEmpresaScreenProps {
  jornada: JornadaInstance;
  onEtapasChanged: () => Promise<void>;
}

function Disponibilidade({ label, disponivel }: { label: string; disponivel: boolean | null }) {
  const bg = disponivel === true ? color.state.successBg : disponivel === false ? color.state.dangerBg : color.bg.canvas;
  const fg = disponivel === true ? color.state.success : disponivel === false ? color.state.danger : color.text.muted;
  const texto = disponivel === true ? "Disponível" : disponivel === false ? "Indisponível" : "Não verificado";

  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: space[1] }}>
      <Text style={{ ...type.caption, color: fg, fontWeight: "600" }}>
        {label}: {texto}
      </Text>
    </View>
  );
}

export function NomeEmpresaScreen({ jornada, onEtapasChanged }: NomeEmpresaScreenProps) {
  const v = useNomeEmpresa(jornada, onEtapasChanged);

  return (
    <View style={{ gap: space[5] }}>
      <View>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>Etapa 1 — Nome da empresa</Text>
        <Text style={{ ...type.body, color: color.text.secondary }}>
          Me conta algumas palavras que representam seu negócio e eu gero 10 sugestões de nome — já com domínio e
          Instagram verificados, pra você escolher com mais segurança.
        </Text>
      </View>

      <CollapsibleSection title="Gerar nomes" accent="brand">
        <Input
          label="Palavras-chave"
          value={v.palavrasChaveInput}
          onChangeText={v.setPalavrasChaveInput}
          placeholder="Ex.: doces, artesanal, festas, delicadeza"
        />
        <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
          Separe por vírgula. Quanto mais específico, melhores os nomes.
        </Text>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{v.error}</Text> : null}

        <Button
          label={v.generating ? "Gerando..." : v.candidatos.length > 0 ? "Gerar novamente" : "Gerar nomes"}
          variant="primary"
          fullWidth
          loading={v.generating}
          disabled={v.palavrasChaveInput.trim().length === 0}
          onPress={v.generate}
        />
      </CollapsibleSection>

      {v.loading ? null : v.candidatos.length > 0 ? (
        <CollapsibleSection title="Sugestões de nome" accent="gold" rightLabel={String(v.candidatos.length)}>
          {/* Largura cheia, não grade (DS-24, exceção): nome do negócio +
              botão + 3 badges de disponibilidade é denso demais pra ficar
              legível em meia-largura no celular — decisão que precisa de
              espaço pra comparar, não é um resumo curto tipo KPI. */}
          <View style={{ gap: space[3] }}>
            {v.candidatos.map((c) => {
              const escolhido = v.nomeEscolhido === c.nome;
              return (
                <Card key={c.nome} variant={escolhido ? "brand" : "outline"} padding={5}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[3] }}>
                    <Text style={{ ...type.h3, color: escolhido ? color.text.onBrand : color.text.primary, flex: 1 }}>
                      {c.nome}
                    </Text>
                    <Button
                      label={escolhido ? "Escolhido ✓" : "Escolher"}
                      variant={escolhido ? "secondary" : "outline"}
                      size="sm"
                      loading={v.choosing === c.nome}
                      onPress={() => v.choose(c.nome)}
                    />
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] }}>
                    <Disponibilidade label={`${c.slug}.com.br`} disponivel={c.dominio_com_br.disponivel} />
                    <Disponibilidade label={`${c.slug}.com`} disponivel={c.dominio_com.disponivel} />
                    <Disponibilidade label={`@${c.slug}`} disponivel={c.instagram.disponivel} />
                  </View>
                </Card>
              );
            })}
          </View>
        </CollapsibleSection>
      ) : null}

      {v.nomeEscolhido ? (
        <Card variant="outline" padding={5}>
          <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
            <MaryAvatar pose="positivo" size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Nome escolhido: {v.nomeEscolhido}</Text>
              <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
                Você pode trocar a qualquer momento escolhendo outro nome acima.
              </Text>
            </View>
          </View>
        </Card>
      ) : null}
    </View>
  );
}
