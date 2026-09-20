import { Image, View } from "react-native"

export default function Logo() {
    return(
        <View className="mt-[84]">                
            <Image
                source={require("../assets/images/logos/traki-logo.png")}
                className="w-[150] h-[150]"
            />
        </View>
    )
}