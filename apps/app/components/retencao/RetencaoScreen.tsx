import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import {
  Button,
  Card,
  CollapsibleSection,
  Input,
  SECTION_ACCENT_CYCLE,
  color,
  radius,
  space,
  type,
} from "@serdono/ui";
import { CICLO_RECOMPRA_PADRAO_DIAS, SITUACAO_LABEL, hojeISO, type SituacaoCliente } from "@serdono/core";
import type { RoteiroReaproximacao } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { formatMoney } from "../diagnostico/labels";
import { useRetencao, type ClienteNaTela } from "./useRetencao";

/**
 * Módulo Retenção de Clientes (PRD §12.5, SPEC.md SDD-54) — primeira tela de
 * módulo do catálogo com rota própria.
 *
 * A tela inteira é organizada por urgência, não por ordem alfabética: quem
 * sumiu aparece primeiro, porque o único motivo de alguém abrir este módulo é
 * descobrir quem precisa de atenção hoje.
 */
export function RetencaoScreen() {
  const router = useRouter();
  const v = useRetencao();

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
          <Text style={{ ...type.h1, color: color.text.primary }}>Retenção de Clientes</Text>
          <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>
            Conquistar cliente novo custa caro. Aqui você acompanha quem já comprou de você — e age antes da pessoa
            esquecer que seu negócio existe.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.ciclo == null ? (
          <DefinirCiclo salvando={v.salvando} onSalvar={v.definirCiclo} />
        ) : (
          <>
            {v.resumo ? <Resumo resumo={v.resumo} ciclo={v.ciclo} onTrocarCiclo={v.definirCiclo} salvando={v.salvando} /> : null}

            <CollapsibleSection title="Minha carteira" accent={SECTION_ACCENT_CYCLE[0]} rightLabel={`${v.clientes.length}`}>
              {v.clientes.length === 0 ? (
                <CarteiraVazia podeImportar={v.podeImportar} onImportar={v.importarDaJornada} salvando={v.salvando} />
              ) : (
                <View style={{ gap: space[3] }}>
                  {v.clientes.map((cliente) => (
                    <ClienteCard
                      key={cliente.id}
                      cliente={cliente}
                      salvando={v.salvando}
                      onRegistrar={v.registrarInteracao}
                      onExcluir={v.excluirCliente}
                      onCarregarRoteiro={v.carregarRoteiro}
                      onGerarRoteiro={v.gerarRoteiro}
                    />
                  ))}
                </View>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Adicionar cliente" accent={SECTION_ACCENT_CYCLE[1]}>
              <NovoCliente salvando={v.salvando} onSalvar={v.cadastrarCliente} />
              {v.podeImportar ? (
                <ImportarDaJornada onImportar={v.importarDaJornada} salvando={v.salvando} />
              ) : null}
            </CollapsibleSection>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---- Ciclo de recompra ----

function DefinirCiclo({ salvando, onSalvar }: { salvando: boolean; onSalvar: (dias: number) => void }) {
  const [dias, setDias] = useState(String(CICLO_RECOMPRA_PADRAO_DIAS));
  const numero = Number(dias);
  const valido = Number.isFinite(numero) && numero >= 1 && numero <= 1095;

  return (
    <Card variant="brand" padding={6}>
      <Text style={{ ...type.h2, color: color.text.onBrand, marginBottom: space[2] }}>
        Primeiro, uma pergunta sobre o seu negócio
      </Text>
      <Text style={{ ...type.body, color: color.bg.brandSubtle, marginBottom: space[4] }}>
        De quanto em quanto tempo um cliente seu costuma voltar a comprar? Num salão isso pode ser 30 dias; numa
        consultoria, 180. Eu preciso desse número seu pra saber quando alguém está demorando demais — não dá pra
        chutar uma regra igual pra todo negócio.
      </Text>

      <View style={{ backgroundColor: color.bg.surface, borderRadius: radius.md, padding: space[4] }}>
        <Input
          label="Um cliente costuma voltar a cada quantos dias?"
          value={dias}
          onChangeText={setDias}
          keyboardType="numeric"
          placeholder="30"
        />
        {!valido && dias.trim() !== "" ? (
          <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>
            Informe um número de dias entre 1 e 1095 (3 anos).
          </Text>
        ) : null}
        <Button
          label={salvando ? "Salvando..." : "Continuar"}
          variant="primary"
          fullWidth
          loading={salvando}
          disabled={!valido}
          onPress={() => onSalvar(Math.round(numero))}
        />
      </View>

      <Text style={{ ...type.caption, color: color.bg.brandSubtle, marginTop: space[3] }}>
        Dá pra mudar esse número depois, sempre que perceber que o ritmo do seu negócio é outro.
      </Text>
    </Card>
  );
}

// ---- Resumo ----

const SITUACAO_COR: Record<SituacaoCliente, string> = {
  em_dia: color.state.success,
  esfriando: color.state.warning,
  sumido: color.state.danger,
  sem_historico: color.text.muted,
};

const SITUACAO_FUNDO: Record<SituacaoCliente, string> = {
  em_dia: color.state.successBg,
  esfriando: color.state.warningBg,
  sumido: color.state.dangerBg,
  sem_historico: color.bg.surfaceAlt,
};

function Resumo({
  resumo,
  ciclo,
  onTrocarCiclo,
  salvando,
}: {
  resumo: { total: number; emDia: number; esfriando: number; sumidos: number; semHistorico: number; taxaRetornoPct: number | null };
  ciclo: number;
  onTrocarCiclo: (dias: number) => void;
  salvando: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [dias, setDias] = useState(String(ciclo));
  const numero = Number(dias);
  const valido = Number.isFinite(numero) && numero >= 1 && numero <= 1095;

  return (
    <Card variant="default" padding={5}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
        <Contador rotulo="Sumidos" valor={resumo.sumidos} situacao="sumido" />
        <Contador rotulo="Esfriando" valor={resumo.esfriando} situacao="esfriando" />
        <Contador rotulo="Em dia" valor={resumo.emDia} situacao="em_dia" />
        {resumo.semHistorico > 0 ? (
          <Contador rotulo="Sem histórico" valor={resumo.semHistorico} situacao="sem_historico" />
        ) : null}
      </View>

      <View style={{ height: 1, backgroundColor: color.border.default, marginVertical: space[4] }} />

      <Text style={{ ...type.overline, color: color.text.muted }}>CLIENTES QUE VOLTARAM</Text>
      <Text style={{ ...(resumo.taxaRetornoPct != null ? type.h2 : type.body), color: resumo.taxaRetornoPct != null ? color.text.primary : color.text.muted, marginTop: space[1] }}>
        {resumo.taxaRetornoPct != null ? `${resumo.taxaRetornoPct}%` : "Ainda sem compra registrada"}
      </Text>
      <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>
        {resumo.taxaRetornoPct != null
          ? "de quem já comprou, é quem comprou mais de uma vez"
          : "registre a primeira compra de um cliente pra este número existir"}
      </Text>

      <View style={{ height: 1, backgroundColor: color.border.default, marginVertical: space[4] }} />

      {editando ? (
        <View>
          <Input label="Um cliente costuma voltar a cada quantos dias?" value={dias} onChangeText={setDias} keyboardType="numeric" />
          <View style={{ flexDirection: "row", gap: space[2] }}>
            <Button
              label="Salvar"
              variant="primary"
              size="sm"
              loading={salvando}
              disabled={!valido}
              onPress={() => {
                onTrocarCiclo(Math.round(numero));
                setEditando(false);
              }}
            />
            <Button label="Cancelar" variant="ghost" size="sm" onPress={() => setEditando(false)} />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] }}>
          <Text style={{ ...type.caption, color: color.text.secondary, flex: 1 }}>
            Considerando que um cliente seu volta a cada {ciclo} dias.
          </Text>
          <Button label="Mudar" variant="ghost" size="sm" onPress={() => setEditando(true)} />
        </View>
      )}
    </Card>
  );
}

function Contador({ rotulo, valor, situacao }: { rotulo: string; valor: number; situacao: SituacaoCliente }) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 96,
        minWidth: 0,
        backgroundColor: SITUACAO_FUNDO[situacao],
        borderRadius: radius.md,
        padding: space[3],
      }}
    >
      <Text style={{ ...type.h1, color: SITUACAO_COR[situacao], fontVariant: ["tabular-nums"] }}>{valor}</Text>
      <Text style={{ ...type.caption, color: color.text.secondary }}>{rotulo}</Text>
    </View>
  );
}

