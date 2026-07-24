import { Pressable, Text, View } from "react-native";
import Logo from "../../components/logo";
import TextField from "../../components/text-field";
import Continue from "../../components/continue";

export default function login() {
  return (
    <View className="flex-1 pt-[84] items-center bg-white p-10">
      <Logo/>

      <View className="w-full gap-1 justify-center items-align">
        <Text className="text-[#AF2219]">
          email
        </Text>

        <TextField/>

        <Text className="text-[#AF2219]">
          password
        </Text>

        <TextField secureTextEntry/>

        <Text className="text-right">
          show password
        </Text>

        <Continue/>
      </View>

      <View className="mt-10">
        <Pressable>
          <Text>
            No account yet? Create here!
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
