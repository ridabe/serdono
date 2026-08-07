import React from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, HoverLift, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

/**
 * Referência visual das fases reais da Jornada Empreendedora — a mesma ordem
 * de `FASES_JORNADA` (`packages/core/jornadaProgresso.ts`), com Descoberta na
 * frente (acontece pré-login e não tem `jornada_etapas` própria, SDD-31).
 *
 * **Reescrita em 02/08/2026 (SDD-55).** A lista anterior tinha 9 fases, 6
 * delas rotuladas "EM BREVE", e trazia Retenção/Escala como fases do
 * workflow. Estava desatualizada em três frentes ao mesmo tempo: Formalização,
 * Financeiro, Marketing e Clientes já estavam em produção (SDD-38 a SDD-45);
 * Estrutura, Fornecedores, Produto, Primeira Venda e Organização nem
 * apareciam (SDD-40 a SDD-48); e Retenção/Escala deixaram de ser fases na
 * SDD-49 (viraram módulos do catálogo — Retenção construída na SDD-54).
 * Nenhuma fase aqui é promessa: as 12 existem e estão no ar, por isso o
 * componente não tem mais o conceito de `pronta`.
 */
const fases = [
  { nome: "Descoberta", body: "Diagnóstico do seu perfil e os nichos que combinam com você." },
  { nome: "Validação da Ideia", body: "Persona, SWOT, Canvas e a conversa com clientes de verdade." },
  { nome: "Planejamento", body: "Nome da empresa, domínio, logo e slogan da sua marca." },
  { nome: "Formalização", body: "CNPJ, CNAE, alvarás e as exigências da sua cidade." },
  { nome: "Financeiro", body: "Preço, margem, capital de giro e o que sobra no fim do mês." },
  { nome: "Estrutura", body: "Local, conta PJ, equipamentos — só o que o seu tipo de negócio exige." },
  { nome: "Fornecedores", body: "Quem te abastece, o que perguntar e como negociar sem pagar de novato." },
  { nome: "Produto", body: "O que você vende, por quanto, e a conta que garante que sobra dinheiro." },
  { nome: "Marketing", body: "Onde seu cliente está e como falar com ele." },
  { nome: "Clientes", body: "Do primeiro contato à primeira venda fechada." },
  { nome: "Primeira Venda", body: "O marco: deixar de estar pronto pra vender e ter vendido de verdade." },
  { nome: "Organização", body: "Rotina, dinheiro e documentos em ordem pra crescer sem perder o controle." },
];

export function JourneySection({ compact }: { compact: boolean }) {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: color.bg.brand,
        paddingVertical: compact ? space[10] : space[16],
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
            12 fases. Uma por vez. Nenhuma no escuro.
          </Text>
          <Text style={{ ...type.bodyLg, color: "#C7D3E3", maxWidth: 620, marginBottom: space[10] }}>
            Este é o caminho completo, do zero ao negócio girando — inteiro, no ar, pronto pra você percorrer hoje.
            Você nunca vê tudo de uma vez: a Mary abre a próxima etapa quando a anterior está de pé.
          </Text>
        </Reveal>

        {/* `flexWrap: "wrap"` com `flexDirection: "column"` faz o Yoga tratar
            cada item como uma coluna nova (todas nasceriam sobrepostas na
            mesma altura, a maioria fora da tela) em vez de empilhar — só faz
            sentido junto de "row" (grid responsivo no desktop). */}
        <View style={{ flexDirection: compact ? "column" : "row", flexWrap: compact ? "nowrap" : "wrap", gap: space[4] }}>
          {fases.map((fase, i) => (
            <Reveal
              key={fase.nome}
              delay={motion.revealStagger * Math.min(i, 5)}
              // `flexBasis` segue o eixo principal — em "column" (compact) isso
              // é ALTURA, não largura: "100%" fazia cada card tentar ocupar a
              // altura inteira da pilha (bug real por trás do espaçamento
              // gigante no mobile). Em coluna, largura total é `width`, sem
              // flexGrow/flexBasis nenhum — cada card só tem sua altura natural.
              style={compact ? { width: "100%" } : { flexBasis: "30%", flexGrow: 1, minWidth: 240 }}
            >
              <HoverLift
                style={{
                  backgroundColor: "rgba(242,176,61,0.12)",
                  borderWidth: 1,
                  borderColor: color.action.primary,
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
                      backgroundColor: color.action.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: type.h2.fontFamily,
                        fontSize: 14,
                        color: color.text.onAction,
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={{ ...type.h3, color: color.text.onBrand, flex: 1 }}>{fase.nome}</Text>
                </View>

                <Text style={{ ...type.body, color: "#C7D3E3", marginBottom: space[3] }}>{fase.body}</Text>

                <Text style={{ ...type.overline, color: color.action.primary, marginTop: "auto" }}>
                  JÁ DISPONÍVEL
                </Text>
              </HoverLift>
            </Reveal>
          ))}
        </View>

        <Reveal delay={motion.revealStagger * 2} style={{ alignItems: "center", marginTop: space[12] }}>
          <Button label="Começar pela Descoberta" variant="primary" onPress={() => router.push("/diagnostico")} />
          <Text style={{ ...type.caption, color: "#8FA3BC", marginTop: space[3], textAlign: "center" }}>
            As 12 fases estão no ar. Você começa hoje e vai até o fim — no seu ritmo, sem pular etapa.
          </Text>
        </Reveal>
      </View>
    </View>
  );
}
