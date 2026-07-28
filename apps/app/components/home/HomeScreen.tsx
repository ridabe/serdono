import React from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import { color } from "@serdono/ui";
import { NavBar } from "./NavBar";
import { Hero } from "./Hero";
import { StatsSection } from "./StatsSection";
import { HowItWorks } from "./HowItWorks";
import { ForWhomSection } from "./ForWhomSection";
import { TestimonialSection } from "./TestimonialSection";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";

const COMPACT_BREAKPOINT = 900;

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg.canvas }} contentContainerStyle={{ flexGrow: 1 }}>
      <NavBar compact={compact} />
      <Hero compact={compact} />
      <StatsSection compact={compact} />
      <HowItWorks compact={compact} />
      <ForWhomSection compact={compact} />
      <TestimonialSection compact={compact} />
      <FinalCta compact={compact} />
      <Footer compact={compact} />
    </ScrollView>
  );
}
