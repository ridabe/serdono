import { Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Button, Card, MaryAvatar, color, radius, space, type } from "@serdono/ui";
import type { JornadaInstance } from "@serdono/supabase";
import { useJornadaConclusao } from "./useJornadaConclusao";

export interface ResumoFase {
  label: string;
  total: number;
  concluidas: number;
}

interface JornadaConclusaoScreenProps {
  jornada: JornadaInstance;
  nicheName: string | null;
  resumoFases: ResumoFase[];
}

/**
 * Tela de conclusão da Jornada Empreendedora (SDD-49) — mostrada quando
 * `fase_atual === "concluida"` (última fase real, Organização, fechada).
 * Celebra a conclusão (estilo "diploma"), resume as fases percorridas e
 * convida honestamente pros próximos módulos — sem prometer nada que ainda
 * não foi decidido (RN-2, PRD §12.2: nunca anunciar como pronto o que não
 * está).
 */
export function JornadaConclusaoScreen({ jornada, nicheName, resumoFases }: JornadaConclusaoScreenProps) {
  const nomeEmpresa = jornada.nome_empresa_escolhido ?? nicheName ?? "Seu negócio";
  const v = useJornadaConclusao(nomeEmpresa, nicheName);

  return (
    <View style={{ gap: space[5] }}>
      <Card variant="brand" padding={6}>
        <View style={{ alignItems: "center", gap: space[3] }}>
          <MaryAvatar pose="positivo" size={96} />
          <Text style={{ ...type.overline, color: color.action.primary }}>JORNADA CONCLUÍDA — 100%</Text>
          <Text style={{ ...type.h1, color: color.text.onBrand, textAlign: "center" }}>
            Parabéns! {nomeEmpresa} está de pé.
          </Text>
          <Text style={{ ...type.body, color: "#C7D3E3", textAlign: "center", maxWidth: 480 }}>
            Eu, a Mary, e todo o time do Ser Dono acompanhamos cada etapa até aqui — da escolha do nicho à primeira
            venda e à organização da rotina. Você percorreu o caminho inteiro. Esse é só o começo do que seu negócio
            pode ser.
          </Text>
        </View>
      </Card>

      {v.error ? <Text style={{ ...type.caption, color: color.state.danger }}>{v.error}</Text> : null}

      {v.videoUrl ? <ConclusaoVideo videoUrl={v.videoUrl} /> : null}

      <Card variant="default" padding={5}>
        <Text style={{ ...type.h3, color: color.text.primary, marginBottom: space[4] }}>Sua jornada, resumida</Text>
        <View style={{ gap: space[3] }}>
          {resumoFases.map((f) => (
            <View key={f.label} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ ...type.body, color: color.text.primary }}>{f.label}</Text>
              <FaseResumoBadge total={f.total} concluidas={f.concluidas} />
            </View>
          ))}
        </View>
      </Card>

      <Card variant="outline" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>
          Leve um lembrete dessa conquista
        </Text>
        <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[4] }}>
          Baixe o certificado de conclusão da Jornada Empreendedora — com o nome do seu negócio e a data de hoje.
        </Text>
        <Button label="Baixar certificado" variant="primary" fullWidth loading={v.baixandoCertificado} onPress={v.baixarCertificado} />
      </Card>

      <Card variant="default" padding={5}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[2] }}>E agora?</Text>
        {v.proximosModulos.length > 0 ? (
          <View style={{ gap: space[3] }}>
            <Text style={{ ...type.body, color: color.text.secondary }}>
              Você já tem acesso a mais módulos pra continuar depois da abertura:
            </Text>
            {v.proximosModulos.map((m) => (
              <Card key={m.id} variant="outline" padding={4}>
                <Text style={{ ...type.bodyStrong, color: color.text.primary }}>{m.nome}</Text>
                {m.descricao ? <Text style={{ ...type.body, color: color.text.secondary, marginTop: space[1] }}>{m.descricao}</Text> : null}
              </Card>
            ))}
          </View>
        ) : (
          <Text style={{ ...type.body, color: color.text.secondary }}>
            Manter um negócio de pé é diferente de abri-lo — retenção de clientes, crescimento e escala têm desafios
            próprios. Estamos preparando novos módulos pra te acompanhar nessa próxima fase; alguns podem pedir um
            plano diferente do atual, ainda em definição. Assim que estiverem prontos, você é avisado por aqui.
          </Text>
        )}
      </Card>
    </View>
  );
}

function FaseResumoBadge({ total, concluidas }: { total: number; concluidas: number }) {
  const completa = total > 0 && concluidas >= total;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space[1],
        backgroundColor: completa ? color.state.success : color.bg.surfaceAlt,
        borderRadius: radius.full,
        paddingHorizontal: space[3],
        paddingVertical: 4,
      }}
    >
      <Text style={{ color: completa ? "#fff" : color.text.muted, fontSize: 12, fontWeight: "700" }}>
        {completa ? "✓ concluída" : `${concluidas}/${total}`}
      </Text>
    </View>
  );
}

/** Componente à parte só pra isolar o hook do player — ele precisa existir sempre que montado, então só montamos este componente quando `videoUrl` já existe. */
function ConclusaoVideo({ videoUrl }: { videoUrl: string }) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
  });

  return (
    <Card variant="default" padding={0} style={{ overflow: "hidden" }}>
      <VideoView style={{ width: "100%", aspectRatio: 16 / 9 }} player={player} allowsFullscreen nativeControls />
    </Card>
  );
}
