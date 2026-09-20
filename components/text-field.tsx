import { TextInput, type TextInputProps } from "react-native";

export type TextFieldProps = TextInputProps & {
  password?: boolean;
  containerClassName?: string;
};

export default function TextField({
  password = false,
  containerClassName = "",
  className = "",
  style,
  ...props
}: TextFieldProps) {
  return (
    <TextInput
      secureTextEntry={password}
      autoCapitalize="none"
      placeholderTextColor="#AF221980"
      className={`px-3.5 py-2.5 rounded-xl bg-[#AF221915] border border-[#A13024]/50 text-foreground text-sm h-[44px] w-full font-medium ${className}`}
      style={style}
      {...props}
    />
  );
}