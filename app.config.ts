import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Traki",
  slug: "traki",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "traki",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.traki.app",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FAF8F6",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    package: "com.traki.app",
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-sqlite",
    "expo-font",
    "expo-image",
    "expo-status-bar",
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
