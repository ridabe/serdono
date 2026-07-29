const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// SDD-14 (SPEC.md): config dinâmica em vez de app.json estático — o mecanismo
// EXPO_PUBLIC_* de inlining via `expo/virtual/env` se mostrou instável no modo
// dev web do SDK 54 (o módulo virtual não é substituído no bundle servido ao
// browser). `extra` + expo-constants é o caminho estabelecido e confiável para
// expor config pública ao app, nativo e web.
module.exports = {
  expo: {
    name: "Ser Dono",
    slug: "serdono",
    scheme: "serdono",
    version: "0.1.0",
    orientation: "portrait",
    icon: "../../img/app-icon/ios-icon-1024.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    backgroundColor: "#0E3A4F",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "br.com.serdono.app",
    },
    android: {
      package: "br.com.serdono.app",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#0E3A4F",
        foregroundImage: "../../img/app-icon/android-adaptive-foreground-432.png",
        backgroundImage: "../../img/app-icon/android-adaptive-background-432.png",
        monochromeImage: "../../img/app-icon/android-adaptive-monochrome-432.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "../../img/favicon/favicon-192.png",
      bundler: "metro",
      output: "static",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          image: "../../img/splash/splash-icone-1024.png",
          backgroundColor: "#0E3A4F",
          resizeMode: "contain",
        },
      ],
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
