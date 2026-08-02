import { useEffect, useState } from "react";
import { usePathname, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Slot } from "expo-router";
import { color, isNativeApp } from "@serdono/ui";
import { getCurrentSession, isAnonymousSession, supabase } from "@serdono/supabase";
import { MobileTabBar } from "../../components/shell/MobileTabBar";

const PROFILE_ROUTE = "/completar-cadastro";

// Onde a barra de abas NÃO aparece no app instalado (SDD-53): o cadastro
// incompleto é um fluxo obrigatório (dar saída por aba só faria o próprio
// layout redirecionar de volta), e o painel administrativo é web — não tem
// aba, e quem chegar nele por link direto navega pelo cabeçalho da tela.
const ROTAS_SEM_TAB_BAR = [PROFILE_ROUTE, "/admin"];

// Guarda de rota: exige uma sessão real (não anônima) antes de renderizar
// qualquer tela do grupo (protected). Isso é UX, não a fronteira de
// segurança de verdade — quem protege os dados é a RLS em cada tabela
// (SPEC.md §4.2/SDD-22).
export default function ProtectedLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  // Roda uma vez por mount do layout (não a cada troca de rota lateral
  // dentro do grupo) — o layout persiste montado entre /assistente, /admin
  // e /completar-cadastro (todos filhos do mesmo Slot), então re-rodar isso
  // por troca de pathname desmontaria a tela de origem no meio da própria
  // navegação dela (foi exatamente o que causava "REPLACE ... not handled
  // by any navigator" ao sair de /completar-cadastro — ver SDD-25).
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

  // Perfil incompleto (nome/telefone) manda pra tela de completar cadastro
  // — reage a troca de rota, mas SEM esconder o conteúdo atual enquanto
  // verifica (não mexe em `ready`), pra não competir com a navegação que a
  // própria tela de origem já está fazendo.
  useEffect(() => {
    if (!ready || pathname === PROFILE_ROUTE) return;
    let active = true;

    (async () => {
      const session = await getCurrentSession();
      if (!session || !active) return;
      const { data } = await supabase.from("users").select("nome, telefone").eq("id", session.user.id).maybeSingle();
      if (!active) return;
      if (!data?.nome?.trim() || !data?.telefone?.trim()) {
        router.replace(PROFILE_ROUTE);
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname, ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.bg.canvas }}>
        <ActivityIndicator color={color.bg.brand} size="large" />
      </View>
    );
  }

  const mostrarTabBar =
    isNativeApp && !ROTAS_SEM_TAB_BAR.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      {mostrarTabBar ? <MobileTabBar /> : null}
    </View>
  );
}
