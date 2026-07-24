import { Pressable, Text, View } from "react-native";
import Logo from "../../components/logo";
import TextField from "../../components/text-field";
import Continue from "../../components/continue";
import { useRouter } from "expo-router";

export default function login() {
  const router = useRouter();
  return (
    <View className="flex-1 pt-[84] items-center bg-white p-10">
      <Logo/>

      <View className="w-full gap-1 justify-center items-align">
        <Text>
          Email, username, or phone number
        </Text>

        <TextField/>

        <Text>
          password
        </Text>

        <TextField secureTextEntry/>

        <Text className="text-right">
          show password
        </Text>

        <Continue/>
      </View>

      <View className="mt-10">
        <Pressable onPress={() => {
          console.log("account creation pressed")
          router.replace("./signUp")
        }}>
          {({ pressed }) => (
            <Text className={`text-[#A13024] text-sm ${pressed ? "underline" : ""}`}>
              No account yet? Create here!
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
