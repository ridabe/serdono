const path = require("path");
// `quiet: true` evita que o dotenv 17 escreva uma mensagem "tip" no stdout —
// o workflow de release (SDD-28) captura a saída de `node -e "require('./app.config.js')..."`
// pra ler version/versionCode, e essa linha extra quebraria a captura.
require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

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
    version: "0.1.3",
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
      versionCode: 3,
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
      "expo-video",
      [
        "expo-image-picker",
        {
          photosPermission: "O Ser Dono usa suas fotos para você escolher uma foto de perfil.",
          cameraPermission: "O Ser Dono usa a câmera para você tirar uma foto de perfil.",
        },
      ],
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
      // SDD-28 (SPEC.md §7): gerado via `eas init --account ridabe_2026` em
      // 29/07/2026 — colado manualmente porque a EAS CLI não escreve em
      // app.config.js dinâmico (só em app.json estático).
      eas: {
        projectId: "611b9ff0-7891-4294-890f-d41664b1d192",
      },
    },
    owner: "ridabe_2026",
  },
};
