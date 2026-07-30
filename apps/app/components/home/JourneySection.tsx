import React from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, HoverLift, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

/**
 * Referência visual das 9 fases reais da Jornada Empreendedora (mesma lista de
 * `JornadaScreen.tsx`). É só apresentação — o passo a passo interativo vive
 * dentro do produto, pós-login. `pronta` reflete o que existe hoje de verdade:
 * anunciar fase não construída como pronta violaria o princípio de honestidade
 * do PRD §4 e a RN-2.
 */
const fases = [
  { nome: "Descoberta", body: "Diagnóstico do seu perfil e os nichos que combinam com você.", pronta: true },
  { nome: "Validação da Ideia", body: "Persona, SWOT, Canvas e a conversa com clientes de verdade.", pronta: true },
  { nome: "Planejamento", body: "Nome da empresa, domínio, logo e slogan da sua marca.", pronta: true },
  { nome: "Formalização", body: "CNPJ, CNAE, alvarás e as exigências da sua cidade.", pronta: false },
  { nome: "Marketing", body: "Onde seu cliente está e como falar com ele.", pronta: false },
  { nome: "Financeiro", body: "Preço, margem, capital de giro e o que sobra no fim do mês.", pronta: false },
  { nome: "Clientes", body: "Do primeiro contato à primeira venda fechada.", pronta: false },
  { nome: "Retenção", body: "Fazer o cliente voltar custa menos que achar um novo.", pronta: false },
  { nome: "Escala", body: "Crescer sem que tudo dependa de você.", pronta: false },
];

export function JourneySection({ compact }: { compact: boolean }) {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: color.bg.brand,
        paddingVertical: space[16],
        paddingHorizontal: compact ? space[4] : space[10],
      }}
    >
      <View style={{ maxWidth: content.maxWidthWide, width: "100%", alignSelf: "center" }}>
        <Reveal>
          <Text style={{ ...type.overline, color: color.action.primary, marginBottom: space[2] }}>
            A JORNADA EMPREENDEDORA
          </Text>
          <Text
            style={{
              ...type.display,
              fontSize: compact ? 26 : 34,
              lineHeight: compact ? 34 : 42,
              color: color.text.onBrand,
              marginBottom: space[3],
            }}
          >
            9 fases. Uma por vez. Nenhuma no escuro.
          </Text>
          <Text style={{ ...type.bodyLg, color: "#C7D3E3", maxWidth: 620, marginBottom: space[10] }}>
            Este é o caminho completo, do zero ao negócio girando. Você nunca vê tudo de uma vez: a Mary abre a próxima
            etapa quando a anterior está de pé.
          </Text>
        </Reveal>

        <View style={{ flexDirection: compact ? "column" : "row", flexWrap: "wrap", gap: space[4] }}>
          {fases.map((fase, i) => (
            <Reveal
              key={fase.nome}
              delay={motion.revealStagger * Math.min(i, 5)}
              style={{ flexBasis: compact ? "100%" : "30%", flexGrow: 1, minWidth: compact ? undefined : 240 }}
            >
              <HoverLift
                style={{
                  backgroundColor: fase.pronta ? "rgba(242,176,61,0.12)" : "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: fase.pronta ? color.action.primary : "rgba(255,255,255,0.12)",
                  borderRadius: radius.lg,
                  padding: space[5],
                  height: "100%",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space[3], marginBottom: space[3] }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: radius.full,
                      backgroundColor: fase.pronta ? color.action.primary : "rgba(255,255,255,0.14)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: type.h2.fontFamily,
                        fontSize: 14,
                        color: fase.pronta ? color.text.onAction : "#C7D3E3",
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={{ ...type.h3, color: color.text.onBrand, flex: 1 }}>{fase.nome}</Text>
                </View>

                <Text style={{ ...type.body, color: "#C7D3E3", marginBottom: space[3] }}>{fase.body}</Text>

                <Text
                  style={{
                    ...type.overline,
                    color: fase.pronta ? color.action.primary : "#8FA3BC",
                    marginTop: "auto",
                  }}
                >
                  {fase.pronta ? "JÁ DISPONÍVEL" : "EM BREVE"}
                </Text>
              </HoverLift>
            </Reveal>
          ))}
        </View>

        <Reveal delay={motion.revealStagger * 2} style={{ alignItems: "center", marginTop: space[12] }}>
          <Button label="Começar pela Descoberta" variant="primary" onPress={() => router.push("/diagnostico")} />
          <Text style={{ ...type.caption, color: "#8FA3BC", marginTop: space[3], textAlign: "center" }}>
            As 3 primeiras fases já estão no ar. As demais entram em sequência, sempre com profundidade antes de
            amplitude.
          </Text>
        </Reveal>
      </View>
    </View>
  );
}
