import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, color, Input, radius, space, type } from "@serdono/ui";
import {
  documentoValido,
  gerarClausulas,
  labelTipoContrato,
  type CamposCompraVenda,
  type CamposContrato,
  type CamposFornecimento,
  type CamposPrestacaoServicos,
  type CamposSociedade,
  type ClausulaContrato,
  type SocioContrato,
  type TipoContrato,
} from "@serdono/core";
import { signOut, type ContratoRow } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";
import { SeletorTipoContrato } from "./SeletorTipoContrato";
import { exportContratoPdf } from "./contratoPdf";
import { type PrefillNegocio, useContrato } from "./useContrato";

/**
 * Tela do Assistente de Contrato (pedido do dono do produto, 17/08/2026).
 * 4 estados: lista (histórico) → formulário (escolhe modelo + preenche
 * dados) → revisão (prévia local, sem chamada de rede) → detalhe (contrato
 * salvo, com export em PDF e envio por e-mail).
 */
export function ContratoScreen() {
  const router = useRouter();
  const v = useContrato();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[
          { label: "← Painel", onPress: () => router.push("/inicio") },
          { label: "Sair", onPress: handleSignOut },
        ]}
      />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Assistente de Contrato</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Escolha um modelo, preencha os dados e baixe o contrato pronto em PDF.
          </Text>
        </View>

        {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

        {v.loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : v.view === "formulario" ? (
          <Formulario prefill={v.prefill} onRevisar={v.revisar} onVoltar={v.voltarParaLista} />
        ) : v.view === "revisao" && v.tipoRevisao && v.camposRevisao ? (
          <Revisao
            tipo={v.tipoRevisao}
            clausulas={v.clausulasRevisao}
            salvando={v.salvando}
            onConfirmar={v.confirmarSalvar}
            onVoltar={v.voltarParaFormulario}
          />
        ) : v.view === "detalhe" && v.contratoSelecionado ? (
          <Detalhe contrato={v.contratoSelecionado} enviando={v.enviando} onEnviar={v.enviarPorEmail} onVoltar={v.voltarParaLista} />
        ) : (
          <Lista contratos={v.contratos} onNovoContrato={v.novoContrato} onAbrirContrato={v.abrirContrato} />
        )}
      </ScrollView>
    </View>
  );
}