// ---- Carteira ----

function CarteiraVazia({
  podeImportar,
  onImportar,
  salvando,
}: {
  podeImportar: boolean;
  onImportar: () => Promise<{ importados: number; jaExistiam: number } | null>;
  salvando: boolean;
}) {
  return (
    <View style={{ gap: space[3] }}>
      <Text style={{ ...type.body, color: color.text.secondary }}>
        Sua carteira ainda está vazia.{" "}
        {podeImportar
          ? "Posso trazer os clientes que você já conquistou na Jornada, ou você cadastra um por um aqui embaixo."
          : "Cadastre seu primeiro cliente na seção abaixo."}
      </Text>
      {podeImportar ? <ImportarDaJornada onImportar={onImportar} salvando={salvando} /> : null}
    </View>
  );
}

function ImportarDaJornada({
  onImportar,
  salvando,
}: {
  onImportar: () => Promise<{ importados: number; jaExistiam: number } | null>;
  salvando: boolean;
}) {
  const [resultado, setResultado] = useState<string | null>(null);

  async function handleImportar() {
    const r = await onImportar();
    if (!r) return;
    if (r.importados === 0 && r.jaExistiam === 0) {
      setResultado("Você ainda não marcou nenhum contato como cliente na Jornada — nada pra trazer por enquanto.");
    } else if (r.importados === 0) {
      setResultado(
        r.jaExistiam === 1
          ? "Nada novo: o único cliente da Jornada já está aqui."
          : `Nada novo: os ${r.jaExistiam} clientes da Jornada já estão aqui.`
      );
    } else {
      setResultado(
        `${r.importados} cliente${r.importados > 1 ? "s" : ""} trazido${r.importados > 1 ? "s" : ""} da Jornada.` +
          (r.jaExistiam > 0 ? ` (${r.jaExistiam} já estavam aqui.)` : "")
      );
    }
  }

  return (
    <View style={{ marginTop: space[2] }}>
      <Button
        label={salvando ? "Trazendo..." : "Trazer clientes da Jornada"}
        variant="outline"
        size="sm"
        loading={salvando}
        onPress={handleImportar}
        style={{ alignSelf: "flex-start" }}
      />
      {resultado ? (
        <Text style={{ ...type.caption, color: color.text.secondary, marginTop: space[2] }}>{resultado}</Text>
      ) : null}
    </View>
  );
}

