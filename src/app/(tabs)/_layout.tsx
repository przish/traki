import React from "react";
import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform, StyleSheet, View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { BlurView } from "expo-blur";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#AF2219",
        tabBarInactiveTintColor: isDark ? "#AAA7A5" : "#8B8988",
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 24 : 16,
          left: 16,
          right: 16,
          height: 60,
          borderRadius: 28,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          backgroundColor: "transparent",
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 20,
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
          paddingVertical: 6,
          borderRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          lineHeight: 13,
          marginTop: 1,
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
