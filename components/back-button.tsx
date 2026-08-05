import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, type GestureResponderEvent, Pressable } from "react-native"

type BackButtonProps = {
    onPress?: (event: GestureResponderEvent) => void;
};

export default function BackButton({ onPress }: BackButtonProps) {
    const handlePress = (event: GestureResponderEvent) => {
        if (onPress) return onPress(event);
        router.back();
    };

    return (
        <View className="w-full mt-10">
            <Pressable onPress={handlePress}>
                <MaterialIcons
                    name="arrow-back-ios"
                    color={"#AF2219"}
                    size={24}
                />
            </Pressable>
        </View>
    )
}