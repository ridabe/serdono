import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Card, ConfirmModal, CurrencyInput, Input, Logo, color, radius, space, type } from "@serdono/ui";
import { uploadAbacatePayProdutoImagem } from "@serdono/supabase";
import {
  EVENTOS_WEBHOOK_DISPONIVEIS,
  alternarCupomAbacatePay,
  apagarClienteAbacatePay,
  apagarCupomAbacatePay,
  apagarProdutoAbacatePay,
  apagarWebhookAbacatePay,
  criarCupomAbacatePay,
  criarPayoutAbacatePay,
  criarPixAbacatePay,
  criarProdutoAbacatePay,
  criarWebhookAbacatePay,
  listarAssinaturasAbacatePay,
  listarClientesAbacatePay,
  listarCuponsAbacatePay,
  listarPayoutsAbacatePay,
  listarPixAbacatePay,
  listarProdutosAbacatePay,
  listarWebhooksAbacatePay,
  type AbacatePayCliente,
  type AbacatePayCupom,
  type AbacatePayPayout,
  type AbacatePayPix,
  type AbacatePayProduto,
  type AbacatePaySubscriptionCheckout,
  type AbacatePayWebhook,
} from "@serdono/supabase";
import { usePaginatedAbacatePay } from "./usePaginatedAbacatePay";

function formatMoney(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;
}

function formatData(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type AbaId = "produtos" | "webhooks" | "clientes" | "cupons" | "assinaturas" | "saques" | "pix";

const ABAS: { id: AbaId; label: string }[] = [
  { id: "produtos", label: "Produtos" },
  { id: "webhooks", label: "Webhooks" },
  { id: "clientes", label: "Clientes" },
  { id: "cupons", label: "Cupons" },
  { id: "assinaturas", label: "Assinaturas" },
  { id: "saques", label: "Saques" },
  { id: "pix", label: "PIX" },
];

/**
 * Painel Admin AbacatePay (pedido do dono do produto, 18/08/2026) — concentra
 * as ações que hoje só davam pra fazer no painel deles: catálogo (produtos,
 * cupons), infraestrutura (webhooks), auditoria (clientes, assinaturas) e
 * movimentação financeira (saques, PIX). Tudo passa por UMA Edge Function
 * proxy (`admin-abacatepay-proxy`) que nunca expõe `ABACATEPAY_API_KEY` pro
 * client e valida cada endpoint contra um allowlist fechado.
 *
 * `Saques`/`PIX` MOVEM DINHEIRO DE VERDADE — cada criação passa por um
 * `ConfirmModal` explícito com o valor por extenso antes de chamar a API, e a
 * Edge Function exige `confirm: true` de novo no corpo (defesa em
 * profundidade, não só UI).
 */
export function AdminAbacatePayScreen() {
  const router = useRouter();
  const [aba, setAba] = useState<AbaId>("produtos");

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: space[3],
          borderBottomWidth: 1,
          borderBottomColor: color.border.default,
          backgroundColor: color.bg.surface,
        }}
      >
        <Logo size={28} />
        <Pressable onPress={() => router.push("/admin")} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Painel</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space[5], paddingTop: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>AbacatePay</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Produtos, webhooks, clientes, cupons, assinaturas e movimentação financeira — direto na conta da AbacatePay.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2], paddingBottom: space[4] }}>
          {ABAS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAba(a.id)}
              accessibilityRole="button"
              style={{
                paddingHorizontal: space[4],
                paddingVertical: space[2],
                borderRadius: 999,
                backgroundColor: aba === a.id ? color.bg.brand : color.bg.surfaceAlt,
              }}
            >
              <Text style={{ ...type.bodyStrong, color: aba === a.id ? color.text.onBrand : color.text.secondary }}>{a.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5], paddingTop: 0 }}>
        {aba === "produtos" ? <ProdutosTab /> : null}
        {aba === "webhooks" ? <WebhooksTab /> : null}
        {aba === "clientes" ? <ClientesTab /> : null}
        {aba === "cupons" ? <CuponsTab /> : null}
        {aba === "assinaturas" ? <AssinaturasTab /> : null}
        {aba === "saques" ? <SaquesTab /> : null}
        {aba === "pix" ? <PixTab /> : null}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Tabela genérica + paginação — reaproveitada pelas 7 abas.
// ============================================================================
interface Coluna<T> {
  label: string;
  minWidth: number;
  render: (row: T) => React.ReactNode;
}

