import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Slot } from "expo-router";
import { color } from "@serdono/ui";
import { getCurrentSession, getUserRole } from "@serdono/supabase";

// Camada extra de guarda dentro de (protected): a sessão já é garantida real
// pelo layout pai — aqui só falta confirmar o papel "admin" (claim JWT
// user_role, SPEC.md SDD-22).
export default function AdminLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const session = await getCurrentSession();
      if (!active) return;
      if (!session || getUserRole(session) !== "admin") {
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
