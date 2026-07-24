import { Pressable, Text, type GestureResponderEvent } from "react-native";

type ContinueProps = {
  onPress?: (event: GestureResponderEvent) => void;
};

export default function Continue({ onPress }: ContinueProps){
  return(
        <Pressable
            className="p-2 rounded-lg bg-[#AF2219] h-[36] justify-center"
      onPress={onPress}
          >
            <Text className="text-center text-white font-bold">Continue</Text>
          </Pressable>
    )
}