function AbacaTable<T extends { id: string }>({
  colunas,
  linhas,
  loading,
  error,
  vazio,
  acoes,
}: {
  colunas: Coluna<T>[];
  linhas: T[];
  loading: boolean;
  error: string | null;
  vazio: string;
  acoes?: (row: T) => React.ReactNode;
}) {
  if (loading && linhas.length === 0) return <ActivityIndicator color={color.bg.brand} style={{ marginVertical: space[5] }} />;
  if (error) return <Text style={{ ...type.caption, color: color.state.danger, marginVertical: space[3] }}>{error}</Text>;
  if (linhas.length === 0) {
    return (
      <Card variant="outline" padding={5}>
        <Text style={{ ...type.body, color: color.text.secondary }}>{vazio}</Text>
      </Card>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
      <View style={{ width: "100%", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: color.border.default }}>
        <View style={{ flexDirection: "row", backgroundColor: color.bg.surfaceAlt, borderBottomWidth: 1, borderBottomColor: color.border.default }}>
          {colunas.map((c) => (
            <View key={c.label} style={{ minWidth: c.minWidth, flex: 1, paddingHorizontal: space[3], paddingVertical: space[3] }}>
              <Text style={{ ...type.overline, color: color.text.muted }}>{c.label}</Text>
            </View>
          ))}
          {acoes ? (
            <View style={{ width: 200, paddingHorizontal: space[3], paddingVertical: space[3] }}>
              <Text style={{ ...type.overline, color: color.text.muted }}>Ações</Text>
            </View>
          ) : null}
        </View>
        {linhas.map((row, i) => (
          <View
            key={row.id}
            style={{
              flexDirection: "row",
              backgroundColor: i % 2 === 1 ? color.bg.surfaceAlt : color.bg.surface,
              borderBottomWidth: 1,
              borderBottomColor: color.border.default,
            }}
          >
            {colunas.map((c) => (
              <View key={c.label} style={{ minWidth: c.minWidth, flex: 1, paddingHorizontal: space[3], paddingVertical: space[3], justifyContent: "center" }}>
                {c.render(row)}
              </View>
            ))}
            {acoes ? (
              <View style={{ width: 200, paddingHorizontal: space[3], paddingVertical: space[2], justifyContent: "center" }}>{acoes(row)}</View>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Paginacao({
  pageNumber,
  hasPrev,
  hasNext,
  loading,
  onPrev,
  onNext,
}: {
  pageNumber: number;
  hasPrev: boolean;
  hasNext: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space[3], marginTop: space[3] }}>
      <Button label="← Anterior" variant="soft" size="sm" disabled={!hasPrev || loading} onPress={onPrev} />
      <Text style={{ ...type.caption, color: color.text.muted }}>Página {pageNumber}</Text>
      <Button label="Próxima →" variant="soft" size="sm" disabled={!hasNext || loading} loading={loading && hasNext} onPress={onNext} />
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: "info" | "danger" | "warning" | "success" }) {
  const tones = {
    info: { bg: color.state.infoBg, fg: color.state.info },
    danger: { bg: color.state.dangerBg, fg: color.state.danger },
    warning: { bg: color.state.warningBg, fg: color.state.warning },
    success: { bg: color.state.successBg, fg: color.state.success },
  }[tone];
  return (
    <View style={{ backgroundColor: tones.bg, borderRadius: 999, paddingHorizontal: space[2], paddingVertical: 2, alignSelf: "flex-start" }}>
      <Text style={{ ...type.caption, color: tones.fg, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function TabHeader({ titulo, acao }: { titulo: string; acao?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space[3] }}>
      <Text style={{ ...type.h3, color: color.text.primary }}>{titulo}</Text>
      {acao}
    </View>
  );
}

// ============================================================================
// Produtos
// ============================================================================
function ProdutosTab() {
  const { items, loading, error, pageNumber, hasNext, hasPrev, proxima, anterior, refresh } = usePaginatedAbacatePay(listarProdutosAbacatePay, 10);
  const [criando, setCriando] = useState(false);
  const [apagando, setApagando] = useState<AbacatePayProduto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <View>
      <TabHeader titulo="Produtos" acao={<Button label="+ Novo produto" variant="primary" size="sm" onPress={() => setCriando(true)} />} />
      {actionError ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[2] }}>{actionError}</Text> : null}

      <AbacaTable<AbacatePayProduto>
        loading={loading}
        error={error}
        vazio="Nenhum produto cadastrado."
        linhas={items}
        colunas={[
          {
            label: "Capa",
            minWidth: 60,
            render: (r) =>
              r.imageUrl ? (
                <Image source={{ uri: r.imageUrl }} style={{ width: 40, height: 40, borderRadius: radius.md }} />
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: color.bg.surfaceAlt }} />
              ),
          },
          { label: "Nome", minWidth: 160, render: (r) => <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>{r.name}</Text> },
          { label: "Preço", minWidth: 100, render: (r) => <Text style={{ ...type.body, color: color.text.secondary }}>{formatMoney(r.price)}</Text> },
          { label: "Ciclo", minWidth: 100, render: (r) => <Text style={{ ...type.body, color: color.text.secondary }}>{r.cycle ?? "avulso"}</Text> },
          { label: "Status", minWidth: 100, render: (r) => <Badge label={r.status} tone={r.status === "ACTIVE" ? "success" : "warning"} /> },
          { label: "Criado em", minWidth: 100, render: (r) => <Text style={{ ...type.caption, color: color.text.muted }}>{formatData(r.createdAt)}</Text> },
        ]}
        acoes={(r) => (
          <Button label="Apagar" variant="danger" size="sm" disabled={r.status !== "ACTIVE"} onPress={() => setApagando(r)} />
        )}
      />
      <Paginacao pageNumber={pageNumber} hasPrev={hasPrev} hasNext={hasNext} loading={loading} onPrev={anterior} onNext={proxima} />

      {criando ? (
        <NovoProdutoModal
          onCancel={() => setCriando(false)}
          onCriado={() => {
            setCriando(false);
            refresh();
          }}
        />
      ) : null}

      <ConfirmModal
        visible={!!apagando}
        title="Apagar produto"
        message={apagando ? `Arquiva "${apagando.name}" na AbacatePay. Não afeta quem já assina — só impede novas assinaturas nesse produto.` : ""}
        confirmLabel="Apagar"
        onCancel={() => setApagando(null)}
        onConfirm={async () => {
          if (!apagando) return;
          setActionError(null);
          try {
            await apagarProdutoAbacatePay(apagando.id);
            setApagando(null);
            refresh();
          } catch (e) {
            setActionError((e as Error).message);
          }
        }}
      />
    </View>
  );
}

function NovoProdutoModal({ onCancel, onCriado }: { onCancel: () => void; onCriado: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [precoCentavos, setPrecoCentavos] = useState(0);
  const [cycle, setCycle] = useState<"" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "ANNUALLY">("MONTHLY");
  const [capaUri, setCapaUri] = useState<string | null>(null);
  const [enviandoCapa, setEnviandoCapa] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolherCapa() {
    setErro(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErro("Precisamos de permissão para acessar suas fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    // Mesmo padrão de logo de parceiro (AdminFornecedoresScreen) — quadrado,
    // JPEG, compressão leve.
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    setCapaUri(manipulated.uri);
  }

  async function salvar() {
    if (!name.trim() || precoCentavos <= 0) {
      setErro("Nome e preço são obrigatórios.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const externalId = `serdono-${Date.now()}`;
      let imageUrl: string | undefined;
      if (capaUri) {
        setEnviandoCapa(true);
        // Sobe primeiro pro Storage do Ser Dono — a API da AbacatePay só
        // aceita `imageUrl` (URL pública), sem upload de arquivo de verdade.
        imageUrl = await uploadAbacatePayProdutoImagem(externalId, capaUri);
        setEnviandoCapa(false);
      }
      await criarProdutoAbacatePay({
        externalId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: precoCentavos,
        cycle: cycle || undefined,
        imageUrl,
      });
      onCriado();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
      setEnviandoCapa(false);
    }
  }

  return (
    <ModalBase titulo="Novo produto" onCancel={onCancel}>
      <Input label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Essencial" />
      <Input label="Descrição (opcional)" value={description} onChangeText={setDescription} placeholder="Ex.: Plano Essencial" />
      <CurrencyInput label="Preço" valueCentavos={precoCentavos} onChangeCentavos={setPrecoCentavos} />

      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Capa (opcional)</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space[3], marginBottom: space[4] }}>
        {capaUri ? (
          <Image source={{ uri: capaUri }} style={{ width: 64, height: 64, borderRadius: radius.md }} />
        ) : (
          <View style={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: color.bg.surfaceAlt }} />
        )}
        <Button label={capaUri ? "Trocar imagem" : "Escolher imagem"} variant="soft" size="sm" onPress={escolherCapa} />
      </View>
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Ciclo de cobrança</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[4] }}>
        {(["", "WEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUALLY", "ANNUALLY"] as const).map((c) => (
          <Pressable
            key={c || "avulso"}
            onPress={() => setCycle(c)}
            style={{
              paddingHorizontal: space[3],
              paddingVertical: space[2],
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: cycle === c ? color.border.focus : color.border.default,
              backgroundColor: cycle === c ? color.bg.brand : "transparent",
            }}
          >
            <Text style={{ ...type.caption, color: cycle === c ? color.text.onBrand : color.text.primary, fontWeight: "600" }}>
              {c || "Avulso (sem recorrência)"}
            </Text>
          </Pressable>
        ))}
      </View>
      {erro ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{erro}</Text> : null}
      <View style={{ flexDirection: "row", gap: space[3], justifyContent: "flex-end" }}>
        <Button label="Cancelar" variant="ghost" onPress={onCancel} />
        <Button label="Criar" variant="primary" loading={salvando} onPress={salvar} />
      </View>
    </ModalBase>
  );
}

// ============================================================================
// Webhooks
// ============================================================================
function WebhooksTab() {
  const { items, loading, error, pageNumber, hasNext, hasPrev, proxima, anterior, refresh } = usePaginatedAbacatePay(listarWebhooksAbacatePay, 10);
  const [criando, setCriando] = useState(false);
  const [apagando, setApagando] = useState<AbacatePayWebhook | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <View>
      <TabHeader titulo="Webhooks" acao={<Button label="+ Novo webhook" variant="primary" size="sm" onPress={() => setCriando(true)} />} />
      {actionError ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[2] }}>{actionError}</Text> : null}

      <AbacaTable<AbacatePayWebhook>
        loading={loading}
        error={error}
        vazio="Nenhum webhook cadastrado."
        linhas={items}
        colunas={[
          { label: "Nome", minWidth: 160, render: (r) => <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>{r.name}</Text> },
          { label: "Endpoint", minWidth: 280, render: (r) => <Text style={{ ...type.caption, color: color.text.secondary }} numberOfLines={1}>{r.endpoint}</Text> },
          { label: "Eventos", minWidth: 200, render: (r) => <Text style={{ ...type.caption, color: color.text.secondary }} numberOfLines={2}>{r.events.join(", ")}</Text> },
          { label: "Criado em", minWidth: 100, render: (r) => <Text style={{ ...type.caption, color: color.text.muted }}>{formatData(r.createdAt)}</Text> },
        ]}
        acoes={(r) => <Button label="Apagar" variant="danger" size="sm" onPress={() => setApagando(r)} />}
      />
      <Paginacao pageNumber={pageNumber} hasPrev={hasPrev} hasNext={hasNext} loading={loading} onPrev={anterior} onNext={proxima} />

      {criando ? (
        <NovoWebhookModal
          onCancel={() => setCriando(false)}
          onCriado={() => {
            setCriando(false);
            refresh();
          }}
        />
      ) : null}

      <ConfirmModal
        visible={!!apagando}
        title="Apagar webhook"
        message={apagando ? `Apaga "${apagando.name}" — a AbacatePay para de avisar esse endpoint sobre qualquer evento. Se for o webhook de assinaturas em produção, novas confirmações de pagamento param de chegar.` : ""}
        confirmLabel="Apagar"
        onCancel={() => setApagando(null)}
        onConfirm={async () => {
          if (!apagando) return;
          setActionError(null);
          try {
            await apagarWebhookAbacatePay(apagando.id);
            setApagando(null);
            refresh();
          } catch (e) {
            setActionError((e as Error).message);
          }
        }}
      />
    </View>
  );
}

