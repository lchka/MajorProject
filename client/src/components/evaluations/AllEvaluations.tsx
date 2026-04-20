import React from "react";
import { Platform, type ImageSourcePropType, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SwipeListView } from "react-native-swipe-list-view";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Image, Pressable, ScrollView, Text, VStack, HStack } from "@gluestack-ui/themed";
import { resolveMediaUrl } from "../../config/api";
import SearchEvaluations from "../general/SearchEvaluations";
import WarningChip, { normalizeWarningStatus } from "../general/WarningChip";
import LoadingScreen from "../loadingscreens/loadingScreen";
import SwitchProfile from "../profile/SwitchProfile";
import { SortDropdown, type PastAnalysisSortOption } from "../actions/PastAnalysisDropdown";
import { useScrollPastThreshold } from "../../hooks/useScrollPastThreshold";

/**
 * AllEvaluations Component
 * 
 * Displays a paginated, searchable, and sortable list of past product evaluations.
 * Features:
 * - Multi-profile support with profile switcher
 * - Search by product name, profile, status, or date
 * - Sort options: newest/oldest first, brand A-Z, skin concern, missing history
 * - Pagination with next/previous navigation
 * - Empty states for no evaluations or no search results
 * - Loading state during data fetch
 * - Animated card entries
 */

// Type for individual evaluation cards
export type EvaluationHistoryCard = {
  evaluationContextId: string;
  productName: string;
  profileName: string;
  createdAt: string;
  status?: string;
  summary?: string;
  imageUri?: string | null;
};

// Type for profile selector
type ProfileSwitcherItem = {
  id: string;
  name: string;
  avatarSource?: ImageSourcePropType;
  isMain?: boolean;
};

// Component props
type AllEvaluationsProps = {
  items: EvaluationHistoryCard[]; // Array of evaluations to display
  loading?: boolean; // Whether data is loading
  onPressItem?: (item: EvaluationHistoryCard) => void; // Callback when evaluation card is tapped
  onDeleteEvaluation?: (evaluationContextId: string) => void; // Callback when evaluation is swiped to delete
  profileSwitcherItems?: ProfileSwitcherItem[]; // Available profiles for switching
  activeProfileId?: string; // Currently selected profile ID
  onSelectProfile?: (profileId: string) => void; // Callback when profile is selected
  onAddProfile?: () => void; // Callback when add profile button is pressed
  onEditProfile?: (profileId?: string) => void; // Callback when edit profile button is pressed
  useExternalScroll?: boolean; // If true, don't render internal ScrollView
  showProfileSwitcher?: boolean; // Whether to show the profile switcher
};

// Pagination constant
// Pagination constant
const ITEMS_PER_PAGE = 7;

/**
 * Formats a date string into a readable local date format.
 * E.g., "2024-03-20" -> "20 Mar 2024"
 */
const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Sorts evaluations based on the selected sort option.
 * Supports:
 * - Newest First (DEFAULT): Most recent evaluations first
 * - Oldest First: Oldest evaluations first
 * - Brand A-Z: Alphabetical by product name
 * - Skin Concern: Sorted by summary/skin concern
 * - Missing History?: Evaluations without summary first
 */
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

// Stylesheet for swipe actions
const styles = StyleSheet.create({
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    width: 80,
    borderRadius: 18,
    marginRight: 2,
  },
});

/**
 * Main component - renders evaluation history with search, sort, and pagination
 */
