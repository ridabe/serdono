import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Slot } from "expo-router";
import { color } from "@serdono/ui";
import { getCurrentSession, hasModuleAccess } from "@serdono/supabase";

// Mesmo padrão de apps/app/app/(protected)/admin/_layout.tsx (SDD-22), mas
// checando posse do módulo "jornada-empreendedora" (SDD-31) em vez de role —
// liberação continua manual pelo admin até existir gate por plano.
export default function JornadaLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const session = await getCurrentSession();
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      const allowed = await hasModuleAccess(session.user.id, "jornada-empreendedora");
      if (!active) return;
      if (!allowed) {
        router.replace("/assistente");
        return;
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  return <Slot />;
}