function ClienteCard({
  cliente,
  salvando,
  onRegistrar,
  onExcluir,
  onCarregarRoteiro,
  onGerarRoteiro,
}: {
  cliente: ClienteNaTela;
  salvando: boolean;
  onRegistrar: (clienteId: string, input: { tipo: "compra" | "contato"; valor?: number | null; ocorridaEm: string; notas?: string }) => Promise<void>;
  onExcluir: (id: string) => Promise<void>;
  onCarregarRoteiro: (id: string) => Promise<RoteiroReaproximacao | null>;
  onGerarRoteiro: (id: string) => Promise<RoteiroReaproximacao | null>;
}) {
  const [aberto, setAberto] = useState(false);
  const [valorCompra, setValorCompra] = useState("");
  const [roteiro, setRoteiro] = useState<RoteiroReaproximacao | null>(null);
  const [gerando, setGerando] = useState(false);

  async function handleAbrir() {
    const proximoEstado = !aberto;
    setAberto(proximoEstado);
    if (proximoEstado && roteiro === null) {
      setRoteiro(await onCarregarRoteiro(cliente.id));
    }
  }

  async function handleGerarRoteiro() {
    setGerando(true);
    const novo = await onGerarRoteiro(cliente.id);
    if (novo) setRoteiro(novo);
    setGerando(false);
  }

  async function handleRegistrarCompra() {
    const valor = valorCompra.trim() === "" ? null : Number(valorCompra.replace(",", "."));
    await onRegistrar(cliente.id, {
      tipo: "compra",
      valor: Number.isFinite(valor as number) ? valor : null,
      ocorridaEm: hojeISO(),
    });
    setValorCompra("");
  }

  return (
    <Card variant="outline" padding={4}>
      <Pressable onPress={handleAbrir} accessibilityRole="button" accessibilityLabel={`${cliente.nome}, ${SITUACAO_LABEL[cliente.situacao]}`}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[3] }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{cliente.nome}</Text>
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>
              {cliente.diasSemContato == null
                ? "Nenhuma interação registrada ainda"
                : cliente.diasSemContato === 0
                  ? "Interação registrada hoje"
                  : `${cliente.diasSemContato} dias sem contato`}
              {cliente.totalCompras > 0
                ? ` · ${cliente.totalCompras} compra${cliente.totalCompras > 1 ? "s" : ""}`
                : ""}
              {cliente.valorTotalCompras > 0 ? ` · ${formatMoney(cliente.valorTotalCompras)}` : ""}
            </Text>
          </View>
          <Etiqueta situacao={cliente.situacao} />
        </View>
      </Pressable>

      {aberto ? (
        <View style={{ marginTop: space[4], gap: space[4] }}>
          {cliente.telefone || cliente.email || cliente.empresa ? (
            <Text style={{ ...type.caption, color: color.text.secondary }}>
              {[cliente.empresa, cliente.telefone, cliente.email].filter(Boolean).join(" · ")}
            </Text>
          ) : null}

          <View>
            <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>
              Registrar o que aconteceu
            </Text>
            <Input
              label="Valor da compra (opcional)"
              value={valorCompra}
              onChangeText={setValorCompra}
              keyboardType="decimal-pad"
              placeholder="Ex.: 250"
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
              <Button label="Comprou hoje" variant="primary" size="sm" loading={salvando} onPress={handleRegistrarCompra} />
              <Button
                label="Falei com ele hoje"
                variant="outline"
                size="sm"
                loading={salvando}
                onPress={() => onRegistrar(cliente.id, { tipo: "contato", ocorridaEm: hojeISO() })}
              />
            </View>
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[2] }}>
              O valor é opcional — registrar que a venda aconteceu já vale.
            </Text>
          </View>

          {cliente.situacao === "sumido" || cliente.situacao === "esfriando" ? (
            <View>
              <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>
                O que dizer pra trazer de volta
              </Text>
              {roteiro ? (
                <View style={{ backgroundColor: color.bg.surfaceAlt, borderRadius: radius.md, padding: space[4], gap: space[2] }}>
                  <Text style={{ ...type.body, color: color.text.primary }}>{roteiro.mensagemPronta}</Text>
                  <View style={{ height: 1, backgroundColor: color.border.default, marginVertical: space[1] }} />
                  <LinhaRoteiro rotulo="Abertura" texto={roteiro.abertura} />
                  <LinhaRoteiro rotulo="Motivo do contato" texto={roteiro.motivo} />
                  <LinhaRoteiro rotulo="Convite" texto={roteiro.oferta} />
                  <LinhaRoteiro rotulo="Fechamento" texto={roteiro.fechamento} />
                </View>
              ) : (
                <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[2] }}>
                  Eu escrevo uma mensagem pra você mandar, usando o que já sei do seu negócio e do histórico deste
                  cliente. Você ajusta o que quiser antes de enviar.
                </Text>
              )}
              <Button
                label={gerando ? "Escrevendo..." : roteiro ? "Escrever outra versão" : "Escrever a mensagem"}
                variant={roteiro ? "ghost" : "primary"}
                size="sm"
                loading={gerando}
                onPress={handleGerarRoteiro}
                style={{ alignSelf: "flex-start", marginTop: space[2] }}
              />
            </View>
          ) : null}

          <Button
            label="Remover da carteira"
            variant="ghost"
            size="sm"
            onPress={() => onExcluir(cliente.id)}
            style={{ alignSelf: "flex-start" }}
          />
        </View>
      ) : null}
    </Card>
  );
}

