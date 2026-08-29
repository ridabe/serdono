import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { color, isWebPlatform, radius, space, type } from "@serdono/ui";
import { getAppVersionInfo } from "@serdono/supabase";

type Dispositivo = "android" | "ios" | "desktop";

const CHAVE_DISPENSADO = "serdono_install_prompt_dispensado_em";
// Reaparece depois de um tempo em vez de nunca mais — quem dispensou sem
// querer (ou decidiu não instalar naquele dia) ainda vê o convite de novo
// mais adiante, sem virar propaganda repetitiva a cada visita.
const DIAS_ATE_REAPARECER = 14;

function detectarDispositivo(): Dispositivo {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  // `MSStream` só existe no IE — o teste clássico pra excluir falso-positivo
  // de UA de desktop disfarçado; iPadOS 13+ se identifica como Mac, mas tem
  // suporte a touch, então entra também.
  const iosClassico = /iPad|iPhone|iPod/.test(ua);
  const iPadOsComoMac = /Macintosh/.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
  if ((iosClassico || iPadOsComoMac) && !(window as unknown as { MSStream?: unknown }).MSStream) return "ios";
  return "desktop";
}

/** Safari expõe isso quando o site já foi adicionado à Tela de Início — nesse caso já virou "app", não faz sentido convidar de novo. */
function jaInstaladoComoPwa(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function lerDispensado(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const v = localStorage.getItem(CHAVE_DISPENSADO);
    if (!v) return false;
    const dias = (Date.now() - Number(v)) / (1000 * 60 * 60 * 24);
    return dias < DIAS_ATE_REAPARECER;
  } catch {
    // Modo privado/`localStorage` bloqueado — degrada pra "nunca dispensado"
    // em vez de quebrar a página por causa de um banner promocional.
    return false;
  }
}

function gravarDispensado() {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
  } catch {
    // idem acima — falhar em silêncio.
  }
}

/**
 * Banner "baixe o app" (pedido do dono do produto, 28/08/2026) — só existe na
 * WEB (`isWebPlatform` cobre desktop e navegador do celular por igual,
 * `packages/ui/platform.ts`; o app instalado nunca precisa disso, é o próprio
 * app). 3 variações por dispositivo detectado via `User-Agent`:
 *
 * - **Android:** link direto pra Play Store (`app_versions.store_url`).
 * - **iPhone/iPad:** ainda não existe app na App Store — instrução de "Adicionar
 *   à Tela de Início" no Safari, pra usar o site como se fosse um app instalado.
 * - **Desktop:** mesmo link da Play Store — abrir a listagem da Play Store
 *   logado na conta Google já dá a opção "Instalar" remotamente num Android
 *   vinculado (fluxo padrão do Google, nada customizado necessário aqui).
 *
 * Banner NÃO bloqueia a página (`position: fixed`, sem overlay escuro atrás —
 * diferente de `AppUpdateAlert.tsx`, que é bloqueio de verdade) — dispensável,
 * lembrado por até 14 dias via `localStorage` (não usa `AsyncStorage`: só
 * roda na web, e web mobile também tem `localStorage` normalmente).
 *
 * `onAltura` (pedido do dono do produto, 28/08/2026, achado ao adicionar o
 * botão "Fale conosco" da Linkminer): reporta a altura de verdade deste
 * banner (0 quando escondido/dispensado) pro `_layout.tsx` repassar como
 * `bottomOffset` do botão flutuante — sem isso os dois ficavam sobrepostos
 * no canto inferior, já que o banner ocupa a largura inteira e o botão
 * também mora perto do rodapé. Altura MEDIDA (`onLayout`), não estimada: o
 * texto varia bastante entre os 3 dispositivos (a variação iOS, com as
 * instruções expandidas, fica bem mais alta que Android/desktop).
 */
