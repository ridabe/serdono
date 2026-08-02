import React from "react";
import { Text, View } from "react-native";
import { HoverLift, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

/**
 * Catálogo de módulos mostrado na landing. `disponivel` reflete o que existe
 * de verdade hoje (PRD §4/§12.2): Jornada Empreendedora (PRD §9), base de
 * conhecimento com 30 artigos + assistente (SDD-21), Retenção de Clientes
 * (PRD §12.5, SDD-54) e a calculadora de precificação — que **não é módulo
 * separado**: ela já está em produção dentro da fase Produto da Jornada
 * (§9.9, SDD-42), e ficou rotulada "em breve" aqui por descuido até
 * 02/08/2026, anunciando como futuro algo já entregue. Tutoriais segue sendo
 * o único compromisso de roadmap ainda não construído.
 */
const modulos = [
  {
    nome: "Jornada Empreendedora",
    tagline: "O coração do Ser Dono",
    body: "As 9 fases guiadas, da escolha do nicho ao negócio girando. A Mary abre uma etapa por vez e só libera a seguinte quando a atual está de pé.",
    disponivel: true,
  },
  {
    nome: "Materiais sobre empreendedorismo",
    tagline: "Para consultar quando a dúvida aparecer",
    body: "Conteúdo curado sobre abrir e gerir negócio, finanças e investimentos — sempre com fonte e data visíveis. Pergunte em português comum e receba a resposta com a origem.",
    disponivel: true,
  },
  {
    nome: "Retenção de Clientes",
    tagline: "Cliente que volta custa menos que cliente novo",
    body: "Sua carteira num lugar só: quem está em dia, quem está esfriando e quem sumiu — calculado pelo ritmo do seu negócio. A Mary escreve a mensagem pra você trazer a pessoa de volta.",
    disponivel: true,
  },
  {
    nome: "Tutoriais",
    tagline: "Ver alguém fazendo antes de fazer",
    body: "Passo a passo prático das tarefas que travam todo mundo: emitir nota, abrir conta PJ, usar cada ferramenta do produto sem medo de errar.",
    disponivel: false,
  },
  {
    nome: "Calculadora de Precificação",
    tagline: "Dentro da Jornada, na fase Produto",
    body: "Aprenda a dar preço de verdade: some seus custos, escolha sua margem e descubra o que sobra no fim do mês — antes de cobrar barato demais e descobrir tarde.",
    disponivel: true,
  },
];

export function ModulesSection({ compact }: { compact: boolean }) {
  return (
    <View
      style={{
        backgroundColor: color.bg.canvas,
        paddingVertical: space[16],
        paddingHorizontal: compact ? space[4] : space[10],
      }}
    >
      <View style={{ maxWidth: content.maxWidthWide, width: "100%", alignSelf: "center" }}>
        <Reveal>
          <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>
            MAIS QUE UM PASSO A PASSO
          </Text>
          <Text style={{ ...type.h1, color: color.bg.brand, marginBottom: space[3] }}>
            Tudo o que falta para você virar dono, no mesmo lugar
          </Text>
          <Text style={{ ...type.bodyLg, color: color.text.secondary, maxWidth: 620, marginBottom: space[10] }}>
            A jornada guiada é o centro — e em volta dela, o que você precisa aprender e calcular para não depender de
            palpite.
          </Text>
        </Reveal>

        <View style={{ flexDirection: compact ? "column" : "row", flexWrap: "wrap", gap: space[4] }}>
          {modulos.map((modulo, i) => (
            <Reveal
              key={modulo.nome}
              delay={motion.revealStagger * (i + 1)}
              style={{ flexBasis: compact ? "100%" : "46%", flexGrow: 1, minWidth: compact ? undefined : 260 }}
            >
              <HoverLift
                style={{
                  backgroundColor: color.bg.surface,
                  borderRadius: radius.lg,
                  overflow: "hidden",
                  height: "100%",
                  shadowColor: "#111827",
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    height: 4,
                    backgroundColor: modulo.disponivel ? color.action.primary : color.border.default,
                  }}
                />
                <View style={{ padding: space[6] }}>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: modulo.disponivel ? color.state.successBg : color.bg.surfaceAlt,
                      borderRadius: radius.full,
                      paddingHorizontal: space[3],
                      paddingVertical: space[1],
                      marginBottom: space[3],
                    }}
                  >
                    <Text
                      style={{
                        ...type.overline,
                        color: modulo.disponivel ? color.state.success : color.text.muted,
                      }}
                    >
                      {modulo.disponivel ? "DISPONÍVEL" : "EM BREVE"}
                    </Text>
                  </View>

                  <Text style={{ ...type.h2, color: color.bg.brand, marginBottom: space[1] }}>{modulo.nome}</Text>
                  <Text style={{ ...type.caption, color: color.action.primaryHover, marginBottom: space[3] }}>
                    {modulo.tagline}
                  </Text>
                  <Text style={{ ...type.body, color: color.text.secondary }}>{modulo.body}</Text>
                </View>
              </HoverLift>
            </Reveal>
          ))}
        </View>
      </View>
    </View>
  );
}
