import React from "react";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";

type QuickStartPanelProps = {
  profileFirstName?: string;
  preferenceCount: number;
  conditionCount: number;
  allergenCount: number;
  onPressAddPreferences: () => void;
  onPressAddConditions: () => void;
  onPressAddAllergens: () => void;
};

type SetupAction = {
  id: string;
  label: string;
  count: number;
  onPress: () => void;
};

export default function QuickStartPanel({
  profileFirstName,
  preferenceCount,
  conditionCount,
  allergenCount,
  onPressAddPreferences,
  onPressAddConditions,
  onPressAddAllergens,
}: QuickStartPanelProps) {
  const actions = React.useMemo<SetupAction[]>(
    () => [
      {
        id: "preferences",
        label: "Preferences",
        count: preferenceCount,
        onPress: onPressAddPreferences,
      },
      {
        id: "conditions",
        label: "Conditions",
        count: conditionCount,
        onPress: onPressAddConditions,
      },
      {
        id: "allergens",
        label: "Allergens",
        count: allergenCount,
        onPress: onPressAddAllergens,
      },
    ],
    [
      preferenceCount,
      conditionCount,
      allergenCount,
      onPressAddPreferences,
      onPressAddConditions,
      onPressAddAllergens,
    ],
  );

  const completedSteps = actions.filter((item) => item.count > 0).length;
  const progressPercent = Math.round((completedSteps / actions.length) * 100);

  const title = profileFirstName?.trim()
    ? `${profileFirstName}'s setup`
    : "Profile setup";

  return (
    <Box
      borderRadius="$3xl"
      borderWidth={1}
      borderColor="#D5E4F2"
      bg="#F7FBFF"
      p="$4"
    >
      <VStack space="sm">
        <Text fontSize="$lg" fontWeight="$bold" color="#1A3046">
          {title}
        </Text>
        <Text fontSize="$xs" color="#4B647D">
          Complete these basics for more accurate ingredient analysis.
        </Text>
      </VStack>

      <Box mt="$4" mb="$2">
        <HStack justifyContent="space-between" alignItems="center" mb="$2">
          <Text fontSize="$xs" color="#38526B" fontWeight="$semibold">
            Setup progress
          </Text>
          <Text fontSize="$xs" color="#38526B" fontWeight="$semibold">
            {progressPercent}%
          </Text>
        </HStack>
        <Box h={8} borderRadius={999} bg="#DCEAF7" overflow="hidden">
          <Box h={8} w={`${progressPercent}%`} bg="#6EAEE8" />
        </Box>
      </Box>

      <VStack space="sm" mt="$2">
        {actions.map((action) => {
          const isDone = action.count > 0;
          return (
            <Pressable key={action.id} onPress={action.onPress}>
              <HStack
                alignItems="center"
                justifyContent="space-between"
                px="$3"
                py="$3"
                borderRadius="$2xl"
                borderWidth={1}
                borderColor={isDone ? "#9AC7F0" : "#D7E2ED"}
                bg={isDone ? "#EBF6FF" : "#FFFFFF"}
              >
                <Text fontSize="$sm" color="#1F3246" fontWeight="$medium">
                  {action.label}
                </Text>
                <Text
                  fontSize="$xs"
                  px="$2"
                  py="$1"
                  borderRadius="$full"
                  bg={isDone ? "#BDE0FF" : "#EEF2F7"}
                  color="#2E4861"
                >
                  {isDone ? `${action.count} added` : "Add"}
                </Text>
              </HStack>
            </Pressable>
          );
        })}
      </VStack>
    </Box>
  );
}