export function InstallAppPrompt({ onAltura }: { onAltura?: (altura: number) => void }) {
  const [dispositivo, setDispositivo] = useState<Dispositivo | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [dispensado, setDispensado] = useState(true);
  const [mostrarInstrucoesIos, setMostrarInstrucoesIos] = useState(false);

  useEffect(() => {
    if (!isWebPlatform) return;
    setDispositivo(detectarDispositivo());
    setDispensado(lerDispensado() || jaInstaladoComoPwa());
    getAppVersionInfo("android")
      .then((row) => setStoreUrl(row?.store_url ?? null))
      .catch(() => {}); // banner promocional — falha de leitura só não mostra o link
  }, []);

  const visivel = isWebPlatform && !!dispositivo && !dispensado && (dispositivo === "ios" || !!storeUrl);

  useEffect(() => {
    if (!visivel) onAltura?.(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel]);

  if (!visivel || !dispositivo) return null;

  function dispensar() {
    gravarDispensado();
    setDispensado(true);
  }

  const conteudo: Record<Dispositivo, { titulo: string; texto: string; acaoLabel: string; onAcao: () => void }> = {
    android: {
      titulo: "Baixe o app Ser Dono",
      texto: "Painel, Jornada e avisos direto no seu Android — mais rápido que pelo navegador.",
      acaoLabel: "Baixar app",
      onAcao: () => storeUrl && Linking.openURL(storeUrl),
    },
    desktop: {
      titulo: "Tem um Android? Baixe o app Ser Dono",
      texto: "Abra a Play Store — se seu celular usa a mesma conta Google, dá pra instalar remotamente direto daqui.",
      acaoLabel: "Baixar app",
      onAcao: () => storeUrl && Linking.openURL(storeUrl),
    },
    ios: {
      titulo: "Instale o Ser Dono no seu iPhone",
      texto: "Ainda não temos app na App Store — mas dá pra usar o Ser Dono como um app, direto da tela de início.",
      acaoLabel: mostrarInstrucoesIos ? "Ocultar" : "Como instalar",
      onAcao: () => setMostrarInstrucoesIos((v) => !v),
    },
  };
  const c = conteudo[dispositivo];

  return (
    // `position: "fixed"` não existe no tipo de `ViewStyle` do React Native
    // (só faz sentido na web) — `as any` de propósito, componente inteiro só
    // renderiza quando `isWebPlatform` é verdadeiro.
    <View
      onLayout={(e) => onAltura?.(e.nativeEvent.layout.height)}
      style={
        {
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: color.bg.brand,
          paddingHorizontal: space[5],
          paddingVertical: space[4],
          flexDirection: "row",
          alignItems: "center",
          gap: space[4],
          ...(radius.lg ? { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg } : {}),
        } as any
      }
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>{c.titulo}</Text>
        <Text style={{ ...type.caption, color: color.text.onBrand }}>{c.texto}</Text>
        {dispositivo === "ios" && mostrarInstrucoesIos ? (
          <View style={{ marginTop: space[2], gap: space[1] }}>
            <Text style={{ ...type.caption, color: color.text.onBrand }}>1. Toque em Compartilhar (o ícone com uma seta pra cima) na barra do Safari.</Text>
            <Text style={{ ...type.caption, color: color.text.onBrand }}>2. Escolha "Adicionar à Tela de Início".</Text>
            <Text style={{ ...type.caption, color: color.text.onBrand }}>3. Toque em "Adicionar" — o Ser Dono vira um ícone de app na sua tela.</Text>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
        <Pressable
          onPress={c.onAcao}
          accessibilityRole="button"
          style={{ backgroundColor: color.bg.surface, borderRadius: radius.sm, paddingHorizontal: space[3], paddingVertical: space[2] }}
        >
          <Text style={{ ...type.bodyStrong, color: color.action.primary }}>{c.acaoLabel}</Text>
        </Pressable>
        <Pressable
          onPress={dispensar}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso"
          style={{ minWidth: 32, minHeight: 32, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ ...type.bodyStrong, color: color.text.onBrand }}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}
