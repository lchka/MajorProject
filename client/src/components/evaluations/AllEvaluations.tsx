import React from "react";
import {
  Platform,
  type ImageSourcePropType,
  PanResponder,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import BackButton from "../../components/Buttons/BackButton";
import { MotiView  } from "moti";
// Component for displaying a list of all past evaluations associated with a user's profile, including product name, profile name, evaluation date, status, and an optional summary. The component supports searching and sorting evaluations, pagination for large lists, and swipe-to-delete functionality for individual evaluation entries. It also includes an optional profile switcher at the top for users with multiple profiles, allowing them to filter evaluations by profile. The component uses React state to manage search queries, sorting options, pagination, and the visibility of the profile switcher, and it leverages memoization to optimize filtering and sorting operations on the evaluations list.
import {
  Box,
  Image,
  Pressable,
  ScrollView,
  Text,
  VStack,
  HStack,
} from "@gluestack-ui/themed";
import { resolveMediaUrl } from "../../config/api";
import SearchEvaluations from "../general/SearchEvaluations";
import WarningChip, { normalizeWarningStatus } from "../general/WarningChip";
import LoadingScreen from "../loadingscreens/loadingScreen";
import SwitchProfile from "../profile/SwitchProfile";
import {
  SortDropdown,
  type PastAnalysisSortOption,
} from "../actions/PastAnalysisDropdown";
import { useScrollPastThreshold } from "../../hooks/useScrollPastThreshold";

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
  onDeleteEvaluation?: (evaluationContextId: string) => void;
  profileSwitcherItems?: ProfileSwitcherItem[];
  activeProfileId?: string;
  onSelectProfile?: (profileId: string) => void;
  onAddProfile?: () => void;
  onEditProfile?: (profileId?: string) => void;
  useExternalScroll?: boolean;
  showProfileSwitcher?: boolean;
};

