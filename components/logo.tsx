import React from "react";
import { Image, View, type StyleProp, type ViewStyle } from "react-native";

export interface LogoProps {
  size?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Logo({ size = 130, className = "mt-4 mb-2", style }: LogoProps) {
  return (
    <View className={`items-center justify-center ${className}`} style={style}>
      <Image
        source={require("../assets/images/logos/traki-logo.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}