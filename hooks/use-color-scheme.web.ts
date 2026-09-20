import { useContext } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { useThemeContext } from "@/lib/theme-provider";

/**
 * On web, read from ThemeContext so toggling in settings updates immediately,
 * falling back gracefully to system color scheme if called outside provider.
 */
export function useColorScheme() {
  try {
    const context = useThemeContext();
    return context.colorScheme;
  } catch {
    const system = useRNColorScheme();
    return system === "dark" ? "dark" : "light";
  }
}