function NovoWebhookModal({ onCancel, onCriado }: { onCancel: () => void; onCriado: () => void }) {
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<string[]>(["subscription.completed", "subscription.renewed", "subscription.cancelled"]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternar(evento: string) {
    setEvents((prev) => (prev.includes(evento) ? prev.filter((e) => e !== evento) : [...prev, evento]));
  }

  async function salvar() {
    if (!name.trim() || !endpoint.trim() || !secret.trim() || events.length === 0) {
      setErro("Nome, endpoint, secret e ao menos 1 evento são obrigatórios.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await criarWebhookAbacatePay({ name: name.trim(), endpoint: endpoint.trim(), secret: secret.trim(), events });
      onCriado();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalBase titulo="Novo webhook" onCancel={onCancel}>
      <Input label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Ser Dono - Assinaturas" />
      <Input label="Endpoint (URL completa)" value={endpoint} onChangeText={setEndpoint} placeholder="https://..." autoCapitalize="none" />
      <Input label="Secret" value={secret} onChangeText={setSecret} placeholder="Mesmo valor de ABACATEPAY_WEBHOOK_SECRET" autoCapitalize="none" />
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Eventos</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[4] }}>
        {EVENTOS_WEBHOOK_DISPONIVEIS.map((ev) => (
          <Pressable
            key={ev}
            onPress={() => alternar(ev)}
            style={{
              paddingHorizontal: space[3],
              paddingVertical: space[2],
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: events.includes(ev) ? color.border.focus : color.border.default,
              backgroundColor: events.includes(ev) ? color.bg.brand : "transparent",
            }}
          >
            <Text style={{ ...type.caption, color: events.includes(ev) ? color.text.onBrand : color.text.primary, fontWeight: "600" }}>{ev}</Text>
          </Pressable>
        ))}
      </View>
      {erro ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{erro}</Text> : null}
      <View style={{ flexDirection: "row", gap: space[3], justifyContent: "flex-end" }}>
        <Button label="Cancelar" variant="ghost" onPress={onCancel} />
        <Button label="Criar" variant="primary" loading={salvando} onPress={salvar} />
      </View>
    </ModalBase>
  );
}

// ============================================================================
// Clientes
// ============================================================================
function ClientesTab() {
  const { items, loading, error, pageNumber, hasNext, hasPrev, proxima, anterior, refresh } = usePaginatedAbacatePay(listarClientesAbacatePay, 15);
  const [apagando, setApagando] = useState<AbacatePayCliente | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <View>
      <TabHeader titulo="Clientes" />
      {actionError ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[2] }}>{actionError}</Text> : null}

      <AbacaTable<AbacatePayCliente>
        loading={loading}
        error={error}
        vazio="Nenhum cliente cadastrado."
        linhas={items}
        colunas={[
          { label: "Nome", minWidth: 160, render: (r) => <Text style={{ ...type.bodyStrong, color: color.text.primary }} numberOfLines={1}>{r.name || "(sem nome)"}</Text> },
          { label: "E-mail", minWidth: 200, render: (r) => <Text style={{ ...type.body, color: color.text.secondary }} numberOfLines={1}>{r.email}</Text> },
          { label: "CPF/CNPJ", minWidth: 140, render: (r) => <Text style={{ ...type.caption, color: color.text.muted }}>{r.taxId ?? "—"}</Text> },
        ]}
        acoes={(r) => <Button label="Apagar" variant="danger" size="sm" onPress={() => setApagando(r)} />}
      />
      <Paginacao pageNumber={pageNumber} hasPrev={hasPrev} hasNext={hasNext} loading={loading} onPrev={anterior} onNext={proxima} />

      <ConfirmModal
        visible={!!apagando}
        title="Apagar cliente"
        message={apagando ? `Remove o cadastro de ${apagando.name || apagando.email} da AbacatePay. Assinaturas já criadas não somem, mas um novo checkout pra essa pessoa criaria um cliente novo.` : ""}
        confirmLabel="Apagar"
        onCancel={() => setApagando(null)}
        onConfirm={async () => {
          if (!apagando) return;
          setActionError(null);
          try {
            await apagarClienteAbacatePay(apagando.id);
            setApagando(null);
            refresh();
          } catch (e) {
            setActionError((e as Error).message);
          }
        }}
      />
    </View>
  );
}

