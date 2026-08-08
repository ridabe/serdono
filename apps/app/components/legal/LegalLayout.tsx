import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Logo, color, content, space, type } from "@serdono/ui";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  intro?: string;
  sections: LegalSection[];
}

export function LegalLayout({ title, updatedAt, intro, sections }: LegalLayoutProps) {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg.canvas }} contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space[5],
          paddingVertical: space[4],
          borderBottomWidth: 1,
          borderBottomColor: color.border.default,
          backgroundColor: color.bg.surface,
        }}
      >
        <Logo size={28} />
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Início</Text>
        </Pressable>
      </View>

      <View style={{ alignItems: "center", paddingHorizontal: space[4], paddingVertical: space[10] }}>
        <View style={{ width: "100%", maxWidth: content.maxWidth }}>
          <Text style={{ ...type.display, fontSize: 28, lineHeight: 34, color: color.bg.brand, marginBottom: space[2] }}>
            {title}
          </Text>
          <Text style={{ ...type.caption, marginBottom: space[6] }}>Última atualização: {updatedAt}</Text>

          {intro ? (
            <Text style={{ ...type.bodyLg, color: color.text.secondary, marginBottom: space[8] }}>{intro}</Text>
          ) : null}

          {sections.map((section) => (
            <View key={section.heading} style={{ marginBottom: space[8] }}>
              <Text style={{ ...type.h2, color: color.bg.brand, marginBottom: space[3] }}>{section.heading}</Text>
              {section.paragraphs.map((paragraph, i) => (
                <Text
                  key={i}
                  style={{ ...type.body, color: color.text.secondary, marginBottom: space[3], lineHeight: 22 }}
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
