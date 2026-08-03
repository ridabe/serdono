import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Button, Card, color, radius, space, type } from "@serdono/ui";
import { REGIME_LABEL, STATUS_LABEL, type RegimeEmpresa, type StatusObrigacao } from "@serdono/core";
import { ScreenHeader } from "../shell/ScreenHeader";
import { exportObrigacoesPdf } from "./obrigacoesPdf";
import { useObrigacoes, type ObrigacaoNaTela } from "./useObrigacoes";

const STATUS_COR: Record<StatusObrigacao, string> = {
  atrasado: color.state.danger,
  proximo: color.state.warning,
  no_prazo: color.state.success,
  sem_prazo_fixo: color.state.info,
  concluido: color.text.muted,
};

const STATUS_FUNDO: Record<StatusObrigacao, string> = {
  atrasado: color.state.dangerBg,
  proximo: color.state.warningBg,
  no_prazo: color.state.successBg,
  sem_prazo_fixo: color.state.infoBg,
  concluido: color.bg.surfaceAlt,
};

const REGIMES: RegimeEmpresa[] = ["mei", "simples", "presumido_real"];

/**
 * Módulo Meu Negócio em Dia (PRD §12.8, SPEC.md SDD-61).
 *
 * Aviso fixo no topo (RN-21/RN-36): o produto orienta prazo e procedimento,
 * nunca calcula imposto devido nem substitui contador. Lista ordenada por
 * urgência — quem está atrasado aparece primeiro, porque é isso que o
 * empreendedor veio descobrir ao abrir a tela.
 */
