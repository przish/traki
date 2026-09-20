import React from "react";
import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { BlurView } from "expo-blur";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  // Responsive bottom offset that hugs the phone's bottom curvature without awkward floating gaps
  const bottomOffset = Platform.OS === "ios" ? Math.max(insets.bottom ? insets.bottom - 20 : 12, 12) : 12;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#AF2219",
        tabBarInactiveTintColor: isDark ? "#AAA7A5" : "#8B8988",
        tabBarStyle: {
          position: "absolute",
          bottom: bottomOffset,
          left: 16,
          right: 16,
          height: 60,
          borderRadius: 30,
          paddingBottom: 0,
          paddingTop: 0,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
          backgroundColor: "transparent",
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.10,
          shadowRadius: 16,
          overflow: "hidden",
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={Platform.OS === "ios" ? 50 : 0}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? "rgba(27,29,31,0.72)"
                    : "rgba(255,255,255,0.78)",
                },
              ]}
            />
          </View>
        ),
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 4,
          borderRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          lineHeight: 12,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Combat",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="sports-kabaddi" size={size ? Math.min(size, 20) : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: "Ledger",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance-wallet" size={size ? Math.min(size, 20) : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="savings" size={size ? Math.min(size, 20) : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="storefront" size={size ? Math.min(size, 20) : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size ? Math.min(size, 20) : 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
