import { View, Text } from "react-native"

export default function PasswordCreation() {
    return(
        <View className="flex-1 justify-center">
            <View>
                <Text>
                    Let’s reset your password
                </Text>
            </View>

            <View>
                <Text>
                    Enter the email address associated with your account, and we’ll send an email with a link to reset your password.
                </Text>
            </View>

            <View className="flex-row">
                <View>
                    <Text className="text-[#000000B2] text-lg font-bold">
                        Need password help?
                    </Text>
                </View>
                <View>
                    <Text className="text-[#AF2219B2] text-lg font-bold underline underline-offset-2"> Chat with us.</Text>
                </View>
            </View>
        </View>
    )
}