import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, CollapsibleSection, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import { numeroFase } from "@serdono/core";
import type { JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { exportChecklistPdf, exportEtapaPdf } from "./formalizacaoPdf";
import { useFormalizacao } from "./useFormalizacao";

interface FormalizacaoScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

const REGIME_LABEL = { mei: "MEI", formal: "Empresa formal (LTDA, EI, SLU...)" } as const;

function EtapaCard({
  etapa,
  toggling,
  onToggle,
}: {
  etapa: JornadaEtapa;
  toggling: boolean;
  onToggle: () => void;
}) {
  const [showDica, setShowDica] = useState(false);
  const [exporting, setExporting] = useState(false);
  const documentos = (etapa.template.documentos as unknown as { nome: string; como_obter: string }[]) ?? [];
  const concluida = etapa.status === "concluida";

  async function handleExport() {
    setExporting(true);
    try {
      await exportEtapaPdf(etapa);
    } finally {
      setExporting(false);
    }
  }

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
            {concluida ? "CONCLUÍDA" : "PENDENTE"}
          </Text>
        </View>
      </View>

      {etapa.template.prazo ? (
        <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[3] }}>
          Prazo esperado: {etapa.template.prazo}
        </Text>
      ) : null}

      {documentos.length > 0 ? (
        <View style={{ marginTop: space[4], gap: space[3] }}>
          <Text style={{ ...type.overline, color: color.text.muted }}>DOCUMENTOS</Text>
          {documentos.map((doc) => (
            <View key={doc.nome}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{doc.nome}</Text>
              <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>{doc.como_obter}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {etapa.template.dica ? (
        <View style={{ marginTop: space[4] }}>
          <Button
            label={showDica ? "Ocultar dica" : "Precisa de ajuda com isso?"}
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

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[4] }}>
        <Button
          label={concluida ? "Desmarcar" : "Concluir"}
          variant={concluida ? "outline" : "primary"}
          size="sm"
          loading={toggling}
          onPress={onToggle}
        />
        <Button label="Baixar PDF" variant="outline" size="sm" loading={exporting} onPress={handleExport} />
      </View>
    </Card>
  );
}

export function FormalizacaoScreen({ jornada, etapas, onEtapasChanged }: FormalizacaoScreenProps) {
  const router = useRouter();
  const v = useFormalizacao(jornada, etapas, onEtapasChanged);
  const [changingRegime, setChangingRegime] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  async function handleExportAll() {
    setExportingAll(true);
    try {
      await exportChecklistPdf(`Formalização — ${v.regime ? REGIME_LABEL[v.regime] : ""}`, v.etapasCaminho);
    } finally {
      setExportingAll(false);
    }
  }

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="jornada" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase {numeroFase("formalizacao")} — Formalização</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Aqui começa a abertura de verdade. Vamos documento por documento, sem pular etapa.
          </Text>
        </View>
      </View>

      <Card variant="brand" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>
          Este conteúdo é uma orientação geral — não substitui um contador ou advogado.
        </Text>
        <Text style={{ ...type.body, color: "#C7D3E3", marginTop: space[1] }}>
          Exigências municipais (alvará, licenças) variam de cidade para cidade. Sempre que uma etapa mencionar a
          prefeitura, confirme diretamente com a sua.
        </Text>
      </Card>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <CollapsibleSection title="Formato da empresa" accent="brand">
        {!v.regime || changingRegime ? (
          <>
            <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>
              Qual o formato da sua empresa?
            </Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
              {v.etapaRegime?.template.dica}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
              <Button
                label="Sim, até R$ 81 mil por ano"
                variant="primary"
                loading={v.choosingRegime === "mei"}
                onPress={async () => {
                  await v.chooseRegime("mei");
                  setChangingRegime(false);
                }}
              />
              <Button
                label="Não, pretendo faturar mais"
                variant="outline"
                loading={v.choosingRegime === "formal"}
                onPress={async () => {
                  await v.chooseRegime("formal");
                  setChangingRegime(false);
                }}
              />
            </View>
          </>
        ) : (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[3] }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.caption, color: color.text.muted }}>FORMATO ESCOLHIDO</Text>
              <Text style={{ ...type.bodyStrong, color: color.text.primary, marginTop: space[1] }}>
                {REGIME_LABEL[v.regime]}
              </Text>
            </View>
            <Button label="Mudar" variant="ghost" size="sm" onPress={() => setChangingRegime(true)} />
          </View>
        )}
      </CollapsibleSection>

      {v.regime && !changingRegime && v.etapasCaminho.length > 0 ? (
        <CollapsibleSection
          title="Etapas do caminho escolhido"
          accent="gold"
          rightLabel={`${v.etapasCaminho.filter((e) => e.status === "concluida").length}/${v.etapasCaminho.length}`}
        >
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <Button label="Baixar checklist completo" variant="ghost" size="sm" loading={exportingAll} onPress={handleExportAll} />
          </View>

          <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
            Nenhuma etapa trava outra — pode concluir na ordem que preferir, e desmarcar pra refazer sempre que
            precisar.
          </Text>

          <View style={{ gap: space[3] }}>
            {v.etapasCaminho.map((etapa) => (
              <EtapaCard
                key={etapa.id}
                etapa={etapa}
                toggling={v.togglingSlug === etapa.template.slug}
                onToggle={() => v.toggleEtapa(etapa)}
              />
            ))}
          </View>
        </CollapsibleSection>
      ) : null}

      {v.checklistComplete ? (
        <Card variant="outline" padding={5}>
          <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
            <MaryAvatar pose="positivo" size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Sua empresa está formalizada!</Text>
              <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
                Você pode voltar aqui e desmarcar qualquer etapa se precisar corrigir algo.
              </Text>
            </View>
          </View>
          <Button
            label="Avançar"
            variant="primary"
            fullWidth
            loading={v.advancing}
            onPress={handleAdvance}
            style={{ marginTop: space[4] }}
          />
        </Card>
      ) : null}
    </View>
  );
}
