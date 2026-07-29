import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Slot } from "expo-router";
import { color } from "@serdono/ui";
import { getCurrentSession, isAnonymousSession, supabase } from "@serdono/supabase";

// Guarda de rota: exige uma sessão real (não anônima) antes de renderizar
// qualquer tela do grupo (protected). Isso é UX, não a fronteira de
// segurança de verdade — quem protege os dados é a RLS em cada tabela
// (SPEC.md §4.2/SDD-22).
export default function ProtectedLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      const session = await getCurrentSession();
      if (!active) return;
      if (!session || isAnonymousSession(session)) {
        router.replace("/login");
        return;
      }
      setReady(true);
    }

    check();
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session || isAnonymousSession(session)) {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
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