export default function AllEvaluations({
  items,
  loading = false,
  onPressItem,
  onDeleteEvaluation,
  profileSwitcherItems,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onEditProfile,
  useExternalScroll = false,
  showProfileSwitcher = true,
}: AllEvaluationsProps) {
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === "android" ? Math.max(insets.bottom, 12) : 0;
  // Cache profile switcher items to prevent UI flashing when data updates
  const [cachedSwitcherItems, setCachedSwitcherItems] = React.useState<ProfileSwitcherItem[]>(
    profileSwitcherItems ?? [],
  );
  const hasProfileSwitcher = Boolean(
    (profileSwitcherItems && profileSwitcherItems.length > 0) ||
      cachedSwitcherItems.length > 0,
  );
  const shouldShowSwitcher = showProfileSwitcher && hasProfileSwitcher;
  const effectiveSwitcherItems =
    profileSwitcherItems && profileSwitcherItems.length > 0
      ? profileSwitcherItems
      : cachedSwitcherItems;
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<PastAnalysisSortOption>("Newest First (DEFAULT)");

  // Track scroll position to conditionally apply margin to SwitchProfile
  const { hasScrolled, onScroll, scrollEventThrottle } = useScrollPastThreshold(5);

  // Update cached switcher items when new items arrive
  React.useEffect(() => {
    if (profileSwitcherItems && profileSwitcherItems.length > 0) {
      setCachedSwitcherItems(profileSwitcherItems);
    }
  }, [profileSwitcherItems]);

  // Filter and sort evaluations based on search query and sort option
  const filteredItems = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let results = items;
    
    // Search across product name, profile, summary, status, and date
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

  // Calculate total pages for pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  // Reset to valid page when total pages changes
  React.useEffect(() => {
    setCurrentPage((previous) => {
      const maxPage = Math.max(0, totalPages - 1);
      return previous > maxPage ? maxPage : previous;
    });
  }, [totalPages]);

  // Get the current page's items
  const paginatedItems = React.useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredItems]);

  // Main content - wrapped in Box for consistent padding
  const content = (
    <Box style={{ paddingBottom: androidBottomInset }}>
      {/* Header with title and sort button */}
      <HStack mb="$4" alignItems="center" justifyContent="space-between">
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

      {/* Sort dropdown menu - appears when sort button is tapped */}
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

      {/* Search input for filtering evaluations */}
      <Box mb="$4">
        <SearchEvaluations
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by product, profile, or status"
        />
      </Box>

      {/* Loading state */}
      {loading ? <LoadingScreen compact staged={false} message="Loading history..." /> : null}
      
      {/* Empty state - no evaluations at all */}
      {!loading && items.length === 0 && (
        <Box
          mt="$4"
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
          mt="$4"
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

      {/* Evaluation cards list with pagination */}
      {!loading && filteredItems.length > 0 && (
        <Box>
          <SwipeListView
            data={paginatedItems}
            keyExtractor={(item) => item.evaluationContextId}
            renderItem={({ item, index }) => {
              const status = normalizeWarningStatus(item.status);
              const imageUri = resolveMediaUrl(item.imageUri ?? null);

              return (
                <MotiView
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
                    mb="$3"
                  >
                    <HStack space="md" alignItems="center">
                      {/* Product image thumbnail */}
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

                      {/* Card content - product name, profile, summary */}
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

                    {/* Card footer - date, warning status, and chevron */}
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
            }}
            renderHiddenItem={({ item }) => (
              <View style={styles.deleteAction}>
                <Feather name="trash-2" size={24} color="#FFFFFF" />
              </View>
            )}
            onSwipeValueChange={({ key, value }) => {
              if (value < -80) {
                onDeleteEvaluation?.(key);
              }
            }}
            rightOpenValue={-80}
            scrollEnabled={false}
          />

          {/* Pagination controls - previous/next buttons and page indicator */}
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
        </Box>
      )}
    </Box>
  );

  // If using external scroll, return content with switcher
  if (useExternalScroll) {
    return (
      <>
        {shouldShowSwitcher ? (
          <SwitchProfile
            profiles={effectiveSwitcherItems}
            activeProfileId={activeProfileId}
            onSelectProfile={onSelectProfile}
            onAddProfile={onAddProfile}
            onEditProfile={onEditProfile}
            title="Switch Profile"
            hasScrolled={hasScrolled}
            style={{ marginTop: -20 }}
          />
        ) : null}
        {content}
      </>
    );
  }

  // Otherwise, wrap content in ScrollView with switcher as direct child
  return (
    <ScrollView
      stickyHeaderIndices={shouldShowSwitcher ? [0] : []}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
    >
      {shouldShowSwitcher ? (
        <SwitchProfile
          profiles={effectiveSwitcherItems}
          activeProfileId={activeProfileId}
          onSelectProfile={onSelectProfile}
          onAddProfile={onAddProfile}
          onEditProfile={onEditProfile}
          title="Switch Profile"
          hasScrolled={hasScrolled}
          style={{ marginTop: -20 }}
        />
      ) : null}
      {content}
    </ScrollView>
  );
}