import React from "react";
import type { ImageSourcePropType } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Image, Pressable, ScrollView, Text, VStack, HStack } from "@gluestack-ui/themed";
import { resolveMediaUrl } from "../../config/api";
import SearchEvaluations from "../general/SearchEvaluations";
import WarningChip, { normalizeWarningStatus } from "../general/WarningChip";
import LoadingScreen from "../general/loadingScreen";
import SwitchProfile from "../profile/SwitchProfile";
import { SortDropdown, type PastAnalysisSortOption } from "../actions/PastAnalysisDropdown";

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

const sortEvaluations = (
  evaluations: EvaluationHistoryCard[],
  sortOption: PastAnalysisSortOption
): EvaluationHistoryCard[] => {
  const entries = [...evaluations];

  if (sortOption === "Newest First (DEFAULT)") {
    return entries.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }

  if (sortOption === "Oldest First") {
    return entries.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    });
  }

  if (sortOption === "Brand A-Z") {
    return entries.sort((a, b) => a.productName.localeCompare(b.productName));
  }

  if (sortOption === "Skin Concern") {
    return entries.sort((a, b) => (a.summary || "").localeCompare(b.summary || ""));
  }

  if (sortOption === "Missing History?") {
    return entries.sort((a, b) => {
      const aMissing = !a.summary || a.summary.trim().length === 0 ? 0 : 1;
      const bMissing = !b.summary || b.summary.trim().length === 0 ? 0 : 1;
      return aMissing - bMissing;
    });
  }

  return entries;
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<PastAnalysisSortOption>("Newest First (DEFAULT)");

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let results = items;
    
    if (normalizedQuery) {
      results = results.filter((item) => {
        const haystack = [
          item.productName,
          item.profileName,
          item.summary,
          item.status,
          formatDate(item.createdAt),
        ]
          .filter((value): value is string => Boolean(value))
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });
    }

    return sortEvaluations(results, sortOption);
  }, [items, searchQuery, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  React.useEffect(() => {
    setCurrentPage((previous) => {
      const maxPage = Math.max(0, totalPages - 1);
      return previous > maxPage ? maxPage : previous;
    });
  }, [totalPages]);

  const paginatedItems = React.useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredItems]);

  return (
    <ScrollView
      stickyHeaderIndices={hasProfileSwitcher ? [0] : []}
      showsVerticalScrollIndicator={false}
    >
      <Box px="$2" mb="$2">
        {hasProfileSwitcher ? (
          <SwitchProfile
            profiles={profileSwitcherItems ?? []}
            activeProfileId={activeProfileId}
            onSelectProfile={onSelectProfile}
            onAddProfile={onAddProfile}
            onEditProfile={onEditProfile}
            title="Switch Profile"
          />
        ) : null}
      </Box>

      <Box px="$2">
        {/* Header */}
        <HStack mt="$1" mb="$4" alignItems="center" justifyContent="space-between">
        <Text fontSize={22} fontFamily="RobotoMedium" color="#0F172A">
          All Past Analysis
        </Text>
        <Pressable
          onPress={() => setIsSortOpen(!isSortOpen)}
          flexDirection="row"
          alignItems="center"
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#64748B" />
        </Pressable>
      </HStack>

      {/* Click-outside backdrop */}
      {isSortOpen && (
        <Pressable
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          onPress={() => setIsSortOpen(false)}
          zIndex={1}
        />
      )}

      {/* Sort Dropdown */}
      {isSortOpen && (
        <Box mb="$4" zIndex={2}>
          <SortDropdown
            selectedValue={sortOption}
            onSelect={(value) => {
              setSortOption(value);
              setIsSortOpen(false);
            }}
          />
        </Box>
      )}

      <Box mb="$4">
        <SearchEvaluations
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by product, profile, or status"
        />
      </Box>

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

      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <Box
          mt="$2"
          borderRadius={18}
          p="$5"
          alignItems="center"
          justifyContent="center"
          bg="#F8FBFF"
        >
          <Feather name="search" size={24} color="#94A3B8" />
          <Text mt="$2" fontSize={15} fontFamily="RobotoMedium" color="#334155">
            No evaluations match your search
          </Text>
          <Text mt="$1" fontSize={13} color="#64748B">
            Try another product name, profile, or status
          </Text>
        </Box>
      )}

      {/* List */}
      {!loading && filteredItems.length > 0 && (
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
            <VStack my="$4" pb="$5" alignItems="center" space="md">
              <HStack alignItems="center" space="md">
                <Pressable
                  onPress={() => {
                    setCurrentPage((previous) => Math.max(0, previous - 1));
                  }}
                  disabled={currentPage === 0}
                  px="$4"
                  py="$2.5"
                  borderRadius={20}
                  borderWidth={1}
                  borderColor={currentPage === 0 ? "#E2E8F0" : "#BFD0E3"}
                  bg={currentPage === 0 ? "#F8FAFC" : "#EBF2FB"}
                  opacity={currentPage === 0 ? 0.5 : 1}
                >
                  <HStack alignItems="center" space="sm">
                    <Feather
                      name="chevron-left"
                      size={16}
                      color={currentPage === 0 ? "#94A3B8" : "#475569"}
                    />
                    <Text
                      fontSize={13}
                      color={currentPage === 0 ? "#94A3B8" : "#475569"}
                      fontFamily="RobotoMedium"
                    >
                      Previous
                    </Text>
                  </HStack>
                </Pressable>

                <HStack
                  px="$4"
                  py="$2"
                  borderRadius={20}
                  bg="#F1F5F9"
                  alignItems="center"
                >
                  <Text fontSize={12} color="#475569" fontFamily="RobotoMedium">
                    Page{" "}
                  </Text>
                  <Text fontSize={13} color="#0F172A" fontFamily="RobotoMedium">
                    {currentPage + 1}
                  </Text>
                  <Text fontSize={12} color="#475569" fontFamily="RobotoMedium">
                    {" "}of {totalPages}
                  </Text>
                </HStack>

                <Pressable
                  onPress={() => {
                    setCurrentPage((previous) => Math.min(totalPages - 1, previous + 1));
                  }}
                  disabled={currentPage === totalPages - 1}
                  px="$4"
                  py="$2.5"
                  borderRadius={20}
                  borderWidth={1}
                  borderColor={currentPage === totalPages - 1 ? "#E2E8F0" : "#BFD0E3"}
                  bg={currentPage === totalPages - 1 ? "#F8FAFC" : "#EBF2FB"}
                  opacity={currentPage === totalPages - 1 ? 0.5 : 1}
                >
                  <HStack alignItems="center" space="sm">
                    <Text
                      fontSize={13}
                      color={currentPage === totalPages - 1 ? "#94A3B8" : "#475569"}
                      fontFamily="RobotoMedium"
                    >
                      Next
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={currentPage === totalPages - 1 ? "#94A3B8" : "#475569"}
                    />
                  </HStack>
                </Pressable>
              </HStack>
            </VStack>
          ) : null}
        </VStack>
      )}
      </Box>
    </ScrollView>
  );
}