import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Image, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Button, Card, CollapsibleSection, IconBadge, Input, MaryAvatar, color, icon, MODULE_ACCENT_CYCLE, moduleAccent, radius, space, type } from "@serdono/ui";
import { numeroFase } from "@serdono/core";
import type { JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { useProduto } from "./useProduto";

// Ícones locais da "Aula rápida" — só usados aqui, não viram um conjunto
// compartilhado tipo `FaseIcon` (§9.14) porque são conceitos de precificação,
// não fases da Jornada. Mesmo padrão de desenho (viewBox 24×24, stroke-only).
type ConceitoIconName = "custo" | "despesas" | "impostos" | "margem";
function ConceitoIcon({ name, color: cor, size = icon.md }: { name: ConceitoIconName; color: string; size?: number }) {
  const common = { stroke: cor, strokeWidth: icon.strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "custo" ? <Path d="M12 3.5v17M16.5 7c0-1.7-1.7-2.5-4.5-2.5S7.5 5.4 7.5 7.5c0 4 9 2 9 6 0 2.1-2.2 3-4.5 3S7.5 15.8 7.5 14" {...common} /> : null}
      {name === "despesas" ? (
        <>
          <Path d="M5 19 19 5" {...common} />
          <Path d="M7.5 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" {...common} />
        </>
      ) : null}
      {name === "impostos" ? (
        <>
          <Path d="M3.5 10 12 4l8.5 6" {...common} />
          <Path d="M5 10v9M9.3 10v9M14.7 10v9M19 10v9M3.5 19h17" {...common} />
        </>
      ) : null}
      {name === "margem" ? (
        <>
          <Path d="M4 17l5-5 4 3 7-8" {...common} />
          <Path d="M20 7h-4.5M20 7v4.5" {...common} />
        </>
      ) : null}
    </Svg>
  );
}
const CONCEITOS_ICON: ConceitoIconName[] = ["custo", "despesas", "impostos", "margem"];

interface ProdutoScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

function parseNumero(texto: string): number {
  const limpo = texto.replace(/[^\d.,]/g, "").replace(",", ".");
  return limpo ? Number(limpo) : 0;
}

function formatMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ResultLine({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    // Linhas vivem dentro de um Card variant="brand" (fundo escuro) — por
    // isso as cores "on dark" (nunca color.text.primary/secondary, feitas
    // pra fundo claro) e o destaque em dourado (color.action.primary), não
    // color.bg.brand — usar a cor do próprio fundo deixava o texto
    // invisível (bug real reportado pelo usuário, 30/07/2026).
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: space[2] }}>
      <Text style={{ ...type.body, color: "#C7D3E3" }}>{label}</Text>
      <Text style={{ ...(destaque ? type.bodyStrong : type.body), color: destaque ? color.action.primary : color.text.onBrand }}>{valor}</Text>
    </View>
  );
}

