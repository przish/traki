import "@/global.css";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TrakiProvider } from "@/src/context/TrakiContext";
import { useFonts } from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ActivityIndicator, Platform, View } from "react-native";
import { useColors } from "@/hooks/use-colors";

function AppShell() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isWeb
          ? colors.background === "#101112"
            ? "#0A0B0C"
            : "#FAF8F6"
          : colors.background,
        alignItems: isWeb ? "center" : "stretch",
        justifyContent: isWeb ? "center" : "flex-start",
      }}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: isWeb ? 480 : undefined,
          backgroundColor: colors.background,
          shadowColor: isWeb ? "#000000" : undefined,
          shadowOffset: isWeb ? { width: 0, height: 8 } : undefined,
          shadowOpacity: isWeb ? 0.15 : undefined,
          shadowRadius: isWeb ? 24 : undefined,
          overflow: "hidden",
        }}
      >
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signUp" />
          <Stack.Screen name="passCreate" />
          <Stack.Screen name="resetPassword" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="quick-log"
            options={{
              presentation: "modal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...(MaterialIcons.font || {}),
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAF8F6",
        }}
      >
        <ActivityIndicator size="large" color="#AF2219" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <TrakiProvider>
            <AppShell />
          </TrakiProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
