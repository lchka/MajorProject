import React from "react";
import { HStack, Divider, Text, Pressable } from "@gluestack-ui/themed";
import { FontAwesome } from "@expo/vector-icons";

type SocialAuthProps = {
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onGithubPress?: () => void;
};

export default function SocialAuth({
  onGooglePress,
  onApplePress,
  onGithubPress,
}: SocialAuthProps) {
  return (
    <>
      {/* Divider with text */}
      <HStack py="$5" alignItems="center" space="md">
        <Divider flex={1} />

        <Text size="md" color="$textLight500">
          OR CONTINUE WITH
        </Text>

        <Divider flex={1} />
      </HStack>

      {/* Social buttons */}
      <HStack space="md">
        {/* Google */}
        <Pressable
          flex={1}
          borderWidth={1}
          borderColor="$borderLight300"
          borderRadius="$md"
          style={{ paddingVertical: 12 }}
          alignItems="center"
          onPress={onGooglePress}
        >
          <FontAwesome name="google" size={28} />
        </Pressable>

        {/* Apple */}
        <Pressable
          flex={1}
          borderWidth={1}
          borderColor="$borderLight300"
          borderRadius="$md"
          style={{ paddingVertical: 12 }}
          alignItems="center"
          onPress={onApplePress}
        >
          <FontAwesome name="apple" size={28} />
        </Pressable>

        {/* GitHub */}
        {/* <Pressable
          flex={1}
          borderWidth={1}
          borderColor="$borderLight300"
          borderRadius="$md"
          style={{ paddingVertical: 12 }}
          alignItems="center"
          onPress={onGithubPress}
        >
          <FontAwesome name="github" size={28} />
        </Pressable> */}
      </HStack>
    </>
  );
}