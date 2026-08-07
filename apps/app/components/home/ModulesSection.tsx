import React from "react";
import { Text, View } from "react-native";
import { HoverLift, Reveal, color, content, motion, radius, space, type } from "@serdono/ui";

/**
 * Catálogo mostrado na landing (PRD §12.2).
 *
 * **Reescrito em 02/08/2026 (SDD-55): não existe mais o estado "em breve"
 * nesta seção — porque não existe mais nada listado aqui que não esteja no
 * ar.** O card "Tutoriais" saiu da lista em vez de ser promovido a
 * "disponível": ele é o único item do roadmap do §12.2 ainda não construído,
 * e trocar o rótulo teria transformado uma promessa honesta numa afirmação
 * falsa. Deixar de anunciar o que não existe é diferente de anunciar como
 * pronto — o primeiro é edição, o segundo quebraria o PRD §4 e a RN-2.
 *
 * Todo item abaixo aponta pra código em produção: Jornada (PRD §9),
 * assistente + base curada de 30 artigos (SDD-21/SDD-50), Retenção (SDD-54),
 * Biblioteca (SDD-50), precificação na fase Produto (SDD-42) e o Painel
 * (§12.4). Antes de adicionar um card aqui, o recurso precisa existir.
 */
const modulos = [
  {
    nome: "Jornada Empreendedora",
    tagline: "O coração do Ser Dono",
    body: "As 12 fases guiadas, da escolha do nicho ao negócio girando. A Mary abre uma etapa por vez e só libera a seguinte quando a atual está de pé.",
  },
  {
    nome: "A Mary responde",
    tagline: "Sua mentora, disponível a qualquer hora",
    body: "Pergunte em português comum sobre abrir empresa, MEI, impostos, finanças e investimentos. Ela conhece o seu negócio e responde citando a fonte e a data de cada informação — nunca um palpite sem origem.",
  },
  {
    nome: "Retenção de Clientes",
    tagline: "Cliente que volta custa menos que cliente novo",
    body: "Sua carteira num lugar só: quem está em dia, quem está esfriando e quem sumiu — calculado pelo ritmo do seu negócio. A Mary escreve a mensagem pra você trazer a pessoa de volta.",
  },
  {
    nome: "Calculadora de Precificação",
    tagline: "Dentro da Jornada, na fase Produto",
    body: "Aprenda a dar preço de verdade: some seus custos, escolha sua margem e descubra o que sobra no fim do mês — antes de cobrar barato demais e descobrir tarde.",
  },
  {
    nome: "Biblioteca de Conteúdos",
    tagline: "Pra quando bater a dúvida no meio do caminho",
    body: "Cursos, vídeos, apostilas e dicas práticas sobre tocar um negócio — organizados por tema, pra consultar na hora que a dúvida aparecer.",
  },
  {
    nome: "Painel do Empreendedor",
    tagline: "Seu negócio num relance",
    body: "Nome, marca, progresso, primeira venda, ponto de equilíbrio e clientes conquistados. Todo número vem do que você registrou — nada de estimativa inventada pra encher tela.",
  },
];

export function ModulesSection({ compact }: { compact: boolean }) {
  return (
    <View
      style={{
        backgroundColor: color.bg.canvas,
        paddingVertical: compact ? space[10] : space[16],
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
            A jornada guiada é o centro — e em volta dela, tudo o que você precisa aprender, calcular e acompanhar pra
            não depender de palpite. Está tudo no ar, funcionando, incluído.
          </Text>
        </Reveal>

        {/* `flexWrap: "wrap"` com `flexDirection: "column"` faz cada item
            virar uma coluna nova (sobrepostos na mesma altura, a maioria
            fora da tela) em vez de empilhar — só serve junto de "row". */}
        <View style={{ flexDirection: compact ? "column" : "row", flexWrap: compact ? "nowrap" : "wrap", gap: space[4] }}>
          {modulos.map((modulo, i) => (
            <Reveal
              key={modulo.nome}
              delay={motion.revealStagger * (i + 1)}
              // `flexBasis` segue o eixo principal — em "column" (compact) isso
              // é ALTURA, não largura: "100%" fazia cada card tentar ocupar a
              // altura inteira da pilha. Em coluna, largura total é `width`,
              // sem flexGrow/flexBasis.
              style={compact ? { width: "100%" } : { flexBasis: "46%", flexGrow: 1, minWidth: 260 }}
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
                <View style={{ height: 4, backgroundColor: color.action.primary }} />
                <View style={{ padding: space[6] }}>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: color.state.successBg,
                      borderRadius: radius.full,
                      paddingHorizontal: space[3],
                      paddingVertical: space[1],
                      marginBottom: space[3],
                    }}
                  >
                    <Text style={{ ...type.overline, color: color.state.success }}>DISPONÍVEL</Text>
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
