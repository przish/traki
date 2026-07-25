import { View, Text, Image, Pressable } from "react-native"

export default function LoginMethods() {
    return(
        <View className="gap-2 w-full">
        <Pressable
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2 h-[36]"
          onPress={() => {
            console.log("google login API");
            // google pop up
          }}
        >
          <Image
            source={require("../assets/images/logos/google.png")}
            className="w-5 h-5"
          />
          <Text className="text-center font-bold">Continue with Google</Text>
        </Pressable>

        <Pressable
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2 h-[36]"
          onPress={() => {
            console.log("apple login API");
            // apple pop up
          }}
        >
          <Image
            source={require("../assets/images/logos/apple-logo.png")}
            className="w-5 h-5"
          />
          <Text className="text-center font-bold">Continue with Apple</Text>
        </Pressable>

        <Pressable
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2 h-[36]"
          onPress={() => {
            console.log("stingray login API");
            // stingray pop up
          }}
        >
          <Image
            source={require("../assets/images/logos/dev-logo.png")}
            className="w-12 h-5"
          />
          <Text className="text-center font-bold">Continue with Stingray</Text>
        </Pressable>
      </View>
    )
    
}