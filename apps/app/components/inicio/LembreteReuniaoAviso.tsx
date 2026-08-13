import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { color, radius, space, type } from "@serdono/ui";
import { fimJanelaLembreteInicioISO, rotuloQuandoReuniao } from "@serdono/core";
import { getCurrentSession, getProximoLembreteReuniao, type ProximoLembreteReuniao } from "@serdono/supabase";

/**
 * Destaque de reunião agendada hoje/amanhã na Início (RN-55, pedido do dono
 * do produto, 12/08/2026) — logo abaixo da saudação, dentro do card de
 * marca (fundo azul), pra não deixar passar. Some sozinho sem reunião
 * elegível na janela e troca pra próxima assim que a atual sai dela (a
 * consulta busca sempre a mais próxima dentro da janela — reabrir a Início
 * já refaz a busca, sem precisar de polling).
 */
export function LembreteReuniaoAviso() {
  const [lembrete, setLembrete] = useState<ProximoLembreteReuniao | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session || cancelado) return;
        const agora = new Date();
        const proximo = await getProximoLembreteReuniao(session.user.id, agora.toISOString(), fimJanelaLembreteInicioISO(agora));
        if (!cancelado) setLembrete(proximo);
      } catch {
        // Nunca deixa a Início quebrar por causa de um destaque opcional — silencioso.
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  if (!lembrete) return null;

  const quando = rotuloQuandoReuniao(lembrete.dataHoraISO) === "hoje" ? "hoje" : "amanhã";
  const hora = new Date(lembrete.dataHoraISO).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: "rgba(242,176,61,0.18)",
        borderRadius: radius.full,
        paddingVertical: space[2],
        paddingHorizontal: space[4],
        marginBottom: space[3],
        maxWidth: "100%",
      }}
    >
      <Text style={{ ...type.bodyStrong, color: color.action.primary, flexShrink: 1 }} numberOfLines={2}>
        📅 Não esqueça: reunião com {lembrete.comQuem} {quando} às {hora}
      </Text>
    </View>
  );
}
