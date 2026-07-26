import { Pressable, Text, View } from "react-native";
import Logo from "../../components/logo";
import TextField from "../../components/text-field";
import Continue from "../../components/continue";
import { useRouter } from "expo-router";
import React, {useState} from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ORdivider from "../../components/ORdivider";
import LoginMethods from "../../components/LoginMethods";

export default function login() {
  const router = useRouter();

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View className="flex-1 pt-[84] items-center bg-white p-10 gap-4">
      <Logo/>

      <View>
        <Text className="text-[#AF2219] text-xl font-bold">
          Login
        </Text>
      </View>

      <View className="w-full gap-2 justify-center items-align">
        <View className="gap-1">
            <Text>
            Email, username, or phone number
          </Text>
          <TextField/>
        </View>

        <View className="gap-1">
          <Text>
            password
          </Text>

          <View className="flex-row gap-2 pr-10">
            <TextField secureTextEntry={!showPassword} value={password} onChangeText={setPassword}/>

            <View className="items-end justify-center">
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                onPress={toggleShowPassword}
                size={24}
                color={'#AF2219'}
              />
            </View>
          </View>
        </View>

        <View className="items-center">
          <Pressable onPress={() => {
            console.log("reset password");
            router.push("./resetPassword");
          }}>
            <Text className="text-sm text-[#AF2219]">
              Forgot password?
            </Text>
          </Pressable>
        </View>
        
        <Continue/>

        <ORdivider/>

        <LoginMethods/>
      </View>

      <View className="mt-10">
        <Pressable onPress={() => {
          console.log("account creation pressed")
          router.replace("./signUp")
        }}>
          {({ pressed }) => (
            <Text className={`text-[#A13024] text-sm ${pressed ? "underline" : ""}`}>
              No account yet?
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
