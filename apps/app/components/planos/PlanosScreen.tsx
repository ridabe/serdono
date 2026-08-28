import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Platform, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { breakpoint, Button, Card, color, Input, isNativeApp, space, type } from "@serdono/ui";
import { PLANOS_CATALOGO, type Plano } from "@serdono/core";
import { criarCheckout, getCurrentSession } from "@serdono/supabase";
import { ScreenHeader } from "../shell/ScreenHeader";

/**
 * Tela pública de planos (cobrança via AbacatePay, pedido do dono do
 * produto, 17/08/2026). Deslogado → manda pro login (fluxo simples, sem
 * threading de "next" pelo login — assina depois de entrar). Logado → chama
 * a Edge Function que cria o checkout na AbacatePay e abre a URL (RN-17/
 * RNF-8: checkout nasce sempre na web — o app nativo só abre a URL num
 * navegador, nunca cobra dentro do app; `window.location` na web).
 *
 * No nativo (achado/corrigido 28/08/2026): `WebBrowser.openAuthSessionAsync`
 * com um deep link próprio como destino de conclusão, não mais
 * `openBrowserAsync` puro — sem isso o usuário terminava o pagamento e ficava
 * preso vendo o site público dentro do navegador in-app, tendo que fechar a
 * aba manualmente pra voltar ao app. Mesmo mecanismo do login com Google
 * (`LoginScreen.tsx`).
 */
export function PlanosScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < breakpoint.medium;

  const [logado, setLogado] = useState<boolean | null>(null);
  const [carregandoPlano, setCarregandoPlano] = useState<Plano | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cupom, setCupom] = useState("");

  useEffect(() => {
    getCurrentSession().then((session) => setLogado(!!session));
  }, []);

  async function assinar(plano: Plano) {
    if (plano === "gratuito") {
      router.push(logado ? "/inicio" : "/diagnostico");
      return;
    }
    if (!logado) {
      router.push("/login");
      return;
    }
    setError(null);
    setCarregandoPlano(plano);
    try {
      if (Platform.OS === "web") {
        const url = await criarCheckout(plano as "essencial" | "master", cupom);
        window.location.href = url;
        return;
      }

      // App instalado (Android/iOS, pedido do dono do produto, 28/08/2026):
      // manda um deep link próprio (`serdono://assinatura`) como destino de
      // conclusão — sem isso, o checkout terminava dentro do navegador in-app
      // mostrando o SITE público (sem sessão nenhuma aí), e o usuário tinha
      // que fechar a aba manualmente pra voltar ao app de verdade.
      // `openAuthSessionAsync` (mesmo mecanismo já usado no login com Google,
      // `LoginScreen.tsx`) observa esse deep link e fecha a aba sozinho assim
      // que a AbacatePay redireciona pra lá, devolvendo o controle pro app.
      const completionUrl = Linking.createURL("assinatura");
      const returnUrl = Linking.createURL("planos");
      const url = await criarCheckout(plano as "essencial" | "master", cupom, { completionUrl, returnUrl });
      const result = await WebBrowser.openAuthSessionAsync(url, completionUrl);
      if (result.type === "success") {
        // Pagamento pode levar alguns segundos pra confirmar do lado da
        // AbacatePay/webhook — `AssinaturaScreen` mostra "confirmando" e
        // repete a consulta sozinha enquanto isso (ver `AssinaturaScreen.tsx`).
        router.push("/assinatura");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCarregandoPlano(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScreenHeader
        webLinks={[{ label: "← Início", onPress: () => router.push("/") }]}
        // No app instalado esta tela abre como modal (ver `_layout.tsx`) —
        // `links` some nas duas plataformas normalmente, mas aqui precisa
        // aparecer no nativo pra fechar sem depender só do gesto/voltar do
        // sistema (pedido do dono do produto, 17/08/2026).
        links={isNativeApp ? [{ label: "✕ Fechar", onPress: () => (router.canGoBack() ? router.back() : router.push("/")) }] : []}
      />

      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <View>
          <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Planos</Text>
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Comece grátis. Assine quando quiser abrir a empresa ou tocar o negócio todo mês.
          </Text>
        </View>

        {error ? <Text style={{ ...type.caption, color: color.state.danger }}>{error}</Text> : null}

        {logado ? (
          <View style={{ maxWidth: 320 }}>
            <Input
              label="Cupom de desconto (opcional)"
              value={cupom}
              onChangeText={setCupom}
              placeholder="Ex.: BEMVINDO10"
              autoCapitalize="none"
            />
            <Text style={{ ...type.caption, color: color.text.muted, marginTop: -space[2] }}>
              Se tiver um cupom, digite antes de assinar — o campo aparece na página de pagamento.
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: compact ? "column" : "row", gap: space[4], alignItems: "stretch" }}>
          {PLANOS_CATALOGO.map((p) => (
            <Card
              key={p.valor}
              variant={p.valor === "essencial" ? "brand" : "outline"}
              padding={6}
              style={{ flex: compact ? undefined : 1 }}
            >
              <Text
                style={{
                  ...type.overline,
                  color: p.valor === "essencial" ? color.action.primary : color.text.muted,
                  marginBottom: space[2],
                }}
              >
                {p.nome.toUpperCase()}
                {p.valor === "essencial" ? " · RECOMENDADO" : ""}
              </Text>
              <Text style={{ ...type.display, color: p.valor === "essencial" ? color.text.onBrand : color.text.primary }}>
                {p.precoLancamentoCentavos === 0 ? "R$ 0" : `R$ ${(p.precoLancamentoCentavos / 100).toFixed(2).replace(".", ",")}`}
                {p.precoLancamentoCentavos > 0 ? (
                  <Text style={{ ...type.body, color: p.valor === "essencial" ? color.text.onBrand : color.text.secondary }}> /mês</Text>
                ) : null}
              </Text>
              {p.precoLancamentoCentavos > 0 && p.precoLancamentoCentavos !== p.precoCheioCentavos ? (
                <Text style={{ ...type.caption, color: p.valor === "essencial" ? color.text.onBrand : color.text.muted, marginBottom: space[3] }}>
                  Preço de lançamento — depois R$ {(p.precoCheioCentavos / 100).toFixed(2).replace(".", ",")}/mês
                </Text>
              ) : (
                <View style={{ marginBottom: space[3] }} />
              )}
              <Text style={{ ...type.body, color: p.valor === "essencial" ? color.text.onBrand : color.text.secondary, marginBottom: space[4] }}>
                {p.descricao}
              </Text>
              <View style={{ gap: space[2], marginBottom: space[5] }}>
                {p.beneficios.map((b) => (
                  <View key={b} style={{ flexDirection: "row", gap: space[2] }}>
                    <Text style={{ color: p.valor === "essencial" ? color.action.primary : color.bg.brand }}>✓</Text>
                    <Text style={{ ...type.body, color: p.valor === "essencial" ? color.text.onBrand : color.text.secondary, flex: 1 }}>{b}</Text>
                  </View>
                ))}
              </View>
              <Button
                label={p.valor === "gratuito" ? "Começar grátis" : `Assinar ${p.nome}`}
                variant={p.valor === "essencial" ? "secondary" : "primary"}
                fullWidth
                loading={carregandoPlano === p.valor}
                onPress={() => assinar(p.valor)}
              />
            </Card>
          ))}
        </View>

        {logado === false ? (
          <Text style={{ ...type.caption, color: color.text.muted, textAlign: "center" }}>Entre na sua conta pra assinar um plano pago.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
