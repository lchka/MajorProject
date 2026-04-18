import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { Box, Pressable, Text } from "@gluestack-ui/themed";
import ReEvaluateButton from "../Buttons/Re-EvaluateButton";

type ProfileRetakeBannerProps = {
  isVisible: boolean;
  onRetake?: () => void;
};

export default function ProfileRetakeBanner({
  isVisible,
  onRetake,
}: ProfileRetakeBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    if (!isVisible) {
      setIsDismissed(false);
    }
  }, [isVisible]);

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <Box
      mt="$3"
      borderRadius={12}
      borderWidth={1}
      borderColor="#F2D8A5"
      bg="#FFF8EA"
      px="$3"
      py="$3"
      position="relative"
    >
      <Pressable
        position="absolute"
        top="$2"
        right="$2"
        p="$1"
        borderRadius={999}
        onPress={() => setIsDismissed(true)}
      >
        <Feather name="x" size={16} color="#7A5C1A" />
      </Pressable>

      <Box flexDirection="row" alignItems="flex-start" style={{ gap: 10 }}>
        <Box
          w={24}
          h={24}
          borderRadius={12}
          bg="#F2C66D"
          alignItems="center"
          justifyContent="center"
        >
          <Feather name="alert-triangle" size={14} color="#6F4B00" />
        </Box>

        <Box flex={1}>
          <Text fontSize={13} lineHeight={18} color="#5B3F06" fontFamily="RobotoMedium">
            Profile details changed since this analysis.
          </Text>
          <Text mt="$1" fontSize={12} lineHeight={17} color="#7A5C1A" fontFamily="Roboto">
            Your current conditions, allergens, or preferences differ from the profile used in this result.
          </Text>

          {onRetake ? (
            <ReEvaluateButton
              onPress={onRetake}
              width={120}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
