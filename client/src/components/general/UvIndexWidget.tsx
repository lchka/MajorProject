import React from "react";
import { Box, Text, HStack, VStack, Pressable } from "@gluestack-ui/themed";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  uvIndex: number;
  recommendation?: string;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
};

const getUvColor = (uv: number) => {
  if (uv <= 2) return "#22c55e";
  if (uv <= 5) return "#eab308";
  if (uv <= 7) return "#f97316";
  return "#ef4444";
};

const getLabel = (uv: number) => {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  return "Very High";
};

export const UvIndexCard: React.FC<Props> = ({
  uvIndex,
  recommendation = "Apply SPF 30+ sunscreen",
  title = "Today's UV Forecast",
  subtitle = "Sun exposure guidance",
  onClose,
}) => {
  const safeUv = Number.isFinite(uvIndex) ? uvIndex : 0;
  const uvColor = getUvColor(safeUv);
  const label = getLabel(safeUv);
  const clampedUv = Math.max(0, Math.min(safeUv, 11));

  return (
    <Box
      bg="$backgroundLight0"
      borderRadius="$3xl"
      p="$5"
      borderWidth={1}
      borderColor="$coolGray100"
      shadowColor="#000"
      shadowOpacity={0.05}
      shadowRadius={10}
      elevation={3}
    >
      <VStack mb="$3">
        <Text fontSize="$lg" fontWeight="$bold" color="$coolGray900">
          {title}
        </Text>
        <Text fontSize="$xs" color="$coolGray500">
          {subtitle}
        </Text>
      </VStack>

      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Text fontSize="$sm" color="$coolGray500">
            UV Index
          </Text>
          <Text fontSize="$2xl" fontWeight="$bold">
            {label}
          </Text>
        </VStack>

        <HStack alignItems="center" space="sm">
          <Text fontSize="$3xl" fontWeight="$bold" color={uvColor}>
            {safeUv.toFixed(1)}
          </Text>

          {onClose && (
            <Pressable onPress={onClose}>
              <Box
                bg="$coolGray200"
                w={28}
                h={28}
                borderRadius={14}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontWeight="$bold">×</Text>
              </Box>
            </Pressable>
          )}
        </HStack>
      </HStack>

      {/* Progress Bar */}
      <Box mt="$5">
        <Box h={10} borderRadius={999} overflow="hidden">
          <LinearGradient
            colors={["#22c55e", "#eab308", "#f97316", "#ef4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Box>

        {/* Indicator Dot */}
        <Box
          position="absolute"
          top={-4}
          left={`${(clampedUv / 11) * 100}%`}
          transform={[{ translateX: -8 }]}
        >
          <Box
            w={16}
            h={16}
            borderRadius={8}
            bg="white"
            borderWidth={3}
            borderColor={uvColor}
          />
        </Box>
      </Box>

      {/* Recommendation */}
      <Box
        mt="$5"
        bg="$coolGray100"
        px="$4"
        py="$3"
        borderRadius="$xl"
      >
        <Text fontSize="$sm" color="$coolGray700">
          ☀️ {recommendation}
        </Text>
      </Box>
    </Box>
  );
};