// ============================================================================
// Cupons
// ============================================================================
function CuponsTab() {
  const { items, loading, error, pageNumber, hasNext, hasPrev, proxima, anterior, refresh } = usePaginatedAbacatePay(listarCuponsAbacatePay, 10);
  const [criando, setCriando] = useState(false);
  const [apagando, setApagando] = useState<AbacatePayCupom | null>(null);
  const [alternando, setAlternando] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function alternar(cupom: AbacatePayCupom) {
    setAlternando(cupom.id);
    setActionError(null);
    try {
      await alternarCupomAbacatePay(cupom.id);
      refresh();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setAlternando(null);
    }
  }

  return (
    <View>
      <TabHeader titulo="Cupons" acao={<Button label="+ Novo cupom" variant="primary" size="sm" onPress={() => setCriando(true)} />} />
      {actionError ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[2] }}>{actionError}</Text> : null}

      <AbacaTable<AbacatePayCupom>
        loading={loading}
        error={error}
        vazio="Nenhum cupom cadastrado."
        linhas={items}
        colunas={[
          { label: "Código", minWidth: 120, render: (r) => <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{r.id}</Text> },
          { label: "Desconto", minWidth: 100, render: (r) => <Text style={{ ...type.body, color: color.text.secondary }}>{r.discountKind === "PERCENTAGE" ? `${r.discount}%` : formatMoney(r.discount)}</Text> },
          { label: "Usos", minWidth: 100, render: (r) => <Text style={{ ...type.body, color: color.text.secondary }}>{r.redeemsCount}{r.maxRedeems > 0 ? ` / ${r.maxRedeems}` : " (ilimitado)"}</Text> },
          { label: "Status", minWidth: 100, render: (r) => <Badge label={r.status} tone={r.status === "ACTIVE" ? "success" : "warning"} /> },
        ]}
        acoes={(r) => (
          <View style={{ flexDirection: "row", gap: space[2] }}>
            <Button
              label={r.status === "ACTIVE" ? "Desativar" : "Ativar"}
              variant="soft"
              size="sm"
              loading={alternando === r.id}
              onPress={() => alternar(r)}
            />
            <Button label="Apagar" variant="danger" size="sm" onPress={() => setApagando(r)} />
          </View>
        )}
      />
      <Paginacao pageNumber={pageNumber} hasPrev={hasPrev} hasNext={hasNext} loading={loading} onPrev={anterior} onNext={proxima} />

      {criando ? (
        <NovoCupomModal
          onCancel={() => setCriando(false)}
          onCriado={() => {
            setCriando(false);
            refresh();
          }}
        />
      ) : null}

      <ConfirmModal
        visible={!!apagando}
        title="Apagar cupom"
        message={apagando ? `Apaga o cupom "${apagando.id}" — ninguém mais consegue usar esse código.` : ""}
        confirmLabel="Apagar"
        onCancel={() => setApagando(null)}
        onConfirm={async () => {
          if (!apagando) return;
          setActionError(null);
          try {
            await apagarCupomAbacatePay(apagando.id);
            setApagando(null);
            refresh();
          } catch (e) {
            setActionError((e as Error).message);
          }
        }}
      />
    </View>
  );
}

