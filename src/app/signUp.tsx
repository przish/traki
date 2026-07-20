import { useRouter } from "expo-router";
import { Image, Pressable, Text, TextInput, View } from "react-native";

export default function SignUp() {
  const router = useRouter();
  return (
    <View className="flex-1 pt-[84] items-center bg-white gap-4 p-10">
      <View>
        <Image
          source={require("../.././assets/images/logos/traki-logo.png")}
          className="w-[150] h-[150]"
        />
      </View>

      <View>
        <Text className="text-[#A13024] text-xl font-bold">
          let's start with your email
        </Text>
      </View>

      <View className="w-full gap-2">
        <View className="gap-1">
          <Text className="text-[#A13024]">email</Text>
          <TextInput className="p-2 rounded-lg bg-[#AF221966] border border-solid border-[#A13024]" />
        </View>

        <View className="gap-2">
          <Pressable
            className="p-2 rounded-lg bg-[#A13024]"
            onPress={() => console.log("continue to password creation")}
          >
            <Text className="text-center text-white font-bold">Continue</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center">
          <View className="bg-gray-400 flex-1 w-[50%] h-[1] mr-2" />
          <Text>or</Text>
          <View className="bg-gray-400 flex-1 w-[50%] h-[1] ml-2" />
        </View>
      </View>

      <View className="gap-2 w-full">
        <Pressable
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2"
          onPress={() => {
            console.log("google login API");
            // google pop up
          }}
        >
          <Image
            source={require("../../assets/images/logos/google.png")}
            className="w-5 h-5"
          />
          <Text className="text-center font-bold">Continue with Google</Text>
        </Pressable>

        <Pressable
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2"
          onPress={() => {
            console.log("apple login API");
            // apple pop up
          }}
        >
          <Image
            source={require("../../assets/images/logos/apple-logo.png")}
            className="w-5 h-5"
          />
          <Text className="text-center font-bold">Continue with Apple</Text>
        </Pressable>

        <Pressable
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2"
          onPress={() => {
            console.log("stingray login API");
            // stingray pop up
          }}
        >
          <Image
            source={require("../../assets/images/logos/dev-logo.png")}
            className="w-12 h-5"
          />
          <Text className="text-center font-bold">Continue with Stingray</Text>
        </Pressable>
      </View>

      <View className="mt-10">
        <Pressable
          onPress={() => {
            console.log("login pressed");
            router.push("./login");
          }}
        >
          <Text className="text-[#A13024]">Already have an account?</Text>
        </Pressable>
      </View>
    </View>
  );
}
