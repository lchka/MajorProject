import React from "react";
import type { ImageSourcePropType } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Image, Pressable, Text, VStack, HStack } from "@gluestack-ui/themed";
import { resolveMediaUrl } from "../../config/api";
import WarningChip, { normalizeWarningStatus } from "../general/WarningChip";
import LoadingScreen from "../general/loadingScreen";
import SwitchProfile from "../profile/SwitchProfile";

export type EvaluationHistoryCard = {
  evaluationContextId: string;
  productName: string;
  profileName: string;
  createdAt: string;
  status?: string;
  summary?: string;
  imageUri?: string | null;
};

type ProfileSwitcherItem = {
  id: string;
  name: string;
  avatarSource?: ImageSourcePropType;
  isMain?: boolean;
};

type AllEvaluationsProps = {
  items: EvaluationHistoryCard[];
  loading?: boolean;
  onPressItem?: (item: EvaluationHistoryCard) => void;
  profileSwitcherItems?: ProfileSwitcherItem[];
  activeProfileId?: string;
  onSelectProfile?: (profileId: string) => void;
  onAddProfile?: () => void;
  onEditProfile?: (profileId?: string) => void;
};

const ITEMS_PER_PAGE = 7;

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AllEvaluations({
  items,
  loading = false,
  onPressItem,
  profileSwitcherItems,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onEditProfile,
}: AllEvaluationsProps) {
  const hasProfileSwitcher = Boolean(profileSwitcherItems && profileSwitcherItems.length > 0);
  const [currentPage, setCurrentPage] = React.useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  React.useEffect(() => {
    setCurrentPage((previous) => {
      const maxPage = Math.max(0, totalPages - 1);
      return previous > maxPage ? maxPage : previous;
    });
  }, [totalPages]);

  const paginatedItems = React.useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, items]);

  return (
    <Box px="$2" >
      {hasProfileSwitcher ? (
        <Box mb="$2">
          <SwitchProfile
            profiles={profileSwitcherItems ?? []}
            activeProfileId={activeProfileId}
            onSelectProfile={onSelectProfile}
            onAddProfile={onAddProfile}
            onEditProfile={onEditProfile}
            title="Switch Profile"
          />
        </Box>
      ) : null}

      {/* Header */}
      <HStack mt="$1" mb="$4" alignItems="center" justifyContent="space-between">
        <Text fontSize={22} fontFamily="RobotoMedium" color="#0F172A">
          All Evaluations
        </Text>
        <Ionicons name="time-outline" size={22} color="#64748B" />
      </HStack>

      {/* Loading */}
      {loading ? <LoadingScreen compact staged={false} message="Loading history..." /> : null}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <Box
          mt="$2"
          borderRadius={18}
          p="$5"
          alignItems="center"
          justifyContent="center"
          bg="#F8FBFF"
        >
          <Feather name="clock" size={26} color="#94A3B8" />
          <Text mt="$2" fontSize={15} fontFamily="RobotoMedium" color="#334155">
            No evaluations yet
          </Text>
          <Text mt="$1" fontSize={13} color="#64748B">
            Start scanning to build your history
          </Text>
        </Box>
      )}

      {/* List */}
      {!loading && items.length > 0 && (
        <VStack space="md" pb="$2">
          {paginatedItems.map((item, index) => {
            const status = normalizeWarningStatus(item.status);
            const imageUri = resolveMediaUrl(item.imageUri ?? null);

            return (
              <MotiView
                key={item.evaluationContextId}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 250, delay: index * 40 }}
              >
                <Pressable
                  onPress={() => onPressItem?.(item)}
                  borderRadius={18}
                  bg="white"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  px="$3.5"
                  py="$3.5"
                  shadowColor="#000"
                  shadowOpacity={0.05}
                  shadowRadius={12}
                  elevation={2}
                >
                  <HStack space="md" alignItems="center">
                    {/* Image */}
                    <Box
                      w={60}
                      h={60}
                      borderRadius={14}
                      overflow="hidden"
                      bg="#F1F5F9"
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
                        <Feather name="image" size={18} color="#94A3B8" />
                      )}
                    </Box>

                    {/* Content */}
                    <VStack flex={1} space="xs">
                      <Text
                        numberOfLines={1}
                        fontSize={15}
                        fontFamily="RobotoMedium"
                        color="#0F172A"
                      >
                        {item.productName}
                      </Text>

                      <Text
                        numberOfLines={1}
                        fontSize={12}
                        color="#64748B"
                      >
                        {item.profileName}
                      </Text>

                      {item.summary && (
                        <Text
                          numberOfLines={1}
                          fontSize={12}
                          color="#94A3B8"
                        >
                          {item.summary}
                        </Text>
                      )}
                    </VStack>
                  </HStack>

                  {/* Bottom Row */}
                  <HStack
                    mt="$3"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text fontSize={11} color="#94A3B8">
                      {formatDate(item.createdAt)}
                    </Text>

                    <HStack alignItems="center" space="sm">
                      <WarningChip status={status} />
                      <Feather name="chevron-right" size={16} color="#94A3B8" />
                    </HStack>
                  </HStack>
                </Pressable>
              </MotiView>
            );
          })}

          {totalPages > 1 ? (
            <HStack mt="$2" alignItems="center" justifyContent="space-between">
              <Pressable
                onPress={() => {
                  setCurrentPage((previous) => Math.max(0, previous - 1));
                }}
                disabled={currentPage === 0}
                px="$3"
                py="$1.5"
                borderRadius="$full"
                borderWidth={1}
                borderColor={currentPage === 0 ? "#DCE3EC" : "#BFD0E3"}
                bg={currentPage === 0 ? "#F3F6FA" : "#EAF2FB"}
                opacity={currentPage === 0 ? 0.65 : 1}
              >
                <Text fontSize={12} color="#475569" fontFamily="RobotoMedium">
                  Previous
                </Text>
              </Pressable>

              <Text fontSize={12} color="#64748B" fontFamily="RobotoMedium">
                {`Page ${currentPage + 1} of ${totalPages}`}
              </Text>

              <Pressable
                onPress={() => {
                  setCurrentPage((previous) => Math.min(totalPages - 1, previous + 1));
                }}
                disabled={currentPage === totalPages - 1}
                px="$3"
                py="$1.5"
                borderRadius="$full"
                borderWidth={1}
                borderColor={currentPage === totalPages - 1 ? "#DCE3EC" : "#BFD0E3"}
                bg={currentPage === totalPages - 1 ? "#F3F6FA" : "#EAF2FB"}
                opacity={currentPage === totalPages - 1 ? 0.65 : 1}
              >
                <Text fontSize={12} color="#475569" fontFamily="RobotoMedium">
                  Next
                </Text>
              </Pressable>
            </HStack>
          ) : null}
        </VStack>
      )}
    </Box>
  );
}