import { View, Text } from "react-native";
import TextField from "../../components/text-field";
import Logo from "../../components/logo";
import Continue from "../../components/continue";

export default function PassCreate(){
    return(
        <View>
            <Logo/>
            <TextField/>
            <Continue/>
        </View>
    )
}