import { View, Text } from "react-native";

export default function OR(){
    return (
        <View className="flex-row items-center">
          <View className="bg-gray-400 flex-1 w-[50%] h-[1] mr-2" />
          <Text>or</Text>
          <View className="bg-gray-400 flex-1 w-[50%] h-[1] ml-2" />
        </View>
    )
}