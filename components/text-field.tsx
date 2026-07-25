import { TextInput, type TextInputProps } from "react-native";

type TextFieldProps = TextInputProps & { password?: boolean
    
};
export default function TextField({
    password = false,
    ...props
}: TextFieldProps) {
    return(
        <TextInput 
        secureTextEntry={password}
        autoCapitalize="none"
        keyboardType="email-address"
        className="p-2 rounded-lg bg-[#AF221966] border border-solid border-[#A13024] h-[36]" 
        {...props}
        />
    )
}