import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, Text } from "react-native"

export default function BackButton(){
    return(
        <View className="w-full mt-10">
            <MaterialIcons
                name="arrow-back-ios"
                color={"#AF2219"}
                size={24}
                onPress={() => {
                    console.log("go back to email");
                    router.back();
                    
                }}
            />
        </View>
    )
}