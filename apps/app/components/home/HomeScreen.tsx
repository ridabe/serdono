import React, { useCallback, useRef } from "react";
import {
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { color, space } from "@serdono/ui";
import { NavBar } from "./NavBar";
import { Hero } from "./Hero";
import { MentorSection } from "./MentorSection";
import { StatsSection } from "./StatsSection";
import { JourneySection } from "./JourneySection";
import { ModulesSection } from "./ModulesSection";
import { InvestimentosSection } from "./InvestimentosSection";
import { ForWhomSection } from "./ForWhomSection";
import { PromiseSection } from "./PromiseSection";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";

const COMPACT_BREAKPOINT = 900;

/** Seções que o menu e os CTAs internos podem rolar até. */
export type HomeSection = "mentor" | "jornada" | "modulos" | "paraQuem";

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const sections = useRef<Partial<Record<HomeSection, View | null>>>({});

  const bind = useCallback(
    (section: HomeSection) => (node: View | null) => {
      sections.current[section] = node;
    },
    []
  );

  /**
   * Mede a seção no momento do clique e converte para posição no conteúdo.
   *
   * `measure` é o caminho que funciona nas duas plataformas: o 6º argumento é
   * a posição vertical relativa à janela (react-native-web deriva de
   * `getBoundingClientRect`; no nativo é a posição na tela), então somar o
   * scroll atual dá o destino absoluto dentro do `ScrollView`.
   *
   * Tentativas descartadas: `onLayout` não dispara nessas Views no
   * react-native-web, e o `y` que ele entregaria é relativo ao `offsetParent`,
   * não ao conteúdo rolável — o scroll silenciosamente ia para 0.
   */
  const scrollToSection = useCallback((section: HomeSection) => {
    const node = sections.current[section];
    if (!node || !scrollRef.current) return;
    node.measure((_x, _y, _width, _height, _pageX, pageY) => {
      const target = scrollY.current + pageY - space[6];
      scrollRef.current?.scrollTo({ y: Math.max(target, 0), animated: true });
    });
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      style={{ flex: 1, backgroundColor: color.bg.canvas }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <NavBar compact={compact} onNavigate={scrollToSection} />
      <Hero compact={compact} onSeeHowItWorks={() => scrollToSection("jornada")} />

      <View ref={bind("mentor")}>
        <MentorSection compact={compact} />
      </View>

      <StatsSection compact={compact} />

      <View ref={bind("jornada")}>
        <JourneySection compact={compact} />
      </View>

      <View ref={bind("modulos")}>
        <ModulesSection compact={compact} />
      </View>

      <InvestimentosSection compact={compact} />

      <View ref={bind("paraQuem")}>
        <ForWhomSection compact={compact} />
      </View>

      <PromiseSection compact={compact} />
      <FinalCta compact={compact} />
      <Footer compact={compact} />
    </ScrollView>
  );
}