function formatarDataRelativa(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function Lista({
  contratos,
  onNovoContrato,
  onAbrirContrato,
}: {
  contratos: ContratoRow[];
  onNovoContrato: () => void;
  onAbrirContrato: (contrato: ContratoRow) => void;
}) {
  return (
    <View style={{ gap: space[4] }}>
      <Button label="Novo contrato" variant="primary" onPress={onNovoContrato} style={{ alignSelf: "flex-start" }} />

      {contratos.length === 0 ? (
        <Card variant="outline" padding={5}>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Você ainda não gerou nenhum contrato. Toque em "Novo contrato" pra criar o primeiro.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: space[3] }}>
          {contratos.map((contrato) => (
            <Pressable key={contrato.id} onPress={() => onAbrirContrato(contrato)} accessibilityRole="button">
              <Card variant="default" padding={5}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>
                      {contrato.titulo}
                    </Text>
                    <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }} numberOfLines={1}>
                      {labelTipoContrato(contrato.tipo as TipoContrato)} · {formatarDataRelativa(contrato.created_at)}
                    </Text>
                    {contrato.enviado_em ? (
                      <Text style={{ ...type.caption, color: color.bg.brand, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                        Enviado para {contrato.enviado_para}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ ...type.body, color: color.text.muted }}>›</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function CampoTexto({
  label,
  value,
  onChangeText,
  placeholder,
  linhas = 1,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  linhas?: number;
}) {
  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.text.muted}
        multiline={linhas > 1}
        numberOfLines={linhas}
        style={{
          ...type.body,
          color: color.text.primary,
          borderWidth: 1,
          borderColor: color.border.default,
          borderRadius: radius.md,
          paddingHorizontal: space[4],
          paddingVertical: space[3],
          minHeight: linhas > 1 ? 22 * linhas + space[3] * 2 : 48,
          textAlignVertical: linhas > 1 ? "top" : "center",
        }}
      />
    </View>
  );
}

function SecaoParte({
  titulo,
  nome,
  onNome,
  documento,
  onDocumento,
  endereco,
  onEndereco,
}: {
  titulo: string;
  nome: string;
  onNome: (v: string) => void;
  documento: string;
  onDocumento: (v: string) => void;
  endereco: string;
  onEndereco: (v: string) => void;
}) {
  return (
    <View>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>{titulo}</Text>
      <Input label="Nome completo / Razão social" value={nome} onChangeText={onNome} placeholder="Ex.: João da Silva" />
      <Input label="CPF ou CNPJ" value={documento} onChangeText={onDocumento} placeholder="Só números ou com pontuação" keyboardType="default" />
      {documento.trim() && !documentoValido(documento) ? (
        <Text style={{ ...type.caption, color: color.state.danger, marginTop: -space[3], marginBottom: space[3] }}>CPF/CNPJ inválido.</Text>
      ) : null}
      <Input label="Endereço" value={endereco} onChangeText={onEndereco} placeholder="Rua, número, bairro, cidade" />
    </View>
  );
}

function SocioListEditor({ socios, onChange }: { socios: SocioContrato[]; onChange: (socios: SocioContrato[]) => void }) {
  function atualizar(i: number, patch: Partial<SocioContrato>) {
    onChange(socios.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function adicionar() {
    onChange([...socios, { nome: "", documento: "", cotaPercentual: 0 }]);
  }

  function remover(i: number) {
    if (socios.length <= 2) return;
    onChange(socios.filter((_, idx) => idx !== i));
  }

  const somaCotas = socios.reduce((acc, s) => acc + (s.cotaPercentual || 0), 0);

  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Sócios</Text>
      {socios.map((s, i) => (
        <Card key={i} variant="outline" padding={4} style={{ marginBottom: space[3] }}>
          <Input label={`Sócio ${i + 1} — nome`} value={s.nome} onChangeText={(v) => atualizar(i, { nome: v })} placeholder="Nome completo" />
          <Input label="CPF ou CNPJ" value={s.documento} onChangeText={(v) => atualizar(i, { documento: v })} placeholder="Só números ou com pontuação" />
          <Input
            label="Cota (%)"
            value={s.cotaPercentual ? String(s.cotaPercentual) : ""}
            onChangeText={(v) => atualizar(i, { cotaPercentual: Number(v.replace(/\D/g, "")) || 0 })}
            placeholder="Ex.: 50"
            keyboardType="numeric"
          />
          {socios.length > 2 ? <Button label="Remover sócio" variant="ghost" size="sm" onPress={() => remover(i)} style={{ alignSelf: "flex-start" }} /> : null}
        </Card>
      ))}
      <Button label="+ Adicionar sócio" variant="outline" size="sm" onPress={adicionar} style={{ alignSelf: "flex-start" }} />
      <Text style={{ ...type.caption, color: somaCotas === 100 ? color.text.muted : color.state.danger, marginTop: space[2] }}>
        Soma das cotas: {somaCotas}% {somaCotas !== 100 ? "(precisa somar 100%)" : ""}
      </Text>
    </View>
  );
}

function Formulario({
  prefill,
  onRevisar,
  onVoltar,
}: {
  prefill: PrefillNegocio | null;
  onRevisar: (tipo: TipoContrato, campos: CamposContrato) => boolean;
  onVoltar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoContrato | null>(null);

  const [contratanteNome, setContratanteNome] = useState(prefill?.nome ?? "");
  const [contratanteDocumento, setContratanteDocumento] = useState(prefill?.documento ?? "");
  const [contratanteEndereco, setContratanteEndereco] = useState("");
  const [contratadaNome, setContratadaNome] = useState("");
  const [contratadaDocumento, setContratadaDocumento] = useState("");
  const [contratadaEndereco, setContratadaEndereco] = useState("");
  const [cidade, setCidade] = useState("");

  const [descricaoServico, setDescricaoServico] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [prazoExecucao, setPrazoExecucao] = useState("");
  const [localPrestacao, setLocalPrestacao] = useState("");
  const [multaPorAtraso, setMultaPorAtraso] = useState(false);

  const [descricaoMercadoria, setDescricaoMercadoria] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [garantia, setGarantia] = useState("");

  const [nomeSociedade, setNomeSociedade] = useState("");
  const [objetoSocial, setObjetoSocial] = useState("");
  const [capitalSocial, setCapitalSocial] = useState("");
  const [administrador, setAdministrador] = useState(prefill?.nome ?? "");
  const [socios, setSocios] = useState<SocioContrato[]>([
    { nome: prefill?.nome ?? "", documento: prefill?.documento ?? "", cotaPercentual: 0 },
    { nome: "", documento: "", cotaPercentual: 0 },
  ]);

  const [descricaoFornecimento, setDescricaoFornecimento] = useState("");
  const [periodicidade, setPeriodicidade] = useState("");
  const [valorPorPeriodo, setValorPorPeriodo] = useState("");
  const [vigenciaMeses, setVigenciaMeses] = useState("");
  const [indiceReajuste, setIndiceReajuste] = useState("");
  const [avisoPrevioCancelamentoDias, setAvisoPrevioCancelamentoDias] = useState("");

  function montarCampos(): CamposContrato | null {
    if (!tipo) return null;
    if (tipo === "sociedade") {
      const campos: CamposSociedade = { nomeSociedade, objetoSocial, capitalSocial, administrador, socios, cidade };
      return campos;
    }
    const comuns = {
      contratante: { nome: contratanteNome, documento: contratanteDocumento, endereco: contratanteEndereco },
      contratada: { nome: contratadaNome, documento: contratadaDocumento, endereco: contratadaEndereco },
      cidade,
    };
    if (tipo === "prestacao_servicos") {
      const campos: CamposPrestacaoServicos = { ...comuns, descricaoServico, valor, formaPagamento, prazoExecucao, localPrestacao, multaPorAtraso };
      return campos;
    }
    if (tipo === "compra_venda") {
      const campos: CamposCompraVenda = {
        ...comuns,
        descricaoMercadoria,
        quantidade,
        valorTotal,
        formaPagamento,
        prazoEntrega,
        garantia: garantia.trim() ? garantia : undefined,
      };
      return campos;
    }
    const campos: CamposFornecimento = {
      ...comuns,
      descricaoFornecimento,
      periodicidade,
      valorPorPeriodo,
      vigenciaMeses,
      indiceReajuste: indiceReajuste.trim() ? indiceReajuste : undefined,
      avisoPrevioCancelamentoDias,
    };
    return campos;
  }

  function handleRevisar() {
    const campos = montarCampos();
    if (!tipo || !campos) return;
    onRevisar(tipo, campos);
  }

  return (
    <View style={{ gap: space[1] }}>
      <Button label="← Voltar" variant="ghost" size="sm" onPress={onVoltar} style={{ alignSelf: "flex-start" }} />

      <SeletorTipoContrato value={tipo} onChange={setTipo} />

      {tipo === "sociedade" ? (
        <>
          <Input label="Nome da sociedade" value={nomeSociedade} onChangeText={setNomeSociedade} placeholder="Ex.: Casa Limpa" />
          <CampoTexto label="Objeto social" value={objetoSocial} onChangeText={setObjetoSocial} placeholder="O que a empresa faz" linhas={2} />
          <Input label="Capital social" value={capitalSocial} onChangeText={setCapitalSocial} placeholder="Ex.: 10000" keyboardType="numeric" />
          <Input label="Administrador(a)" value={administrador} onChangeText={setAdministrador} placeholder="Quem administra a sociedade" />
          <SocioListEditor socios={socios} onChange={setSocios} />
          <Input label="Cidade (foro)" value={cidade} onChangeText={setCidade} placeholder="Ex.: São Paulo" />
        </>
      ) : tipo ? (
        <>
          <SecaoParte
            titulo={tipo === "compra_venda" ? "Vendedor(a) — seus dados" : "Contratante — seus dados"}
            nome={contratanteNome}
            onNome={setContratanteNome}
            documento={contratanteDocumento}
            onDocumento={setContratanteDocumento}
            endereco={contratanteEndereco}
            onEndereco={setContratanteEndereco}
          />
          <SecaoParte
            titulo={tipo === "compra_venda" ? "Comprador(a)" : tipo === "fornecimento_recorrente" ? "Fornecedor(a)" : "Contratado(a)"}
            nome={contratadaNome}
            onNome={setContratadaNome}
            documento={contratadaDocumento}
            onDocumento={setContratadaDocumento}
            endereco={contratadaEndereco}
            onEndereco={setContratadaEndereco}
          />

          {tipo === "prestacao_servicos" ? (
            <>
              <CampoTexto label="Descrição do serviço" value={descricaoServico} onChangeText={setDescricaoServico} linhas={2} />
              <Input label="Valor" value={valor} onChangeText={setValor} placeholder="Ex.: 1500" keyboardType="numeric" />
              <Input label="Forma de pagamento" value={formaPagamento} onChangeText={setFormaPagamento} placeholder="Ex.: PIX em até 5 dias" />
              <Input label="Prazo de execução" value={prazoExecucao} onChangeText={setPrazoExecucao} placeholder="Ex.: 10 dias" />
              <Input label="Local da prestação" value={localPrestacao} onChangeText={setLocalPrestacao} placeholder="Ex.: remoto, ou endereço" />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space[4] }}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>Incluir multa por atraso no pagamento</Text>
                <Switch value={multaPorAtraso} onValueChange={setMultaPorAtraso} />
              </View>
            </>
          ) : null}

          {tipo === "compra_venda" ? (
            <>
              <CampoTexto label="Descrição da mercadoria" value={descricaoMercadoria} onChangeText={setDescricaoMercadoria} linhas={2} />
              <Input label="Quantidade" value={quantidade} onChangeText={setQuantidade} placeholder="Ex.: 10 unidades" />
              <Input label="Valor total" value={valorTotal} onChangeText={setValorTotal} placeholder="Ex.: 500" keyboardType="numeric" />
              <Input label="Forma de pagamento" value={formaPagamento} onChangeText={setFormaPagamento} placeholder="Ex.: à vista" />
              <Input label="Prazo/condição de entrega" value={prazoEntrega} onChangeText={setPrazoEntrega} placeholder="Ex.: 5 dias úteis" />
              <CampoTexto label="Garantia (opcional)" value={garantia} onChangeText={setGarantia} linhas={2} />
            </>
          ) : null}

          {tipo === "fornecimento_recorrente" ? (
            <>
              <CampoTexto label="Descrição do fornecimento" value={descricaoFornecimento} onChangeText={setDescricaoFornecimento} linhas={2} />
              <Input label="Periodicidade" value={periodicidade} onChangeText={setPeriodicidade} placeholder="Ex.: mensal" />
              <Input label="Valor por período" value={valorPorPeriodo} onChangeText={setValorPorPeriodo} placeholder="Ex.: 800" keyboardType="numeric" />
              <Input label="Vigência (meses)" value={vigenciaMeses} onChangeText={setVigenciaMeses} placeholder="Ex.: 12" keyboardType="numeric" />
              <Input label="Índice de reajuste (opcional)" value={indiceReajuste} onChangeText={setIndiceReajuste} placeholder="Ex.: IPCA" />
              <Input
                label="Aviso prévio de cancelamento (dias)"
                value={avisoPrevioCancelamentoDias}
                onChangeText={setAvisoPrevioCancelamentoDias}
                placeholder="Ex.: 30"
                keyboardType="numeric"
              />
            </>
          ) : null}

          <Input label="Cidade (foro)" value={cidade} onChangeText={setCidade} placeholder="Ex.: São Paulo" />
        </>
      ) : null}

      {tipo ? <Button label="Revisar contrato" variant="primary" fullWidth onPress={handleRevisar} /> : null}
    </View>
  );
}

function Revisao({
  tipo,
  clausulas,
  salvando,
  onConfirmar,
  onVoltar,
}: {
  tipo: TipoContrato;
  clausulas: ClausulaContrato[];
  salvando: boolean;
  onConfirmar: () => Promise<boolean>;
  onVoltar: () => void;
}) {
  return (
    <View style={{ gap: space[4] }}>
      <Button label="← Voltar e editar" variant="ghost" size="sm" onPress={onVoltar} style={{ alignSelf: "flex-start" }} />
      <Text style={{ ...type.h2, color: color.text.primary }}>{labelTipoContrato(tipo)} — revisão</Text>
      <Text style={{ ...type.caption, color: color.text.muted }}>Confira o texto antes de salvar. Nenhum dado foi enviado ainda.</Text>

      {clausulas.map((c, i) => (
        <Card key={i} variant="outline" padding={4}>
          <Text style={{ ...type.bodyStrong, color: color.bg.brand, marginBottom: space[1] }}>{c.titulo}</Text>
          {c.paragrafos.map((p, j) => (
            <Text key={j} style={{ ...type.body, color: color.text.secondary, marginBottom: space[1] }}>
              {p}
            </Text>
          ))}
        </Card>
      ))}

      <Button label="Confirmar e salvar contrato" variant="primary" fullWidth loading={salvando} onPress={onConfirmar} />
    </View>
  );
}

function Detalhe({
  contrato,
  enviando,
  onEnviar,
  onVoltar,
}: {
  contrato: ContratoRow;
  enviando: boolean;
  onEnviar: (contratoId: string, email: string) => Promise<boolean>;
  onVoltar: () => void;
}) {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const clausulas = gerarClausulas(contrato.tipo as TipoContrato, contrato.campos as unknown as CamposContrato);

  async function handleEnviar() {
    setEnviado(false);
    const ok = await onEnviar(contrato.id, email);
    if (ok) setEnviado(true);
  }

  return (
    <View style={{ gap: space[4] }}>
      <Button label="← Voltar à lista" variant="ghost" size="sm" onPress={onVoltar} style={{ alignSelf: "flex-start" }} />
      <Text style={{ ...type.h2, color: color.text.primary }}>{contrato.titulo}</Text>
      <Text style={{ ...type.caption, color: color.text.muted }}>{labelTipoContrato(contrato.tipo as TipoContrato)}</Text>

      <View style={{ flexDirection: "row", gap: space[3] }}>
        <Button
          label="Baixar PDF"
          variant="primary"
          onPress={() => exportContratoPdf(contrato.titulo, contrato.tipo as TipoContrato, contrato.campos as never)}
        />
      </View>

      <Card variant="outline" padding={4}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Enviar por e-mail</Text>
        <Input label="E-mail do destinatário" value={email} onChangeText={setEmail} placeholder="nome@exemplo.com" keyboardType="email-address" autoCapitalize="none" />
        <Button label="Enviar contrato por e-mail" variant="outline" loading={enviando} disabled={!email.trim()} onPress={handleEnviar} />
        {enviado ? <Text style={{ ...type.caption, color: color.bg.brand, marginTop: space[2] }}>Enviado!</Text> : null}
        {contrato.enviado_em ? (
          <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[2] }}>
            Último envio: {contrato.enviado_para} em {formatarDataRelativa(contrato.enviado_em)}
          </Text>
        ) : null}
      </Card>

      {clausulas.map((c: ClausulaContrato, i: number) => (
        <Card key={i} variant="outline" padding={4}>
          <Text style={{ ...type.bodyStrong, color: color.bg.brand, marginBottom: space[1] }}>{c.titulo}</Text>
          {c.paragrafos.map((p, j) => (
            <Text key={j} style={{ ...type.body, color: color.text.secondary, marginBottom: space[1] }}>
              {p}
            </Text>
          ))}
        </Card>
      ))}
    </View>
  );
}
