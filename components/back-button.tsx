import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, type GestureResponderEvent, Pressable, StyleSheet } from "react-native"

type BackButtonProps = {
    onPress?: (event: GestureResponderEvent) => void;
};

export default function BackButton({ onPress }: BackButtonProps) {


    return (
        <View className="w-full mt-10">
            <Pressable 
                onPress={() => {
                    console.log("back button pressed")
                    router.back()
                }}
                className="items-center justify-center active:bg-gray-200 overflow-hidden w-12 h-12 rounded-full"
            >
                <MaterialIcons
                    name="arrow-back-ios"
                    color={"#AF2219"}
                    size={24}
                />
            </Pressable>
        </View>
    )
}