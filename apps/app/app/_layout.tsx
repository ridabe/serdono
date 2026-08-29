import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts as useSora, Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { color } from "@serdono/ui";
import { AppUpdateAlert } from "../components/AppUpdateAlert";
import { InstallAppPrompt } from "../components/InstallAppPrompt";
import { LinkminerButton } from "../components/LinkminerButton";
import { DrawerProvider } from "../components/shell/DrawerContext";

// DESIGN_SYSTEM.md §3.3 — RN não faz fallback de fonte do sistema: Sora e Inter
// precisam estar carregadas via expo-font antes da primeira renderização.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Altura de verdade do banner "baixe o app" (pedido do dono do produto,
  // 28/08/2026) — repassada pro botão "Fale conosco" subir e não ficar
  // sobreposto ao banner. Ver comentário completo em `InstallAppPrompt.tsx`
  // (`onAltura`) e `LinkminerButton.web.tsx` (`bottomOffset`).
  const [installBannerAltura, setInstallBannerAltura] = useState(0);

  const [soraLoaded] = useSora({ Sora_600SemiBold, Sora_700Bold });
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fontsReady = soraLoaded && interLoaded;

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  // SafeAreaProvider explícito (SDD-53): as telas do app instalado leem
  // `useSafeAreaInsets` pra respeitar status bar/notch e a barra de gestos do
  // Android. Na web os insets são sempre 0, então o provider é inócuo lá.
  //
  // DrawerProvider (SDD-59, DS-22) mora na raiz, não só no grupo protegido:
  // o gatilho do drawer vive dentro do `ScreenHeader`, que qualquer tela
  // (presente ou futura) pode montar — inclusive fora de `(protected)`. Na
  // web e em qualquer rota sem `AppDrawer` montado, o contexto existe mas
  // não tem efeito nenhum (é só um booleano sem consumidor visual).
  return (
    <SafeAreaProvider>
      <DrawerProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.bg.canvas },
          }}
        >
          {/* `/planos` abre como modal só no app instalado (RN ignora
              `presentation` na web, então isso não muda a navegação da
              landing) — pedido do dono do produto: quem só quer espiar
              preço a partir da tela de boas-vindas não deve sair do fluxo
              do app, só fechar o modal e continuar de onde estava. */}
          <Stack.Screen name="planos" options={{ presentation: "modal" }} />
        </Stack>
        <AppUpdateAlert />
        {/* Banner "baixe o app" (pedido do dono do produto, 28/08/2026) — mora
            na raiz igual `AppUpdateAlert`, de propósito: precisa aparecer em
            QUALQUER rota acessada pela web (marketing, login, telas
            protegidas), não só dentro de `(protected)`. Só se auto-renderiza
            quando `isWebPlatform`, então é inócuo no app instalado. */}
        <InstallAppPrompt onAltura={setInstallBannerAltura} />
        {/* Botão "Fale conosco" da Linkminer (pedido do dono do produto,
            28/08/2026) — mora na raiz pelo mesmo motivo dos dois acima, mas
            só se mostra em rota PÚBLICA (detecção por sessão dentro do
            próprio componente, ver comentário em `LinkminerButton.web.tsx`):
            nas telas logadas a bolha da Mary já ocupa o mesmo canto da tela.
            `bottomOffset` sobe o botão quando o banner "baixe o app" está
            visível, pra não ficar um em cima do outro (achado testando: os
            dois disputavam o mesmo canto inferior). */}
        <LinkminerButton bottomOffset={installBannerAltura} />
      </DrawerProvider>
    </SafeAreaProvider>
  );
}
