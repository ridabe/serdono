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
import { color } from "@serdono/ui";
import { AppUpdateAlert } from "../components/AppUpdateAlert";

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

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.bg.canvas },
        }}
      />
      <AppUpdateAlert />
    </>
  );
}