export function ProdutoScreen({ jornada, etapas, onEtapasChanged }: ProdutoScreenProps) {
  const router = useRouter();
  const v = useProduto(jornada, etapas, onEtapasChanged);
  const concluida = v.etapa?.status === "concluida";

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="jornada" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase {numeroFase("produto")} — Produto</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Como organizar o que você vende e chegar num preço que cobre tudo e ainda deixa lucro. Vamos com calma,
            passo a passo.
          </Text>
        </View>
      </View>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <CollapsibleSection title="Como cadastrar o que você vende" accent="brand">
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
          Existem dois caminhos: uma planilha ou um sistema (ERP/PDV). Pra maioria de quem tá começando, minha
          recomendação é simples: comece pela planilha. Ela é grátis, rápida de ajustar, e já te ensina os campos
          certos — nome, custo, preço, estoque. Migrar depois pra um sistema é fácil, porque os dados já estão
          organizados do jeito certo.
        </Text>
        <Text style={{ ...type.body, color: color.text.secondary }}>
          Vale considerar um sistema desde já se você já tem muitos produtos diferentes, várias pessoas mexendo no
          estoque ao mesmo tempo, ou vende em mais de um canal (loja física + online, por exemplo) — nesses casos a
          planilha começa a ficar difícil de manter sozinha.
        </Text>
      </CollapsibleSection>

      <CollapsibleSection title="Planilha-modelo" accent="gold">
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
          Já vem com os campos certos e 2 exemplos preenchidos (um produto físico, um serviço) — é só duplicar as
          linhas e trocar pelos seus dados.
        </Text>
        <Button label="Baixar planilha-modelo" variant="primary" loading={v.baixando} onPress={v.baixarModelo} />
      </CollapsibleSection>

      <CollapsibleSection title="Aula rápida: como funciona o preço" accent="info">
        {/* Grade de 2 colunas com ícone desenhado (DS-24) — 4 conceitos
            curtos, cabem bem em meia largura mesmo no celular. `minWidth`
            baixo (120) de propósito: dentro de uma `CollapsibleSection` (que
            já tem seu próprio padding) a largura disponível é menor que num
            `Card` direto — `minWidth` alto demais aqui estoura a linha por
            frações de pixel e quebra a grade pra 1 coluna só (mesmo bug já
            visto no Início, SPEC.md SDD-78.1). */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], alignItems: "flex-start" }}>
          {(
            [
              ["custo", "Custo", "Quanto você gasta pra ter aquele produto/serviço pronto — matéria-prima, insumo, sua hora de trabalho."],
              ["despesas", "Despesas variáveis", "O que some do preço de venda antes de sobrar qualquer coisa pra você — taxa de maquininha, comissão de marketplace, frete não repassado."],
              ["impostos", "Impostos", "A parte que vai pro governo sobre aquela venda — no MEI/Simples, geralmente uma % fixa sobre o faturamento."],
              ["margem", "Margem de lucro", "O que sobra de verdade pra você, depois de tudo isso — o motivo de o negócio existir."],
            ] as [ConceitoIconName, string, string][]
          ).map(([nome, titulo, texto], i) => {
            const accent = MODULE_ACCENT_CYCLE[i % MODULE_ACCENT_CYCLE.length];
            return (
              <View key={nome} style={{ flexBasis: "47%", flexGrow: 1, minWidth: 120, gap: space[2] }}>
                <IconBadge accent={accent} size={36}>
                  <ConceitoIcon name={nome} color={moduleAccent[accent].fg} size={18} />
                </IconBadge>
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{titulo}</Text>
                <Text style={{ ...type.body, color: color.text.secondary }}>{texto}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[3], marginTop: space[4] }}>
          <Text style={{ ...type.caption, color: color.text.muted, marginBottom: 2 }}>ERRO MAIS COMUM</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Somar imposto e margem em cima do CUSTO, esquecendo que eles incidem sobre o PREÇO DE VENDA. Isso faz
            cobrar menos do que precisa — o rombo só aparece depois. Por isso a calculadora abaixo já calcula do jeito
            certo.
          </Text>
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="Calculadora de precificação" accent="success">
        <Input
          label="Custo unitário (R$)"
          value={String(v.inputs.custo)}
          onChangeText={(t) => v.updateInput("custo", parseNumero(t))}
          placeholder="0"
          keyboardType="decimal-pad"
        />
        <Input
          label="Despesas variáveis (%) — maquininha, comissão, frete"
          value={String(v.inputs.despesasVariaveisPct)}
          onChangeText={(t) => v.updateInput("despesasVariaveisPct", parseNumero(t))}
          placeholder="0"
          keyboardType="decimal-pad"
        />
        <Input
          label="Impostos (%)"
          value={String(v.inputs.impostosPct)}
          onChangeText={(t) => v.updateInput("impostosPct", parseNumero(t))}
          placeholder="0"
          keyboardType="decimal-pad"
        />
        <Input
          label="Margem de lucro desejada (%)"
          value={String(v.inputs.margemDesejadaPct)}
          onChangeText={(t) => v.updateInput("margemDesejadaPct", parseNumero(t))}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <Button label="Salvar meus números" variant="ghost" size="sm" loading={v.saving} onPress={v.salvar} style={{ marginBottom: space[4] }} />

        {v.inputs.custo <= 0 ? (
          <Card variant="outline" padding={4}>
            <Text style={{ ...type.body, color: color.text.secondary }}>
              Preencha o custo unitário acima pra eu calcular o preço de venda.
            </Text>
          </Card>
        ) : !v.resultado.valido ? (
          <Card variant="outline" padding={4}>
            <Text style={{ ...type.body, color: color.state.danger }}>
              Despesas + impostos + margem somam {v.resultado.percentualTotal}% — isso passa de 100%, não existe preço
              possível com esses números. Baixe pelo menos um dos valores.
            </Text>
          </Card>
        ) : (
          <Card variant="brand" padding={5}>
            <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[1] }}>
              PREÇO DE VENDA SUGERIDO
            </Text>
            <Text style={{ ...type.display, fontSize: 30, color: color.text.onBrand, marginBottom: space[3] }}>
              R$ {formatMoeda(v.resultado.precoVenda)}
            </Text>
            <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.md, padding: space[3] }}>
              <ResultLine label="Despesas variáveis" valor={`R$ ${formatMoeda(v.resultado.valorDespesas)}`} />
              <ResultLine label="Impostos" valor={`R$ ${formatMoeda(v.resultado.valorImpostos)}`} />
              <ResultLine label="Lucro líquido" valor={`R$ ${formatMoeda(v.resultado.lucroLiquido)}`} destaque />
            </View>
            <Text style={{ ...type.caption, color: "#C7D3E3", marginTop: space[3] }}>
              Equivale a um markup de {v.resultado.markupEquivalentePct}% sobre o custo — só de referência, o cálculo
              real já está certo acima.
            </Text>
          </Card>
        )}
      </CollapsibleSection>

      {v.parceirosDev.length > 0 ? (
        <CollapsibleSection title="Quer um sistema exclusivo pro seu negócio?" accent="warning">
          <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>
            Se em algum momento a planilha não bastar mais, tenho um parceiro que desenvolve sistema sob medida:
          </Text>
          {v.parceirosDev.map((p) => (
            <Card key={p.id} variant="default" padding={4} style={{ marginBottom: space[2] }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
                {p.logo_url ? (
                  <Image
                    source={{ uri: p.logo_url }}
                    style={{ width: 40, height: 40, borderRadius: radius.sm }}
                    accessibilityLabel={`Logo de ${p.nome}`}
                  />
                ) : null}
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{p.nome}</Text>
              </View>
              {p.descricao ? <Text style={{ ...type.caption, color: color.text.secondary, marginTop: 2 }}>{p.descricao}</Text> : null}
              {p.contato ? <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>Contato: {p.contato}</Text> : null}
              {p.site ? (
                <Button label="Visitar site" variant="ghost" size="sm" onPress={() => Linking.openURL(p.site!)} style={{ marginTop: space[2], alignSelf: "flex-start" }} />
              ) : null}
            </Card>
          ))}
        </CollapsibleSection>
      ) : null}

      <Card variant="outline" padding={5}>
        <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
          <MaryAvatar pose={concluida ? "positivo" : "checklist"} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
              {concluida ? "Boa, você entendeu como cadastrar e precificar!" : "Quando entender essa parte, marque como concluído"}
            </Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
              Pode voltar aqui e mexer nos números sempre que quiser — nada trava.
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
          Pode seguir para Marketing quando quiser — essa calculadora continua aqui, esperando você voltar.
        </Text>
        <Button label="Avançar" variant="primary" fullWidth loading={v.advancing} onPress={handleAdvance} />
      </Card>
    </View>
  );
}