function LinhaRoteiro({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <View>
      <Text style={{ ...type.overline, color: color.text.muted }}>{rotulo.toUpperCase()}</Text>
      <Text style={{ ...type.caption, color: color.text.secondary }}>{texto}</Text>
    </View>
  );
}

/** Situação nunca é só cor (DS-2) — a etiqueta sempre carrega o texto junto. */
function Etiqueta({ situacao }: { situacao: SituacaoCliente }) {
  return (
    <View style={{ backgroundColor: SITUACAO_FUNDO[situacao], borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: 4 }}>
      <Text style={{ ...type.caption, color: SITUACAO_COR[situacao], fontWeight: "700" }}>{SITUACAO_LABEL[situacao]}</Text>
    </View>
  );
}

// ---- Cadastro manual ----

function NovoCliente({
  salvando,
  onSalvar,
}: {
  salvando: boolean;
  onSalvar: (input: { nome: string; telefone?: string; email?: string; empresa?: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  async function handleSalvar() {
    if (!nome.trim()) return;
    await onSalvar({
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
    });
    setNome("");
    setTelefone("");
    setEmail("");
  }

  return (
    <View>
      <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Nome do cliente" />
      <Input label="Telefone (opcional)" value={telefone} onChangeText={setTelefone} placeholder="(00) 00000-0000" />
      <Input label="E-mail (opcional)" value={email} onChangeText={setEmail} placeholder="cliente@email.com" autoCapitalize="none" />
      <Button
        label={salvando ? "Salvando..." : "Adicionar à carteira"}
        variant="primary"
        loading={salvando}
        disabled={!nome.trim()}
        onPress={handleSalvar}
        style={{ alignSelf: "flex-start" }}
      />
    </View>
  );
}
