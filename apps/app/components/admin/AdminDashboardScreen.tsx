import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Card, Logo, color, space, type } from "@serdono/ui";
import { signOut, supabase } from "@serdono/supabase";

interface DashboardStats {
  total_usuarios: number;
  novos_usuarios_7d: number;
  usuarios_bloqueados: number;
  diagnosticos_concluidos: number;
  nichos_destravados: number;
}

// Cada entrada aqui vira um card — adicionar métrica nova (quando existir
// dado real pra ela, ex.: financeiro) é só somar um item nesta lista e um
// campo no retorno do RPC `admin_dashboard_stats` (SDD-30).
const INSIGHTS: { key: keyof DashboardStats; label: string }[] = [
  { key: "total_usuarios", label: "Usuários totais" },
  { key: "novos_usuarios_7d", label: "Novos usuários (7 dias)" },
  { key: "diagnosticos_concluidos", label: "Diagnósticos concluídos" },
  { key: "nichos_destravados", label: "Nichos destravados" },
  { key: "usuarios_bloqueados", label: "Usuários bloqueados" },
];

export function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_stats");
      if (error) return setError(error.message);
      setStats(data as unknown as DashboardStats);
    })();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: space[3],
          borderBottomWidth: 1,
          borderBottomColor: color.border.default,
          backgroundColor: color.bg.surface,
        }}
      >
        <Logo size={28} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <Pressable onPress={() => router.push("/perfil")} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Meu perfil</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/sobre")} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Sobre</Text>
          </Pressable>
          <Pressable onPress={handleSignOut} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>Sair</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5] }}>
        <Text style={{ ...type.h1, color: color.text.primary, marginBottom: space[1] }}>Painel administrativo</Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
          Toda a administração do sistema começa por aqui.
        </Text>

        {error ? (
          <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>
            Não consegui carregar as métricas: {error}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3], marginBottom: space[6] }}>
          {INSIGHTS.map((insight) => (
            <InsightCard key={insight.key} label={insight.label} value={stats?.[insight.key]} />
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
          <NavCard
            title="Usuários"
            description="Adicionar, bloquear, reenviar senha e promover administradores."
            onPress={() => router.push("/admin/usuarios")}
          />
          <NavCard
            title="Módulos"
            description="Catálogo de módulos do sistema e liberação por usuário."
            onPress={() => router.push("/admin/modulos")}
          />
          <NavCard
            title="Fornecedores"
            description="Base de parceiros sugerida ao empreendedor na Fase 8 da Jornada, filtrada por nicho."
            onPress={() => router.push("/admin/fornecedores")}
          />
          <NavCard
            title="Dicas da Mary"
            description="Categorias de estudo com PDF, vídeo e links — liberado a todo usuário, sem gate de módulo."
            onPress={() => router.push("/admin/dicas")}
          />
          <NavCard
            title="Versão do App"
            description="Versão publicada, versão mínima suportada, atualização obrigatória e link da Play Store."
            onPress={() => router.push("/admin/versao")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InsightCard({ label, value }: { label: string; value?: number }) {
  return (
    <Card variant="outline" padding={4} style={{ minWidth: 160, flexGrow: 1 }}>
      <Text style={{ ...type.h1, color: color.bg.brand }}>{value ?? "—"}</Text>
      <Text style={{ ...type.caption, color: color.text.muted, marginTop: space[1] }}>{label}</Text>
    </Card>
  );
}

function NavCard({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexGrow: 1, minWidth: 240 }}>
      <Card variant="default" padding={5}>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[1] }}>{title} →</Text>
        <Text style={{ ...type.body, color: color.text.secondary }}>{description}</Text>
      </Card>
    </Pressable>
  );
}
