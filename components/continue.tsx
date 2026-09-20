import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

export interface ContinueProps {
  onPress?: (event: GestureResponderEvent) => void;
  title?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Continue({
  onPress,
  title = "Continue",
  children,
  disabled = false,
  loading = false,
  variant = "primary",
  className = "",
  style,
}: ContinueProps) {
  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress?.(e);
  };

  const getVariantStyles = (pressed: boolean) => {
    if (variant === "outline") {
      return {
        container: `border border-[#A13024] bg-white ${pressed ? "bg-[#AF221910]" : ""}`,
        text: "text-[#AF2219]",
      };
    }
    if (variant === "secondary") {
      return {
        container: `bg-[#AF221920] border border-[#AF221940] ${pressed ? "bg-[#AF221930]" : ""}`,
        text: "text-[#AF2219]",
      };
    }
    if (variant === "ghost") {
      return {
        container: `bg-transparent ${pressed ? "bg-[#AF221915]" : ""}`,
        text: "text-[#AF2219]",
      };
    }
    // Default primary
    return {
      container: `bg-[#AF2219] ${pressed ? "bg-[#8F1E2C] opacity-90" : ""}`,
      text: "text-white",
    };
  };

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={handlePress}
      style={style}
      className={`h-[44px] rounded-xl px-4 flex-row items-center justify-center w-full shadow-2xs ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      {({ pressed }) => {
        const vStyle = getVariantStyles(pressed);
        return (
          <Pressable
            disabled
            className={`w-full h-full rounded-xl flex-row items-center justify-center ${vStyle.container}`}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={variant === "primary" ? "#FFFFFF" : "#AF2219"}
              />
            ) : children ? (
              children
            ) : (
              <Text className={`text-center font-bold text-base ${vStyle.text}`}>
                {title}
              </Text>
            )}
          </Pressable>
        );
      }}
    </Pressable>
  );
}