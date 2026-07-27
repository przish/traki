import { View, Text, TextInput, Pressable } from "react-native"
import React, { useState} from "react"
import Continue from "../../components/continue";
import BackButton from "../../components/back-button";

export default function PasswordCreation() {
    const [text, setText] = useState('');

    return(
        <View className="flex-1 p-10 gap-4 bg-white">
            <View>
                <BackButton/>
            </View>

            <View className="h-full justify-center gap-2">
                <View>
                    <Text className="text-[40px] font-bold text-[#AF2219]">
                        Let’s reset your password
                    </Text>
                </View>

                <View>
                    <Text className="text-[#00000099]">
                        Enter the email address associated with your account, and we’ll send an email with a link to reset your password.
                    </Text>
                </View>

                <View className="flex-row">
                    <View>
                        <Text className="text-[#000000B2] text-lg">
                            Need password help?
                        </Text>
                    </View>
                    <View className="border-b-[1px] border-[#AF2219B2]">
                        <Text className="text-[#AF2219B2] text-lg font-bold"> Chat with us.</Text>
                    </View>
                </View>
                <View>
                    <TextInput 
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Enter your email address here"
                    placeholderTextColor="#AF22194D"
                    className="placeholder:font-black text-xl text-[#AF2219]"/>
                    <View className="h-[1] w-full bg-[#00000066] mt-2"/>
                </View>

                <View className="px-5 mt-5">
                    <Pressable
                        className="p-2 rounded-lg bg-[#AF2219] h-[36] justify-center"
                        onPress={() => {(
                            console.log("link sent")
                            // sent link pero let'
                        )}}
                    >
                        <Text className="text-center text-white font-bold">Send the link</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )
}