function NovoCupomModal({ onCancel, onCriado }: { onCancel: () => void; onCriado: () => void }) {
  const [code, setCode] = useState("");
  const [tipo, setTipo] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [percentual, setPercentual] = useState("");
  const [descontoCentavos, setDescontoCentavos] = useState(0);
  const [notes, setNotes] = useState("");
  const [maxRedeems, setMaxRedeems] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const numPercentual = parseFloat(percentual.replace(",", "."));

  async function salvar() {
    const valorInvalido = tipo === "PERCENTAGE" ? !numPercentual || numPercentual <= 0 : descontoCentavos <= 0;
    if (!code.trim() || valorInvalido) {
      setErro("Código e valor do desconto são obrigatórios.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await criarCupomAbacatePay({
        code: code.trim(),
        discountKind: tipo,
        // PERCENTAGE: número puro (10 = 10%, doc oficial). FIXED: centavos,
        // mesma unidade do resto da API (2000 = R$ 20,00).
        discount: tipo === "PERCENTAGE" ? Math.round(numPercentual) : descontoCentavos,
        notes: notes.trim() || undefined,
        // A doc diz que `maxRedeems` é opcional (default -1 = ilimitado), mas
        // a API real rejeita a criação sem o campo ("Property 'maxRedeems' is
        // missing", achado testando) — sempre manda, -1 quando o campo fica
        // vazio.
        maxRedeems: maxRedeems.trim() ? parseInt(maxRedeems, 10) : -1,
      });
      onCriado();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalBase titulo="Novo cupom" onCancel={onCancel}>
      <Input label="Código" value={code} onChangeText={setCode} placeholder="Ex.: BEMVINDO10" autoCapitalize="none" />
      <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Tipo de desconto</Text>
      <View style={{ flexDirection: "row", gap: space[2], marginBottom: space[4] }}>
        {(["PERCENTAGE", "FIXED"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTipo(t)}
            style={{
              flex: 1,
              paddingVertical: space[3],
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: tipo === t ? color.border.focus : color.border.default,
              backgroundColor: tipo === t ? color.bg.brand : "transparent",
              alignItems: "center",
            }}
          >
            <Text style={{ ...type.bodyStrong, color: tipo === t ? color.text.onBrand : color.text.primary }}>{t === "PERCENTAGE" ? "Percentual" : "Valor fixo"}</Text>
          </Pressable>
        ))}
      </View>
      {tipo === "PERCENTAGE" ? (
        <Input label="Desconto (%)" value={percentual} onChangeText={setPercentual} placeholder="10" keyboardType="decimal-pad" />
      ) : (
        <CurrencyInput label="Desconto" valueCentavos={descontoCentavos} onChangeCentavos={setDescontoCentavos} />
      )}
      <Input label="Notas (opcional)" value={notes} onChangeText={setNotes} placeholder="Ex.: campanha de lançamento" />
      <Input label="Limite de usos (opcional, vazio = ilimitado)" value={maxRedeems} onChangeText={setMaxRedeems} placeholder="Ex.: 50" keyboardType="numeric" />
      {erro ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{erro}</Text> : null}
      <View style={{ flexDirection: "row", gap: space[3], justifyContent: "flex-end" }}>
        <Button label="Cancelar" variant="ghost" onPress={onCancel} />
        <Button label="Criar" variant="primary" loading={salvando} onPress={salvar} />
      </View>
    </ModalBase>
  );
}

