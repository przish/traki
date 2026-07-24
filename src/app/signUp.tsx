import { useRouter } from "expo-router";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import TextField from "../../components/text-field";
import Continue from "../../components/continue";
import Logo from "../../components/logo";
import ORdivider from "../../components/ORdivider"

export default function SignUp() {
  const router = useRouter();
  return (
    <View className="flex-1 pt-[84] items-center bg-white gap-4 p-10">
      <Logo/>

      <View>
        <Text className="text-[#AF2219] text-xl font-bold">
          let's start with your email
        </Text>
      </View>

      <View className="w-full gap-2">
        <View className="gap-1">
          <Text className="text-[#AF2219]">email</Text>
          <TextField/>
        </View>

        <View className="gap-2">
          <Continue onPress={() => console.log("continue to password creation")}/>
        </View>

        <ORdivider/>
      </View>

      <View className="gap-2 w-full">
        <Pressable
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2 h-[36]"
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
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2 h-[36]"
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
          className="flex-row justify-center gap-2 w-full border border-[#A13024] rounded-lg p-2 h-[36]"
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
          {({ pressed }) => (
            <Text
              className={`text-[#A13024] text-sm ${pressed ? "underline" : ""}`}
            >
              Already have an account?
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
