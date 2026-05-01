import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Box, HStack, Pressable, Text } from "@gluestack-ui/themed";
// Component for a call-to-action (CTA) button that encourages users to scan their products using AI. The component accepts props for the onPress action and an optional label, which defaults to "Scan your Products with AI". The CTA is styled with a background color, border, and rounded corners to make it visually appealing and attention-grabbing. It includes an icon on the left side to indicate the scanning action and an arrow icon on the right side to suggest forward navigation. The text is styled for clarity and prominence, making it an effective prompt for users to engage with the product scanning feature.
type ProdScanCtaProps = {
  onPress: () => void;
  label?: string;
};

export default function ProdScanCta({
  onPress,
  label = "Scan your Products with AI",
}: ProdScanCtaProps) {
  return (
    <Pressable onPress={onPress}>
      <HStack
        alignItems="center"
        justifyContent="space-between"
        bg="#ebf5ff"
        borderWidth={1}
        borderColor="#D1E2F0"
        borderRadius="$3xl"
        px="$4"
        py="$3"
      >
        <HStack alignItems="center" space="md" flex={1} mr="$3">
          <Box
            w={36}
            h={36}
            borderRadius={18}
            bg="#DDEEFF"
            borderWidth={1}
            borderColor="#CFE2F4"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name="scan-outline" size={18} color="#2B5E96" />
          </Box>
          <Text
            color="#090b0c"
            fontSize="$sm"
            fontWeight="$medium"
            numberOfLines={1}
          >
            {label}
          </Text>
        </HStack>

        <Box
          w={40}
          h={40}
          borderRadius={20}
          bg="#6FA5DA"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Box>
      </HStack>
    </Pressable>
  );
}