// ============================================================================
// Assinaturas (leitura — cruzamento de auditoria com `/admin/assinaturas`,
// que é a fonte de verdade do produto; aqui é a visão crua direto na
// AbacatePay, sem escrita).
// ============================================================================
function AssinaturasTab() {
  const { items, loading, error, pageNumber, hasNext, hasPrev, proxima, anterior } = usePaginatedAbacatePay(listarAssinaturasAbacatePay, 15);

  return (
    <View>
      <TabHeader titulo="Assinaturas na AbacatePay" />
      <Text style={{ ...type.caption, color: color.text.muted, marginBottom: space[3] }}>
        Visão crua direto na AbacatePay, só leitura. Pra gerenciar plano de usuário, use{" "}
        <Text style={{ fontWeight: "700" }}>Assinaturas</Text> no Painel Admin.
      </Text>

      <AbacaTable<AbacatePaySubscriptionCheckout>
        loading={loading}
        error={error}
        vazio="Nenhuma assinatura encontrada."
        linhas={items}
        colunas={[
          { label: "ID externo", minWidth: 160, render: (r) => <Text style={{ ...type.caption, color: color.text.secondary }} numberOfLines={1}>{r.externalId}</Text> },
          { label: "Status", minWidth: 100, render: (r) => <Badge label={r.status} tone={r.status === "PAID" ? "success" : r.status === "EXPIRED" ? "danger" : "info"} /> },
          { label: "Valor", minWidth: 100, render: (r) => <Text style={{ ...type.body, color: color.text.secondary }}>{formatMoney(r.amount)}</Text> },
          { label: "Pago", minWidth: 100, render: (r) => <Text style={{ ...type.body, color: color.text.secondary }}>{formatMoney(r.paidAmount)}</Text> },
          { label: "Criado em", minWidth: 100, render: (r) => <Text style={{ ...type.caption, color: color.text.muted }}>{formatData(r.createdAt)}</Text> },
        ]}
      />
      <Paginacao pageNumber={pageNumber} hasPrev={hasPrev} hasNext={hasNext} loading={loading} onPrev={anterior} onNext={proxima} />
    </View>
  );
}

