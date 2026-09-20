import "@/global.css";
import React, { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { TrakiProvider } from "@/src/context/TrakiContext";
import { useFonts } from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ActivityIndicator, Platform, View } from "react-native";
import { useColors } from "@/hooks/use-colors";

// Complete any pending auth session redirect at the module root
WebBrowser.maybeCompleteAuthSession();

// Auth-aware route guard — runs inside AuthProvider so it can read auth state.
// Redirects unauthenticated users to /login, and authenticated users away from
// pre-auth screens, without ever leaving a dead-end blank screen.
function AuthGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything until the initial session check has resolved.
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inAuthScreen =
      segments[0] === "login" ||
      segments[0] === "signUp" ||
      segments[0] === "passCreate" ||
      segments[0] === "resetPassword" ||
      segments[0] === undefined ||          // root index splash
      segments[0] === "index";

    if (!user && inTabsGroup) {
      // User is NOT logged in but is inside tabs — kick them to login.
      router.replace("/login");
    } else if (user && inAuthScreen) {
      // User IS logged in but is still on a pre-auth screen — skip to app.
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments, router]);

  return null;
}

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
        <AuthGuard />
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
        <StatusBar style={colors.background === "#101112" ? "light" : "dark"} />
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
          <AuthProvider>
            <TrakiProvider>
              <AppShell />
            </TrakiProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
