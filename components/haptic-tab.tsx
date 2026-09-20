import React from "react";
import * as Haptics from "expo-haptics";
import { Platform, Pressable } from "react-native";

export function HapticTab(props: any) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev) => {
        if (Platform.OS === "ios") {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