// ============================================================================
// Saques — MOVE DINHEIRO DE VERDADE
// ============================================================================
function SaquesTab() {
  const { items, loading, error, pageNumber, hasNext, hasPrev, proxima, anterior, refresh } = usePaginatedAbacatePay(listarPayoutsAbacatePay, 10);
  const [criando, setCriando] = useState(false);

  return (
    <View>
      <Card variant="outline" padding={4} style={{ marginBottom: space[4], borderColor: color.state.warning }}>
        <Text style={{ ...type.bodyStrong, color: color.state.warning }}>⚠ Isso move dinheiro de verdade</Text>
        <Text style={{ ...type.caption, color: color.text.secondary, marginTop: 2 }}>
          Um saque transfere da conta AbacatePay pro banco cadastrado. Sem volta.
        </Text>
      </Card>

      <TabHeader titulo="Saques" acao={<Button label="+ Novo saque" variant="primary" size="sm" onPress={() => setCriando(true)} />} />

      <AbacaTable<AbacatePayPayout>
        loading={loading}
        error={error}
        vazio="Nenhum saque realizado ainda."
        linhas={items}
        colunas={[
          { label: "ID externo", minWidth: 160, render: (r) => <Text style={{ ...type.caption, color: color.text.secondary }} numberOfLines={1}>{r.externalId}</Text> },
          { label: "Valor", minWidth: 100, render: (r) => <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{formatMoney(r.amount)}</Text> },
          { label: "Taxa", minWidth: 90, render: (r) => <Text style={{ ...type.caption, color: color.text.muted }}>{formatMoney(r.platformFee)}</Text> },
          { label: "Status", minWidth: 100, render: (r) => <Badge label={r.status} tone={r.status === "COMPLETE" ? "success" : r.status === "CANCELLED" ? "danger" : "info"} /> },
          { label: "Criado em", minWidth: 100, render: (r) => <Text style={{ ...type.caption, color: color.text.muted }}>{formatData(r.createdAt)}</Text> },
        ]}
      />
      <Paginacao pageNumber={pageNumber} hasPrev={hasPrev} hasNext={hasNext} loading={loading} onPrev={anterior} onNext={proxima} />

      {criando ? (
        <NovoSaqueModal
          onCancel={() => setCriando(false)}
          onCriado={() => {
            setCriando(false);
            refresh();
          }}
        />
      ) : null}
    </View>
  );
}

function NovoSaqueModal({ onCancel, onCriado }: { onCancel: () => void; onCriado: () => void }) {
  const [centavos, setCentavos] = useState(0);
  const [description, setDescription] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function pedirConfirmacao() {
    if (!centavos || centavos < 350) {
      setErro("Valor mínimo de saque é R$ 3,50.");
      return;
    }
    setErro(null);
    setConfirmando(true);
  }

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      await criarPayoutAbacatePay({ amountCentavos: centavos, description: description.trim() || undefined });
      setConfirmando(false);
      onCriado();
    } catch (e) {
      setErro((e as Error).message);
      setConfirmando(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <ModalBase titulo="Novo saque" onCancel={onCancel}>
        <CurrencyInput label="Valor" valueCentavos={centavos} onChangeCentavos={setCentavos} />
        <Input label="Descrição (opcional)" value={description} onChangeText={setDescription} placeholder="Ex.: retirada mensal" />
        {erro ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{erro}</Text> : null}
        <View style={{ flexDirection: "row", gap: space[3], justifyContent: "flex-end" }}>
          <Button label="Cancelar" variant="ghost" onPress={onCancel} />
          <Button label="Continuar" variant="primary" onPress={pedirConfirmacao} />
        </View>
      </ModalBase>

      <ConfirmModal
        visible={confirmando}
        title="Confirmar saque"
        message={`Você está prestes a sacar ${formatMoney(centavos)} da conta AbacatePay pro banco cadastrado. Essa ação é irreversível.`}
        confirmLabel={`Sacar ${formatMoney(centavos)}`}
        loading={enviando}
        onCancel={() => setConfirmando(false)}
        onConfirm={confirmar}
      />
    </>
  );
}

// ============================================================================
// PIX pra terceiro — MOVE DINHEIRO DE VERDADE
// ============================================================================
function PixTab() {
  const { items, loading, error, pageNumber, hasNext, hasPrev, proxima, anterior, refresh } = usePaginatedAbacatePay(listarPixAbacatePay, 10);
  const [criando, setCriando] = useState(false);

  return (
    <View>
      <Card variant="outline" padding={4} style={{ marginBottom: space[4], borderColor: color.state.warning }}>
        <Text style={{ ...type.bodyStrong, color: color.state.warning }}>⚠ Isso move dinheiro de verdade</Text>
        <Text style={{ ...type.caption, color: color.text.secondary, marginTop: 2 }}>
          Envia PIX da conta AbacatePay pra uma chave de terceiro. Confira a chave com atenção — sem volta.
        </Text>
      </Card>

      <TabHeader titulo="PIX" acao={<Button label="+ Novo PIX" variant="primary" size="sm" onPress={() => setCriando(true)} />} />

      <AbacaTable<AbacatePayPix>
        loading={loading}
        error={error}
        vazio="Nenhum PIX enviado ainda (ou a API não devolveu a lista — ver mensagem de erro acima)."
        linhas={items}
        colunas={[
          { label: "ID externo", minWidth: 160, render: (r) => <Text style={{ ...type.caption, color: color.text.secondary }} numberOfLines={1}>{r.externalId}</Text> },
          { label: "Valor", minWidth: 100, render: (r) => <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{formatMoney(r.amount)}</Text> },
          { label: "Status", minWidth: 100, render: (r) => <Badge label={r.status} tone={r.status === "COMPLETE" ? "success" : r.status === "CANCELLED" ? "danger" : "info"} /> },
          { label: "Criado em", minWidth: 100, render: (r) => <Text style={{ ...type.caption, color: color.text.muted }}>{formatData(r.createdAt)}</Text> },
        ]}
      />
      <Paginacao pageNumber={pageNumber} hasPrev={hasPrev} hasNext={hasNext} loading={loading} onPrev={anterior} onNext={proxima} />

      {criando ? (
        <NovoPixModal
          onCancel={() => setCriando(false)}
          onCriado={() => {
            setCriando(false);
            refresh();
          }}
        />
      ) : null}
    </View>
  );
}