const ITEMS_PER_PAGE = 7;
// How far the card must slide before the button is fully visible
const DELETE_WIDTH = 90;
// Past this point the label flips to "Release!" and letting go deletes
const DELETE_THRESHOLD = -(DELETE_WIDTH * 1.6);

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function SwipeableEvaluationRow({
  item,
  index,
  status,
  imageUri,
  onPress,
  onDelete,
}: {
  item: EvaluationHistoryCard;
  index: number;
  status: string;
  imageUri: string | null;
  onPress: () => void;
  onDelete: () => void;
}) {
  const swipeX = React.useRef(new Animated.Value(0)).current;

  // JS-driven state so we can swap text + icon + colour as the user drags
  const [isPastThreshold, setIsPastThreshold] = React.useState(false);

  React.useEffect(() => {
    const id = swipeX.addListener(({ value }) => {
      setIsPastThreshold(value < DELETE_THRESHOLD);
    });
    return () => swipeX.removeListener(id);
  }, [swipeX]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // Only steal the gesture when the move is clearly horizontal
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 0.8,
      onPanResponderGrant: () => {
        // Kill any running spring so the card tracks the finger immediately
        swipeX.stopAnimation();
      },
      onPanResponderMove: (_, { dx }) => {
        if (dx >= 0) return; // ignore rightward movement
        // Rubber-band resistance beyond the threshold so it never feels runaway
        const rubber =
          dx > DELETE_THRESHOLD
            ? dx
            : DELETE_THRESHOLD + (dx - DELETE_THRESHOLD) * 0.15;
        swipeX.setValue(rubber);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        if (dx < DELETE_THRESHOLD) {
          // User dragged past the point of no return — fly off then delete
          Animated.timing(swipeX, {
            toValue: -500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDelete());
        } else {
          // Not far enough — springy bounce back to rest
          Animated.spring(swipeX, {
            toValue: 0,
            velocity: vx,
            bounciness: 12,
            speed: 14,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Parent ScrollView stole the touch — snap back cleanly
        Animated.spring(swipeX, {
          toValue: 0,
          bounciness: 12,
          speed: 14,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  // Fade the button content in as soon as the card starts moving
  const buttonContentOpacity = swipeX.interpolate({
    inputRange: [-DELETE_WIDTH, -DELETE_WIDTH * 0.3],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    /*
     * No overflow:hidden or border-radius on this wrapper.
     * overflow:hidden would clip the card's shadow AND create the gap.
     * The card itself has borderRadius so it looks correct visually.
     * The red layer is full-width so there is zero gap between it and the card
     * as the card slides across it.
     */
    <Box style={{ position: "relative" }}>
      {/* ── Red layer — full width, same border radius as card, sits behind ── */}
      <Animated.View
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "100%",
          backgroundColor: isPastThreshold ? "#C0160C" : "#FF3B30",
          borderRadius: 18,
          justifyContent: "center",
          alignItems: "flex-end",
          paddingRight: 20,
        }}
      >
        <Animated.View
          style={{
            alignItems: "center",
            width: DELETE_WIDTH,
            opacity: buttonContentOpacity,
          }}
        >
          <Feather
            name={isPastThreshold ? "alert-circle" : "trash-2"}
            size={18}
            color="#FFFFFF"
          />
          <Animated.Text
            style={{
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: "800",
              marginTop: 3,
              textAlign: "center",
            }}
          >
            {isPastThreshold ? "Release!" : "Delete"}
          </Animated.Text>
        </Animated.View>
      </Animated.View>

      {/* ── Card — slides left to uncover the red layer, bounces back ── */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX: swipeX }] }}
      >
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 250, delay: index * 40 }}
        >
          <Pressable
            onPress={onPress}
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
              <VStack flex={1} space="xs">
                <Text
                  numberOfLines={1}
                  fontSize={15}
                  fontFamily="RobotoMedium"
                  color="#0F172A"
                >
                  {item.productName}
                </Text>
                <Text numberOfLines={1} fontSize={12} color="#64748B">
                  {item.profileName}
                </Text>
                {item.summary && (
                  <Text numberOfLines={1} fontSize={12} color="#94A3B8">
                    {item.summary}
                  </Text>
                )}
              </VStack>
            </HStack>
            <HStack mt="$3" alignItems="center" justifyContent="space-between">
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
      </Animated.View>
    </Box>
  );
}

const sortEvaluations = (
  evaluations: EvaluationHistoryCard[],
  sortOption: PastAnalysisSortOption,
): EvaluationHistoryCard[] => {
  const entries = [...evaluations];
  if (sortOption === "Newest First (DEFAULT)") {
    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  if (sortOption === "Oldest First") {
    return entries.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }
  if (sortOption === "Brand A-Z") {
    return entries.sort((a, b) => a.productName.localeCompare(b.productName));
  }
  if (sortOption === "Skin Concern") {
    return entries.sort((a, b) =>
      (a.summary || "").localeCompare(b.summary || ""),
    );
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
  const androidBottomInset =
    Platform.OS === "android" ? Math.max(insets.bottom, 12) : 0;

  const [cachedSwitcherItems, setCachedSwitcherItems] = React.useState<
    ProfileSwitcherItem[]
  >(profileSwitcherItems ?? []);
  const hasProfileSwitcher = Boolean(
    (profileSwitcherItems && profileSwitcherItems.length > 0) ||
      cachedSwitcherItems.length > 0,
  );
  const shouldShowSwitcher = showProfileSwitcher && hasProfileSwitcher;
  const effectiveSwitcherItems =
    profileSwitcherItems && profileSwitcherItems.length > 0
      ? profileSwitcherItems
      : cachedSwitcherItems;

  const [currentPage, setCurrentPage] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<PastAnalysisSortOption>(
    "Newest First (DEFAULT)",
  );

  const { hasScrolled, onScroll, scrollEventThrottle } =
    useScrollPastThreshold(5);

  React.useEffect(() => {
    if (profileSwitcherItems && profileSwitcherItems.length > 0) {
      setCachedSwitcherItems(profileSwitcherItems);
    }
  }, [profileSwitcherItems]);

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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
  );

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

  const content = (
    <Box style={{ paddingBottom: androidBottomInset }}>
      <HStack mb="$4" alignItems="center" space="md">
        <BackButton />
        <Text flex={1} fontSize={22} fontFamily="RobotoMedium" color="#0F172A">
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

      {loading ? (
        <LoadingScreen compact staged={false} message="Loading history..." />
      ) : null}

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

      {!loading && filteredItems.length > 0 && (
        <Box>
          <VStack space="md">
            {paginatedItems.map((item, index) => {
              const status = normalizeWarningStatus(item.status);
              const imageUri = resolveMediaUrl(item.imageUri ?? null);
              return (
                <SwipeableEvaluationRow
                  key={item.evaluationContextId}
                  item={item}
                  index={index}
                  status={status}
                  imageUri={imageUri}
                  onPress={() => onPressItem?.(item)}
                  onDelete={() =>
                    onDeleteEvaluation?.(item.evaluationContextId)
                  }
                />
              );
            })}
          </VStack>

          {totalPages > 1 ? (
            <VStack my="$4" pb="$5" alignItems="center" space="md">
              <HStack alignItems="center" space="md">
                <Pressable
                  onPress={() =>
                    setCurrentPage((previous) => Math.max(0, previous - 1))
                  }
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
                    {" "}
                    of {totalPages}
                  </Text>
                </HStack>

                <Pressable
                  onPress={() =>
                    setCurrentPage((previous) =>
                      Math.min(totalPages - 1, previous + 1),
                    )
                  }
                  disabled={currentPage === totalPages - 1}
                  px="$4"
                  py="$2.5"
                  borderRadius={20}
                  borderWidth={1}
                  borderColor={
                    currentPage === totalPages - 1 ? "#E2E8F0" : "#BFD0E3"
                  }
                  bg={currentPage === totalPages - 1 ? "#F8FAFC" : "#EBF2FB"}
                  opacity={currentPage === totalPages - 1 ? 0.5 : 1}
                >
                  <HStack alignItems="center" space="sm">
                    <Text
                      fontSize={13}
                      color={
                        currentPage === totalPages - 1 ? "#94A3B8" : "#475569"
                      }
                      fontFamily="RobotoMedium"
                    >
                      Next
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={
                        currentPage === totalPages - 1 ? "#94A3B8" : "#475569"
                      }
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
