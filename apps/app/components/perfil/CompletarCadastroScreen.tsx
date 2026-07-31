import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Button, Logo, color, radius, space, type } from "@serdono/ui";
import { getCurrentSession, getUserRole, hasModuleAccess } from "@serdono/supabase";
import { PerfilFields } from "./PerfilFields";
import { usePerfilForm } from "./usePerfilForm";

type Session = Awaited<ReturnType<typeof getCurrentSession>>;

// Mesmo destino do login (SDD-50) — sem isso, quem acabou de completar o
// cadastro caía sempre no assistente e nunca via o painel, mesmo já tendo a
// Jornada liberada.
async function destinationFor(session: Session): Promise<"/admin" | "/inicio" | "/assistente"> {
  if (getUserRole(session) === "admin") return "/admin";
  if (!session) return "/assistente";
  const hasJornada = await hasModuleAccess(session.user.id, "jornada-empreendedora");
  return hasJornada ? "/inicio" : "/assistente";
}

export function CompletarCadastroScreen() {
  const router = useRouter();
  const form = usePerfilForm();

  async function handleSubmit() {
    const ok = await form.save();
    if (!ok) return;
    const session = await getCurrentSession();
    router.replace(await destinationFor(session));
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg.canvas }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space[5] }}>
        <View style={{ width: "100%", maxWidth: 420 }}>
          <View style={{ alignItems: "center", marginBottom: space[6] }}>
            <Logo size={32} />
          </View>

          <View
            style={{
              backgroundColor: color.bg.surface,
              borderRadius: radius.lg,
              padding: space[6],
              shadowColor: "#111827",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[1] }}>Complete seu cadastro</Text>
            <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[6] }}>
              Falta pouco — nome e telefone pra continuar. A foto é opcional, dá pra adicionar depois.
            </Text>

            <PerfilFields
              nome={form.nome}
              onChangeNome={form.setNome}
              telefone={form.telefone}
              onChangeTelefone={form.setTelefone}
              avatarUri={form.avatarUri}
              onPickPhoto={form.handlePickPhoto}
              error={form.error}
            />

            <Button
              label={form.saving ? "Salvando..." : "Salvar e continuar"}
              variant="primary"
              fullWidth
              loading={form.saving}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