const TIPOS_CHAVE_PIX = ["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM", "BR_CODE"] as const;

function NovoPixModal({ onCancel, onCriado }: { onCancel: () => void; onCriado: () => void }) {
  const [centavos, setCentavos] = useState(0);
  const [chave, setChave] = useState("");
  const [tipoChave, setTipoChave] = useState<(typeof TIPOS_CHAVE_PIX)[number]>("CPF");
  const [description, setDescription] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function pedirConfirmacao() {
    if (!centavos || centavos < 1) {
      setErro("Informe um valor.");
      return;
    }
    if (!chave.trim()) {
      setErro("Informe a chave PIX de destino.");
      return;
    }
    setErro(null);
    setConfirmando(true);
  }

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      await criarPixAbacatePay({ amountCentavos: centavos, pixKey: chave.trim(), pixKeyType: tipoChave, description: description.trim() || undefined });
      setConfirmando(false);
      onCriado();
    } catch (e) {
      setErro((e as Error).message);
      setConfirmando(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <ModalBase titulo="Novo PIX" onCancel={onCancel}>
        <CurrencyInput label="Valor" valueCentavos={centavos} onChangeCentavos={setCentavos} />
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>Tipo de chave</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[3] }}>
          {TIPOS_CHAVE_PIX.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTipoChave(t)}
              style={{
                paddingHorizontal: space[3],
                paddingVertical: space[2],
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: tipoChave === t ? color.border.focus : color.border.default,
                backgroundColor: tipoChave === t ? color.bg.brand : "transparent",
              }}
            >
              <Text style={{ ...type.caption, color: tipoChave === t ? color.text.onBrand : color.text.primary, fontWeight: "600" }}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Input label="Chave PIX de destino" value={chave} onChangeText={setChave} placeholder="Chave da pessoa/empresa que vai receber" autoCapitalize="none" />
        <Input label="Descrição (opcional)" value={description} onChangeText={setDescription} placeholder="Ex.: reembolso, pagamento a fornecedor" />
        {erro ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{erro}</Text> : null}
        <View style={{ flexDirection: "row", gap: space[3], justifyContent: "flex-end" }}>
          <Button label="Cancelar" variant="ghost" onPress={onCancel} />
          <Button label="Continuar" variant="primary" onPress={pedirConfirmacao} />
        </View>
      </ModalBase>

      <ConfirmModal
        visible={confirmando}
        title="Confirmar envio de PIX"
        message={`Você está prestes a enviar ${formatMoney(centavos)} via PIX pra chave "${chave}" (${tipoChave}). Confira com atenção — essa ação é irreversível.`}
        confirmLabel={`Enviar ${formatMoney(centavos)}`}
        loading={enviando}
        onCancel={() => setConfirmando(false)}
        onConfirm={confirmar}
      />
    </>
  );
}

// ============================================================================
// Modal base — mesmo padrão de overlay do `ConfirmModal` (packages/ui), pros
// formulários de criação (mais campos do que um `ConfirmModal` comporta).
// Precisa ser um `Modal` de verdade, não `position: "absolute"` — cada aba
// monta este componente dentro do `ScrollView` da tela (conteúdo rolável),
// então um overlay absoluto ficava posicionado relativo ao container rolado
// (desalinhado, atrás de outras seções), em vez de cobrir a tela inteira. O
// `Modal` do React Native renderiza fora do fluxo normal (portal), como
// qualquer outro modal do produto.
// ============================================================================
function ModalBase({ titulo, onCancel, children }: { titulo: string; onCancel: () => void; children: React.ReactNode }) {
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{ flex: 1, backgroundColor: "rgba(17, 24, 39, 0.5)", alignItems: "center", justifyContent: "center", padding: space[5] }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480 }}>
          <ScrollView style={{ maxHeight: "90%" }}>
            <Card variant="default" padding={5}>
              <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[4] }}>{titulo}</Text>
              {children}
            </Card>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
