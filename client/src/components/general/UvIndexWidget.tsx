import React from "react";
import { Box, Text, HStack, VStack, Pressable } from "@gluestack-ui/themed";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  uvIndex: number;
  recommendation?: string;
  onClose?: () => void;
};

const getUvColor = (uv: number) => {
  if (uv <= 2) return "#22c55e"; // green
  if (uv <= 5) return "#eab308"; // yellow
  if (uv <= 7) return "#f97316"; // orange
  return "#ef4444"; // red
};

const getLabel = (uv: number) => {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  return "Very High";
};

export const UvIndexCard: React.FC<Props> = ({
  uvIndex,
  recommendation = "Wear Sunscreen with 30 SPF",
  onClose,
}) => {
  const uvColor = getUvColor(uvIndex);
  const label = getLabel(uvIndex);

  return (
    <Box
      bg="$backgroundLight0"
      borderRadius="$2xl"
      p="$4"
      borderWidth={1}
      borderColor="$coolGray200"
    >
      <HStack space="md" alignItems="center">
        {/* UV Icon */}
        <Box
          w={70}
          h={70}
          borderRadius={35}
          borderWidth={2}
          borderColor={uvColor}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="$2xl" fontWeight="$bold" color={uvColor}>
            O
          </Text>
          <Text fontWeight="$bold" color={uvColor}>
            UV
          </Text>
        </Box>

        {/* Right Content */}
        <VStack flex={1} space="sm">
          {/* Header */}
          <HStack alignItems="center" justifyContent="space-between">
            <HStack alignItems="center" space="xs">
              <Text color="#ef4444" fontWeight="$bold">
                !
              </Text>
              <Text fontSize="$lg" fontWeight="$semibold">
                UV Index {label}!
              </Text>
            </HStack>

            {onClose && (
              <Pressable onPress={onClose}>
                <Box
                  bg="$red500"
                  w={24}
                  h={24}
                  borderRadius={12}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white">×</Text>
                </Box>
              </Pressable>
            )}
          </HStack>

          {/* Recommendation */}
          <Box
            bg="#fca5a5"
            px="$3"
            py="$2"
            borderRadius="$lg"
            alignSelf="flex-start"
          >
            <Text fontWeight="$medium">{recommendation}</Text>
          </Box>
        </VStack>
      </HStack>

      {/* UV Bar */}
      <Box mt="$4">
        <Box
          h={8}
          borderRadius={999}
          overflow="hidden"
          bg="$coolGray200"
        >
          <LinearGradient
            colors={["#22c55e", "#eab308", "#f97316", "#ef4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Box>

        {/* Indicator */}
        <Box mt="$2" alignItems="center">
          <Box
            position="absolute"
            left={`${Math.min(uvIndex * 10, 100)}%`}
            transform={[{ translateX: -10 }]}
          >
            <Box w={2} h={16} bg="black" />
            <Text mt="$1" fontWeight="$bold">
              {uvIndex.toFixed(1)}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};