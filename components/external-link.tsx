import { Href, Link } from "expo-router";
import * as Linking from "expo-linking";
import { type ComponentProps } from "react";
import { Platform } from "react-native";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href as Href}
      onPress={async (event) => {
        if (Platform.OS !== "web") {
          event.preventDefault();
          try {
            const canOpen = await Linking.canOpenURL(href);
            if (canOpen) {
              await Linking.openURL(href);
            }
          } catch (e) {
            console.warn("Could not open external URL:", href, e);
          }
        }
      }}
    />
  );
}
