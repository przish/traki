import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 74,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          lineHeight: 14,
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
            <MaterialIcons name="sports-kabaddi" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: "Ledger",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance-wallet" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="savings" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="storefront" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