export function ObrigacoesScreen() {
  const router = useRouter();
  const v = useObrigacoes();

  if (v.loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader webLinks={[{ label: "← Voltar ao painel", onPress: () => router.push("/inicio") }]} />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary }}>Meu Negócio em Dia</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
            O que você precisa pagar, declarar ou renovar pra não perder o seu CNPJ — com data real e passo a passo,
            no seu regime.
          </Text>
        </View>

        <View style={{ backgroundColor: color.state.warningBg, borderRadius: radius.md, padding: space[4] }}>
          <Text style={{ ...type.caption, color: color.text.primary }}>
            Orientação geral sobre prazos e procedimentos — eu não calculo imposto devido e não substituo um
            contador. Regras que variam por estado ou cidade (ICMS, ISS, alvará) eu sempre sinalizo que precisam de
            consulta local; e valores/alíquotas podem mudar de um ano pro outro, então confira sempre a fonte
            oficial indicada em cada item.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.config == null ? (
          <DefinirConfig salvando={v.salvando} sugestaoRegime={v.sugestaoRegime} onSalvar={v.definirConfig} />
        ) : (
          <>
            <ConfigAtual config={v.config} salvando={v.salvando} onMudar={v.definirConfig} />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Button
                label="Exportar checklist em PDF"
                variant="outline"
                size="sm"
                onPress={() => exportObrigacoesPdf(v.config!.regime, v.obrigacoes)}
              />
            </View>

            <View style={{ gap: space[3] }}>
              {v.obrigacoes.map((o) => (
                <ObrigacaoCard
                  key={o.id}
                  obrigacao={o}
                  salvando={v.salvando}
                  onConcluir={v.concluirPeriodo}
                  onDesfazer={v.desfazerConclusao}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---- Config (regime + funcionários) ----

function DefinirConfig({
  salvando,
  sugestaoRegime,
  onSalvar,
}: {
  salvando: boolean;
  sugestaoRegime: RegimeEmpresa | null;
  onSalvar: (regime: RegimeEmpresa, temFuncionarios: boolean) => void;
}) {
  const [regime, setRegime] = useState<RegimeEmpresa | null>(sugestaoRegime);
  const [temFuncionarios, setTemFuncionarios] = useState(false);

  return (
    <Card variant="brand" padding={6}>
      <Text style={{ ...type.h2, color: color.text.onBrand, marginBottom: space[2] }}>
        Primeiro, o formato da sua empresa
      </Text>
      <Text style={{ ...type.body, color: color.bg.brandSubtle, marginBottom: space[4] }}>
        As obrigações mudam bastante entre MEI, ME/EPP no Simples Nacional e Lucro Presumido/Real — eu preciso saber
        o seu regime pra não te mostrar prazo que não se aplica ao seu negócio.
      </Text>

      <View style={{ backgroundColor: color.bg.surface, borderRadius: radius.md, padding: space[4], gap: space[3] }}>
        <View style={{ gap: space[2] }}>
          {REGIMES.map((r) => (
            <Button
              key={r}
              label={REGIME_LABEL[r]}
              variant={regime === r ? "primary" : "outline"}
              onPress={() => setRegime(r)}
              fullWidth
            />
          ))}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space[2] }}>
          <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>A empresa tem funcionários?</Text>
          <Switch value={temFuncionarios} onValueChange={setTemFuncionarios} />
        </View>

        <Button
          label={salvando ? "Salvando..." : "Continuar"}
          variant="primary"
          fullWidth
          loading={salvando}
          disabled={!regime}
          onPress={() => regime && onSalvar(regime, temFuncionarios)}
        />
      </View>

      <Text style={{ ...type.caption, color: color.bg.brandSubtle, marginTop: space[3] }}>
        Dá pra mudar isso depois, a qualquer momento.
      </Text>
    </Card>
  );
}

function ConfigAtual({
  config,
  salvando,
  onMudar,
}: {
  config: { regime: RegimeEmpresa; temFuncionarios: boolean };
  salvando: boolean;
  onMudar: (regime: RegimeEmpresa, temFuncionarios: boolean) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [regime, setRegime] = useState<RegimeEmpresa>(config.regime);
  const [temFuncionarios, setTemFuncionarios] = useState(config.temFuncionarios);

  if (!editando) {
    return (
      <Card variant="default" padding={4}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] }}>
          <Text style={{ ...type.caption, color: color.text.secondary, flex: 1 }}>
            {REGIME_LABEL[config.regime]}
            {config.temFuncionarios ? " · com funcionários" : ""}
          </Text>
          <Button label="Mudar" variant="ghost" size="sm" onPress={() => setEditando(true)} />
        </View>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding={4}>
      <View style={{ gap: space[2] }}>
        {REGIMES.map((r) => (
          <Button key={r} label={REGIME_LABEL[r]} variant={regime === r ? "primary" : "outline"} onPress={() => setRegime(r)} fullWidth />
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: space[3] }}>
        <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>A empresa tem funcionários?</Text>
        <Switch value={temFuncionarios} onValueChange={setTemFuncionarios} />
      </View>
      <View style={{ flexDirection: "row", gap: space[2] }}>
        <Button
          label="Salvar"
          variant="primary"
          size="sm"
          loading={salvando}
          onPress={() => {
            onMudar(regime, temFuncionarios);
            setEditando(false);
          }}
        />
        <Button label="Cancelar" variant="ghost" size="sm" onPress={() => setEditando(false)} />
      </View>
    </Card>
  );
}

// ---- Lista de obrigações ----

function formatarData(iso: string | null): string {
  if (!iso) return "Sem prazo fixo";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function ObrigacaoCard({
  obrigacao,
  salvando,
  onConcluir,
  onDesfazer,
}: {
  obrigacao: ObrigacaoNaTela;
  salvando: boolean;
  onConcluir: (obrigacaoId: string, periodoReferencia: string) => Promise<void>;
  onDesfazer: (obrigacaoId: string, periodoReferencia: string) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const concluido = obrigacao.status === "concluido";

  return (
    <Card variant="outline" padding={4}>
      <Pressable onPress={() => setAberto(!aberto)} accessibilityRole="button" accessibilityLabel={`${obrigacao.nome}, ${STATUS_LABEL[obrigacao.status]}`}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[3] }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{obrigacao.nome}</Text>
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>
              {obrigacao.dataVencimento ? `Vence em ${formatarData(obrigacao.dataVencimento)}` : "Sem prazo fixo — consulte o órgão responsável"}
            </Text>
          </View>
          <Etiqueta status={obrigacao.status} />
        </View>
      </Pressable>

      {aberto ? (
        <View style={{ marginTop: space[4], gap: space[3] }}>
          <Text style={{ ...type.body, color: color.text.secondary }}>{obrigacao.descricao}</Text>

          <View>
            <Text style={{ ...type.overline, color: color.text.muted }}>COMO FAZER</Text>
            <Text style={{ ...type.body, color: color.text.primary, marginTop: space[1] }}>{obrigacao.comoFazer}</Text>
          </View>

          <Text style={{ ...type.caption, color: color.text.muted }}>
            Fonte: {obrigacao.fonteUrl} (consultada em {formatarData(obrigacao.fonteData)})
          </Text>

          {obrigacao.dataVencimento ? (
            <Button
              label={concluido ? "Desmarcar conclusão deste período" : "Marcar como resolvido neste período"}
              variant={concluido ? "ghost" : "primary"}
              size="sm"
              loading={salvando}
              onPress={() =>
                concluido
                  ? onDesfazer(obrigacao.id, obrigacao.periodoReferencia)
                  : onConcluir(obrigacao.id, obrigacao.periodoReferencia)
              }
              style={{ alignSelf: "flex-start" }}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function Etiqueta({ status }: { status: StatusObrigacao }) {
  return (
    <View style={{ backgroundColor: STATUS_FUNDO[status], borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: 4 }}>
      <Text style={{ ...type.caption, color: STATUS_COR[status], fontWeight: "700" }}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}
