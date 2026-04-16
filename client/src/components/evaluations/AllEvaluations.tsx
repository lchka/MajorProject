import React from "react";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Image, Pressable, Text } from "@gluestack-ui/themed";
import { resolveMediaUrl } from "../../config/api";

export type EvaluationHistoryCard = {
  evaluationContextId: string;
  productName: string;
  profileName: string;
  createdAt: string;
  status?: string;
  summary?: string;
  imageUri?: string | null;
};

type AllEvaluationsProps = {
  items: EvaluationHistoryCard[];
  loading?: boolean;
  onPressItem?: (item: EvaluationHistoryCard) => void;
};

const statusColorByValue: Record<string, string> = {
  safe: "#2F8451",
  caution: "#8A6200",
  avoid: "#AF2E2E",
};

const statusBgByValue: Record<string, string> = {
  safe: "#EAF7EF",
  caution: "#FFF5DE",
  avoid: "#FDEBEC",
};

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === "safe" || normalized === "caution" || normalized === "avoid") {
    return normalized;
  }

  return null;
};

export default function AllEvaluations({
  items,
  loading = false,
  onPressItem,
}: AllEvaluationsProps) {
  return (
    <Box>
      <Box mt="$2" mb="$2" flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text fontSize={22} lineHeight={24} fontFamily="RobotoMedium" color="#151515">
          All Evaluations
        </Text>
        <Ionicons name="time-outline" size={24} color="#2B4258" />
      </Box>

      {loading ? (
        <Box py="$6" alignItems="center" borderWidth={1} borderColor="#D9E3EE" bg="#F7FAFD" borderRadius={14}>
          <Text fontSize={14} lineHeight={18} color="#5E7388" fontFamily="RobotoMedium">
            Loading history...
          </Text>
        </Box>
      ) : null}

      {!loading && items.length === 0 ? (
        <Box
          mt="$2"
          borderWidth={1}
          borderColor="#CFE0F2"
          bg="#F4F9FF"
          borderRadius={14}
          p="$4"
          alignItems="center"
          justifyContent="center"
        >
          <Feather name="search" size={22} color="#7099C4" />
          <Text mt="$2" fontSize={14} lineHeight={18} color="#5E7894" fontFamily="RobotoMedium">
            No evaluations yet
          </Text>
          <Text mt="$1" fontSize={12} lineHeight={16} color="#7B93AA" fontFamily="Roboto">
            Start a scan to build your history
          </Text>
        </Box>
      ) : null}

      {!loading ? (
        <Box style={{ gap: 10 }}>
          {items.map((item, index) => {
            const status = normalizeStatus(item.status);
            const badgeColor = status ? statusColorByValue[status] : "#617386";
            const badgeBg = status ? statusBgByValue[status] : "#EEF3F8";
            const imageUri = resolveMediaUrl(item.imageUri ?? null);

            return (
              <MotiView
                key={item.evaluationContextId}
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 220, delay: index * 35 }}
              >
                <Pressable
                  onPress={() => {
                    if (onPressItem) {
                      onPressItem(item);
                    }
                  }}
                  borderWidth={1}
                  borderColor="#D5E2EE"
                  bg="#FFFFFF"
                  borderRadius={16}
                  px="$3"
                  py="$3"
                >
                  <Box flexDirection="row" alignItems="center" style={{ gap: 12 }}>
                    <Box
                      w={58}
                      h={58}
                      borderRadius={12}
                      overflow="hidden"
                      bg="#EFF5FB"
                      borderWidth={1}
                      borderColor="#D8E4EF"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          alt={item.productName}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Feather name="image" size={18} color="#8194A8" />
                      )}
                    </Box>

                    <Box flex={1}>
                      <Text numberOfLines={1} fontSize={15} lineHeight={18} color="#13253A" fontFamily="RobotoMedium">
                        {item.productName}
                      </Text>
                      <Text mt={2} numberOfLines={1} fontSize={12} lineHeight={16} color="#62768A" fontFamily="Roboto">
                        {`Profile: ${item.profileName}`}
                      </Text>
                      {item.summary ? (
                        <Text mt={2} numberOfLines={1} fontSize={12} lineHeight={16} color="#5B6F84" fontFamily="Roboto">
                          {item.summary}
                        </Text>
                      ) : null}
                    </Box>
                  </Box>

                  <Box mt="$2" flexDirection="row" alignItems="center" justifyContent="space-between">
                    <Text fontSize={11} lineHeight={14} color="#75879A" fontFamily="Roboto">
                      {formatDate(item.createdAt)}
                    </Text>

                    <Box flexDirection="row" alignItems="center" style={{ gap: 8 }}>
                      <Box px="$2" py="$0.5" borderRadius={999} bg={badgeBg}>
                        <Text
                          fontSize={11}
                          lineHeight={14}
                          color={badgeColor}
                          fontFamily="RobotoMedium"
                        >
                          {status ? status.toUpperCase() : "UNKNOWN"}
                        </Text>
                      </Box>
                      <Feather name="chevron-right" size={16} color="#62758A" />
                    </Box>
                  </Box>
                </Pressable>
              </MotiView>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}
