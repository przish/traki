import { View, Text } from "react-native";
import TextField from "../../components/text-field";
import Logo from "../../components/logo";
import Continue from "../../components/continue";
import { useRouter } from "expo-router";
import BackButton from "../../components/back-button";

export default function PassCreate(){
    const router = useRouter();

    return(
        <View className="bg-white flex-1 items-center p-10 gap-2">
            <BackButton/>
            <Logo/>
            <View className="w-full gap-1">
                <Text>
                    Password
                </Text>
                <TextField/>

                <Text>
                    Re-enter password
                </Text>
                <TextField/>
            </View>
            <Continue/>
        </View>
    )
}