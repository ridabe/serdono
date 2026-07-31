import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { PERGUNTAS_DIAGNOSTICO } from "@serdono/core";
import { Button, Card, CollapsibleSection, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import type { CategoriaIndicador, JornadaEtapa, JornadaInstance } from "@serdono/supabase";
import { CATEGORIA_INDICADOR_LABEL } from "@serdono/supabase";
import { useOrganizacao } from "./useOrganizacao";

interface OrganizacaoScreenProps {
  jornada: JornadaInstance;
  etapas: JornadaEtapa[];
  onEtapasChanged: () => Promise<void>;
}

function SectionText({ children }: { children: React.ReactNode }) {
  return <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[3] }}>{children}</Text>;
}

function SubTitulo({ children }: { children: React.ReactNode }) {
  return <Text style={{ ...type.bodyStrong, color: color.text.primary, marginTop: space[3], marginBottom: space[1] }}>{children}</Text>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ marginBottom: space[2] }}>
      {items.map((item, i) => (
        <Text key={i} style={{ ...type.body, color: color.text.secondary, marginBottom: space[1] }}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const CATEGORIAS_INDICADOR_ORDEM: CategoriaIndicador[] = ["financeiro", "comercial", "operacional", "clientes"];

const ROTINA: { frequencia: string; itens: string[] }[] = [
  { frequencia: "Diárias", itens: ["Conferir pedidos", "Responder mensagens", "Registrar vendas e despesas", "Verificar entregas"] },
  { frequencia: "Semanais", itens: ["Conferir estoque", "Acompanhar pagamentos", "Organizar documentos", "Contatar fornecedores"] },
  {
    frequencia: "Mensais",
    itens: ["Fechar o fluxo de caixa", "Conferir impostos", "Enviar documentos ao contador", "Atualizar preços", "Planejar metas do mês seguinte"],
  },
  { frequencia: "Anuais / periódicas", itens: ["Renovar licenças", "Revisar contratos", "Avaliar fornecedores", "Verificar obrigações legais"] },
];

const NIVEL_FERRAMENTA_LABEL = { basico: "Básico", intermediario: "Intermediário", avancado: "Avançado" } as const;

export function OrganizacaoScreen({ jornada, etapas, onEtapasChanged }: OrganizacaoScreenProps) {
  const router = useRouter();
  const v = useOrganizacao(jornada, etapas, onEtapasChanged);

  async function handleAdvance() {
    const ok = await v.advance();
    if (ok) router.replace("/jornada");
  }

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", gap: space[4], alignItems: "flex-start" }}>
        <MaryAvatar pose="jornada" size={72} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Fase Organização do Negócio</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Seu negócio começou a funcionar. Agora vamos organizar as informações, o dinheiro e a rotina pra você
            crescer sem perder o controle — sem virar um sistema complicado, só o essencial pra decidir com segurança.
          </Text>
        </View>
      </View>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      <CollapsibleSection title="Diagnóstico de organização" accent="brand">
        <SectionText>
          Você não precisa organizar tudo de uma vez. Vamos começar pelos pontos que oferecem mais risco pro seu
          negócio hoje.
        </SectionText>
        <View style={{ gap: space[3] }}>
          {PERGUNTAS_DIAGNOSTICO.map((p) => (
            <View key={p.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[3] }}>
              <Text style={{ ...type.body, color: color.text.primary, flex: 1 }}>{p.texto}</Text>
              <View style={{ flexDirection: "row", gap: space[2] }}>
                <Button
                  label="Sim"
                  variant={v.respostas[p.id] === true ? "primary" : "outline"}
                  size="sm"
                  onPress={() => v.responderPergunta(p.id, true)}
                />
                <Button
                  label="Não"
                  variant={v.respostas[p.id] === false ? "primary" : "outline"}
                  size="sm"
                  onPress={() => v.responderPergunta(p.id, false)}
                />
              </View>
            </View>
          ))}
        </View>

        <Button
          label={v.diagnosticoConcluido ? "Atualizar diagnóstico" : "Salvar diagnóstico"}
          variant="primary"
          fullWidth
          loading={v.savingDiagnostico}
          disabled={!v.todasRespondidas}
          onPress={v.salvarDiagnostico}
          style={{ marginTop: space[4] }}
        />

        {v.maturidade ? (
          <Card variant="brand" padding={5} style={{ marginTop: space[4] }}>
            <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[1] }}>
              NÍVEL {v.maturidade.nivel} — {v.maturidade.nivelLabel.toUpperCase()}
            </Text>
            <Text style={{ ...type.body, color: color.text.onBrand, marginBottom: space[3] }}>{v.maturidade.nivelDescricao}</Text>
            {v.maturidade.prioridades.length > 0 ? (
              <>
                <Text style={{ ...type.bodyStrong, color: color.text.onBrand, marginBottom: space[1] }}>Prioridades:</Text>
                {v.maturidade.prioridades.map((p, i) => (
                  <Text key={i} style={{ ...type.body, color: "#C7D3E3" }}>
                    • {p}
                  </Text>
                ))}
              </>
            ) : null}
          </Card>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection title="Separação entre pessoa física e empresa" accent="gold">
        <SectionText>
          Faturamento não é o mesmo que lucro. Misturar dinheiro pessoal e da empresa é a causa mais comum de um
          negócio parecer saudável sem estar — é uma das orientações mais importantes desta fase.
        </SectionText>
        <SubTitulo>Plano sugerido</SubTitulo>
        <Bullets
          items={[
            "Abrir ou definir uma conta exclusiva para a empresa",
            "Centralizar recebimentos e pagamentos empresariais nessa conta",
            "Definir uma retirada pessoal fixa (pró-labore), não o faturamento inteiro",
            "Registrar aportes e retiradas extraordinárias",
            "Guardar comprovantes de tudo que sai da conta da empresa",
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Organização financeira" accent="info">
        <SectionText>
          Antes de retirar dinheiro, é importante entender os compromissos da empresa. Se você já usa a calculadora
          da Fase Financeiro, ela continua sendo a fonte da sua projeção — aqui o foco é o dia a dia: o que entra, o
          que sai e o que ainda está por vir.
        </SectionText>
        <SubTitulo>O que vale registrar</SubTitulo>
        <Bullets items={["Entradas: vendas, serviços, adiantamentos, outras receitas", "Saídas: fornecedores, fixas (aluguel, internet, energia), impostos, retirada"]} />
        <SubTitulo>Baixe os modelos</SubTitulo>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
          <Button label="Fluxo de caixa" variant="outline" size="sm" loading={v.baixandoModelo === "fluxo_caixa"} onPress={() => v.baixarModelo("fluxo_caixa")} />
          <Button label="Contas a pagar" variant="outline" size="sm" loading={v.baixandoModelo === "contas_pagar"} onPress={() => v.baixarModelo("contas_pagar")} />
          <Button label="Contas a receber" variant="outline" size="sm" loading={v.baixandoModelo === "contas_receber"} onPress={() => v.baixarModelo("contas_receber")} />
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="Organização de documentos" accent="success">
        <SectionText>
          Um documento bem guardado economiza tempo e evita problemas quando você precisar prestar contas, renovar
          uma licença ou comprovar uma informação.
        </SectionText>
        <SubTitulo>Estrutura de pastas recomendada</SubTitulo>
        <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4], marginBottom: space[3] }}>
          <Text style={{ ...type.mono, color: color.text.secondary }}>
            {"Empresa\n├── 01_Documentos_Empresariais\n├── 02_Contabilidade\n├── 03_Impostos\n├── 04_Bancos\n├── 05_Fornecedores\n├── 06_Clientes_e_Contratos\n├── 07_Produtos_e_Serviços\n├── 08_Marketing\n└── 09_Relatórios"}
          </Text>
        </View>
        <SubTitulo>Boas práticas</SubTitulo>
        <Bullets
          items={[
            "Usar nomes padronizados com data (ex.: 2026-08_contrato-fornecedor.pdf)",
            "Manter uma cópia em nuvem, não só no celular",
            "Fazer backup com frequência regular",
            "Proteger documentos sensíveis (dados de sócios, contratos)",
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Organização de produtos, materiais ou estoque" accent="warning">
        <SectionText>
          Comprar demais imobiliza dinheiro; comprar de menos faz perder venda. O objetivo aqui é saber, a qualquer
          momento, o que você tem, o que está acabando e o que precisa repor.
        </SectionText>
        <Bullets
          items={[
            "Estoque mínimo: a partir de quanto você precisa repor",
            "Ponto de reposição: quando fazer o pedido pro fornecedor",
            "Itens críticos: os que, se faltarem, param a operação",
            "Perdas e desperdício: o que estraga, vence ou fica parado",
          ]}
        />
        <Button label="Baixar modelo de estoque" variant="outline" size="sm" loading={v.baixandoModelo === "estoque"} onPress={() => v.baixarModelo("estoque")} />
      </CollapsibleSection>

      <CollapsibleSection title="Organização de pedidos, serviços e entregas" accent="danger">
        <SectionText>
          Pedido esquecido custa cliente. Um controle simples — mesmo que seja uma planilha — evita depender só da
          memória.
        </SectionText>
        <SubTitulo>Status sugeridos</SubTitulo>
        <Bullets items={["Produtos: recebido → confirmado → em produção → pronto → entregue", "Serviços: solicitado → orçamento enviado → aprovado → em execução → concluído"]} />
        <Button label="Baixar modelo de pedidos" variant="outline" size="sm" loading={v.baixandoModelo === "pedidos"} onPress={() => v.baixarModelo("pedidos")} />
      </CollapsibleSection>

      <CollapsibleSection title="Rotina administrativa" accent="brand">
        <SectionText>
          Organização não significa passar o dia preenchendo planilhas — significa criar pequenos hábitos que ajudam
          você a tomar decisões melhores.
        </SectionText>
        {ROTINA.map((r) => (
          <View key={r.frequencia} style={{ marginBottom: space[3] }}>
            <SubTitulo>{r.frequencia}</SubTitulo>
            <Bullets items={r.itens} />
          </View>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="Ferramentas de gestão" accent="gold">
        <SectionText>
          Eu te aponto categorias de ferramenta pro seu momento atual — nunca uma marca específica, isso você
          pesquisa e compara pelos critérios que fizerem sentido pra você (preço, facilidade de uso, suporte).
        </SectionText>
        {!v.loading && !v.roteiroFerramentas ? (
          <Button label="Montar roteiro de ferramentas" variant="primary" loading={v.generatingFerramentas} onPress={v.gerarFerramentas} />
        ) : null}
        {v.roteiroFerramentas ? (
          <View style={{ gap: space[3] }}>
            {v.roteiroFerramentas.map((cat) => (
              <Card key={cat.nome} variant="default" padding={4}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space[3] }}>
                  <Text style={{ ...type.bodyStrong, color: color.text.primary, flex: 1 }}>{cat.nome}</Text>
                  <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: space[2], paddingVertical: 2 }}>
                    <Text style={{ ...type.caption, color: color.text.muted, fontWeight: "700" }}>{NIVEL_FERRAMENTA_LABEL[cat.nivel]}</Text>
                  </View>
                </View>
                <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>{cat.para_que_serve}</Text>
                <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>Quando faz sentido: {cat.quando_faz_sentido}</Text>
              </Card>
            ))}
            <Button label="Montar novamente" variant="ghost" size="sm" loading={v.generatingFerramentas} onPress={v.gerarFerramentas} style={{ alignSelf: "flex-start" }} />
          </View>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection title="Indicadores básicos" accent="info" rightLabel={`${v.indicadoresSelecionados.length}/${v.maxIndicadores}`}>
        <SectionText>Escolha de 3 a 5 indicadores pra acompanhar — poucos, mas realmente úteis.</SectionText>
        {CATEGORIAS_INDICADOR_ORDEM.map((categoria) => (
          <View key={categoria} style={{ marginBottom: space[3] }}>
            <SubTitulo>{CATEGORIA_INDICADOR_LABEL[categoria]}</SubTitulo>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
              {v.catalogoIndicadores
                .filter((ind) => ind.categoria === categoria)
                .map((ind) => (
                  <Button
                    key={ind.id}
                    label={ind.texto}
                    variant={v.indicadoresSelecionados.includes(ind.id) ? "primary" : "outline"}
                    size="sm"
                    onPress={() => v.toggleIndicador(ind.id)}
                  />
                ))}
            </View>
          </View>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="Plano de organização" accent="success">
        <SectionText>
          Um plano de 30 dias, dividido em semanas — pra você não tentar organizar tudo de uma vez.
        </SectionText>
        <Button
          label="Baixar plano em PDF"
          variant="primary"
          loading={v.baixandoPlano}
          disabled={!v.maturidade}
          onPress={v.baixarPlano}
          style={{ marginBottom: space[4] }}
        />
        {!v.maturidade ? (
          <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
            Complete o diagnóstico acima pra liberar o plano personalizado.
          </Text>
        ) : null}

        <Card variant="outline" padding={5}>
          <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
            <MaryAvatar pose={v.checklistFinalConcluido ? "positivo" : "checklist"} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.bodyStrong, color: color.text.primary }}>
                {v.checklistFinalConcluido ? "Plano confirmado!" : "Confirme quando estiver pronto pra seguir"}
              </Text>
              <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
                Você não precisa ter tudo funcionando perfeitamente — o objetivo é ter entendido o processo e um
                plano de continuidade.
              </Text>
            </View>
          </View>
          <Button
            label={v.checklistFinalConcluido ? "Desmarcar" : "Confirmar plano de organização"}
            variant={v.checklistFinalConcluido ? "outline" : "primary"}
            fullWidth
            loading={v.savingChecklist}
            onPress={v.salvarChecklistFinal}
            style={{ marginTop: space[4] }}
          />
        </Card>
      </CollapsibleSection>

      {v.diagnosticoConcluido && v.checklistFinalConcluido ? (
        <Card variant="brand" padding={5}>
          <Text style={{ ...type.bodyStrong, color: color.text.onBrand, marginBottom: space[4] }}>
            Agora você tem uma rotina mínima de gestão — continue registrando, analisando e melhorando conforme o
            negócio crescer.
          </Text>
          <Button label="Concluir minha Jornada" variant="primary" fullWidth loading={v.advancing} onPress={handleAdvance} />
        </Card>
      ) : (
        <Card variant="default" padding={5}>
          <Text style={{ ...type.body, color: color.text.muted }}>
            A conclusão da Jornada libera quando o diagnóstico e a confirmação do plano estiverem feitos.
          </Text>
        </Card>
      )}
    </View>
  );
}
