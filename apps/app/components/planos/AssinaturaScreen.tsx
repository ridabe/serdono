import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button, Card, ConfirmModal, color, space, type } from "@serdono/ui";
import { labelPlano, type Plano } from "@serdono/core";
import { cancelarAssinatura, getCurrentSession, getPlanoAtual, listarAssinaturas, signOut, type SubscriptionRow } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Aguardando pagamento",
  ativa: "Ativa",
  cancelada: "Cancelada",
  inadimplente: "Pagamento pendente",
};

/**
 * Tela protegida "Minha Assinatura" (cobrança via AbacatePay, 17/08/2026).
 * Mostra o plano vigente (`users.plano_atual`, cache de leitura rápida —
 * fonte de verdade é o webhook), histórico de `subscriptions`, e permite
 * cancelar a assinatura ativa. Trocar de plano hoje = assinar o novo pelo
 * `/planos` (sem proração nesta versão).
 */
export function AssinaturaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [planoAtual, setPlanoAtual] = useState<Plano>("gratuito");
  const [assinaturas, setAssinaturas] = useState<SubscriptionRow[]>([]);
  const [cancelando, setCancelando] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function carregar() {
    const session = await getCurrentSession();
    if (!session) return;
    const [plano, historico] = await Promise.all([getPlanoAtual(session.user.id), listarAssinaturas(session.user.id)]);
    setPlanoAtual((plano as Plano) ?? "gratuito");
    setAssinaturas(historico);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  async function confirmarCancelamento() {
    setCancelando(true);
    setError(null);
    try {
      await cancelarAssinatura();
      setConfirmandoCancelamento(false);
      await carregar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCancelando(false);
    }
  }

  const assinaturaAtiva = assinaturas.find((a) => a.status === "ativa");

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[
          { label: "← Painel", onPress: () => router.push("/inicio") },
          { label: "Sair", onPress: handleSignOut },
        ]}
      />

      <View style={{ padding: space[5], gap: space[5] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Minha assinatura</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>Seu plano atual e o histórico de cobrança.</Text>
        </View>

        {error ? <Text style={{ ...type.caption, color: color.state.danger }}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={color.bg.brand} />
        ) : (
          <>
            <Card variant="brand" padding={6}>
              <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[1] }}>PLANO ATUAL</Text>
              <Text style={{ ...type.h2, color: color.text.onBrand, marginBottom: space[4] }}>{labelPlano(planoAtual)}</Text>
              <View style={{ flexDirection: "row", gap: space[3] }}>
                <Button label={planoAtual === "master" ? "Ver planos" : "Fazer upgrade"} variant="primary" onPress={() => router.push("/planos")} />
                {assinaturaAtiva ? (
                  <Button
                    label="Cancelar assinatura"
                    variant="ghost"
                    onDark
                    onPress={() => setConfirmandoCancelamento(true)}
                  />
                ) : null}
              </View>
            </Card>

            <View>
              <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[3] }}>Histórico</Text>
              {assinaturas.length === 0 ? (
                <Card variant="outline" padding={5}>
                  <Text style={{ ...type.body, color: color.text.secondary }}>Você ainda não assinou nenhum plano pago.</Text>
                </Card>
              ) : (
                <View style={{ gap: space[3] }}>
                  {assinaturas.map((a) => (
                    <Card key={a.id} variant="outline" padding={4}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View>
                          <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{labelPlano(a.plano as Plano)}</Text>
                          <Text style={{ ...type.caption, color: color.text.muted, marginTop: 2 }}>
                            {STATUS_LABEL[a.status] ?? a.status} · desde {formatarData(a.created_at)}
                          </Text>
                        </View>
                        <Text style={{ ...type.bodyStrong, color: color.text.secondary }}>R$ {(a.preco_centavos / 100).toFixed(2).replace(".", ",")}/mês</Text>
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <ConfirmModal
        visible={confirmandoCancelamento}
        title="Cancelar assinatura"
        message="Você perde o acesso aos módulos pagos imediatamente, sem período de carência. Tem certeza?"
        confirmLabel="Cancelar assinatura"
        loading={cancelando}
        onConfirm={confirmarCancelamento}
        onCancel={() => setConfirmandoCancelamento(false)}
      />
    </View>
  );
}
