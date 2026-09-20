import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "react-native": "react-native-web",
      "@": path.resolve(__dirname, "./"),
      "expo-modules-core": path.resolve(__dirname, "./node_modules/expo/node_modules/expo-modules-core"),
    },
  },
  define: {
    __DEV__: "true",
  },
  test: {
    environment: "node",
  },
});
