import { useRouter } from "expo-router";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import TextField from "../../components/text-field";
import Continue from "../../components/continue";
import Logo from "../../components/logo";
import ORdivider from "../../components/ORdivider"
import LoginMethods from "../../components/LoginMethods";

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
          <Text>Email</Text>
          <TextField/>
        </View>

        <View className="gap-2">
          <Continue onPress={() => {
            console.log("continue to password creation")
            router.push("./passwordCreation")
          }}/>
        </View>

        <ORdivider/>
      </View>

      <LoginMethods/>

      <View className="mt-10">
        <Pressable
          onPress={() => {
            console.log("login pressed");
            router.push("./login");
          }}
        >
          {({ pressed }) => (
            <Text
              className={`text-[#AF2219] text-sm ${pressed ? "underline" : ""}`}
            >
              Already have an account?
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
