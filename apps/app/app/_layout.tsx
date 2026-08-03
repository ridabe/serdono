import { useEffect } from "react";
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
import { DrawerProvider } from "../components/shell/DrawerContext";

// DESIGN_SYSTEM.md §3.3 — RN não faz fallback de fonte do sistema: Sora e Inter
// precisam estar carregadas via expo-font antes da primeira renderização.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
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
        />
        <AppUpdateAlert />
      </DrawerProvider>
    </SafeAreaProvider>
  );
}
