import React from "react";
import { useWindowDimensions } from "react-native";
import { Box, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  SortDropdown,
  type PastAnalysisSortOption,
} from "../actions/PastAnalysisDropdown";
import WarningChip from "../general/WarningChip";
import {
  getLocalEvaluations,
  subscribeLocalEvaluations,
  type LocalEvaluation,
  evaluationContextService,
  productService,
  profileService,
  getDeletedEvaluationIds,
  removeLocalEvaluationById,
} from "../../services";
import { resolveMediaUrl } from "../../config/api";
import { styles } from "../../style/LandingPageStyle";
import type { AuthStackParamList } from "../../types/navigation";
import type { EvaluationContext } from "../../types/evaluationContext.type";
import type { Product } from "../../services/productService";
import type { Profile } from "../../services/profileService";

const DEFAULT_SORT_OPTION: PastAnalysisSortOption = "Newest First (DEFAULT)";
// Utility function to convert a date string to a timestamp for sorting purposes. The function attempts to parse the input string as a date and returns the corresponding timestamp in milliseconds. If the input string cannot be parsed as a valid date, it returns 0, which can be used as a fallback value in sorting operations.
const toTimestamp = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

const getSkinConcernKey = (evaluation: LocalEvaluation): string => {
  const matchedConditions = toStringArray(evaluation.resultJson.matched_conditions);
  const profileConditions = toStringArray(evaluation.resultJson.profile_conditions);
  return (matchedConditions[0] ?? profileConditions[0] ?? "").toLowerCase();
};
// Utility function to determine the risk rank of a product evaluation based on its status. The function normalizes the status string and assigns a numerical rank for sorting purposes, where 0 represents low risk, 1 represents moderate risk, 2 represents high risk, and 3 represents unknown or unrecognized statuses. This ranking can be used to sort evaluations by their associated skin concern risk levels in the Past Analysis component.
const getRiskRank = (evaluation: LocalEvaluation): number => {
  const normalizedStatus =
    typeof evaluation.resultJson.status === "string"
      ? evaluation.resultJson.status.trim().toLowerCase()
      : "";

  if (normalizedStatus === "safe" || normalizedStatus === "low risk" || normalizedStatus === "low-risk") {
    return 0;
  }

  if (normalizedStatus === "caution" || normalizedStatus === "medium risk" || normalizedStatus === "moderate risk") {
    return 1;
  }

  if (normalizedStatus === "avoid" || normalizedStatus === "high risk" || normalizedStatus === "high-risk") {
    return 2;
  }

  return 3;
};
// Utility function to determine if a product evaluation is missing historical data based on the presence of key information in the evaluation result. The function checks for the existence of a summary, matched conditions, profile conditions, matched allergens, profile allergens, matched preferences, and profile preferences. If all of these fields are absent or empty, the function returns true, indicating that the evaluation may be missing historical context or data that could be relevant for understanding the evaluation results. This can be used to sort evaluations in the Past Analysis component by whether they have complete historical information or not.
const isMissingHistory = (evaluation: LocalEvaluation): boolean => {
  const hasSummary = typeof evaluation.resultJson.summary === "string" && evaluation.resultJson.summary.trim().length > 0;
  const hasConditionSignals =
    toStringArray(evaluation.resultJson.matched_conditions).length > 0 ||
    toStringArray(evaluation.resultJson.profile_conditions).length > 0;
  const hasAllergenSignals =
    toStringArray(evaluation.resultJson.matched_allergens).length > 0 ||
    toStringArray(evaluation.resultJson.profile_allergens).length > 0;
  const hasPreferenceSignals =
    toStringArray(evaluation.resultJson.matched_preferences).length > 0 ||
    toStringArray(evaluation.resultJson.profile_preferences).length > 0;

  return !hasSummary && !hasConditionSignals && !hasAllergenSignals && !hasPreferenceSignals;
};

const sortEvaluations = (
  evaluations: LocalEvaluation[],
  sortOption: PastAnalysisSortOption,
): LocalEvaluation[] => {
  const entries = [...evaluations];

  if (sortOption === "Oldest First") {
    return entries.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
  }

  if (sortOption === "Brand A-Z") {
    return entries.sort((a, b) =>
      a.productName.localeCompare(b.productName, undefined, { sensitivity: "base" }),
    );
  }

  if (sortOption === "Skin Concern") {
    return entries.sort((a, b) => {
      const riskCompare = getRiskRank(a) - getRiskRank(b);
      if (riskCompare !== 0) {
        return riskCompare;
      }

      const concernCompare = getSkinConcernKey(a).localeCompare(getSkinConcernKey(b));
      if (concernCompare !== 0) {
        return concernCompare;
      }

      return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    });
  }

  if (sortOption === "Missing History?") {
    return entries.sort((a, b) => {
      const aMissing = isMissingHistory(a);
      const bMissing = isMissingHistory(b);

      if (aMissing !== bMissing) {
        return aMissing ? -1 : 1;
      }

      return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    });
  }

  return entries.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
};
// React component for displaying a user's past product evaluations in a paginated, horizontally scrollable format. The component fetches evaluation data from local storage and the server, reconciles any differences, and allows users to sort their evaluations by various criteria such as date, brand name, skin concern, or completeness of historical data. Each evaluation is displayed as a card with an image, product name, and status indicator, and users can tap on a card to view detailed results or start a new analysis by tapping on a placeholder card. The component also handles loading states and updates in real-time when local evaluations change.
type AnalysisCard = {
  id: string;
  title: string;
  image?: string | null;
  status?: string | null;
  isPlaceholder?: boolean;
  isLoadingPlaceholder?: boolean;
};

type PastAnalysisProps = {
  profileId?: string | null;
  profileName?: string | null;
  title?: string;
};

export default function PastAnalysis({
  profileId,
  profileName,
  title = "Past Analysis",
}: PastAnalysisProps) {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { width: windowWidth } = useWindowDimensions();
  const [analysisPage, setAnalysisPage] = React.useState(0);
  const [analysisViewportWidth, setAnalysisViewportWidth] = React.useState(0);
  const [analysisCards, setAnalysisCards] = React.useState<AnalysisCard[]>([]);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<PastAnalysisSortOption>(DEFAULT_SORT_OPTION);

  React.useEffect(() => {
    setAnalysisPage(0);
  }, [profileId]);

  React.useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(analysisCards.length / 9));
    if (analysisPage > pageCount - 1) {
      setAnalysisPage(Math.max(0, pageCount - 1));
    }
  }, [analysisCards.length, analysisPage]);

  const loadPastAnalysis = React.useCallback(async () => {
    try {
      let evaluations: LocalEvaluation[] = [];

      const [localEvaluations, deletedIds] = await Promise.all([
        getLocalEvaluations(),
        getDeletedEvaluationIds(),
      ]);
      const deletedSet = new Set(deletedIds);

      // First, try loading from local storage
      const scopedLocal = profileId
        ? localEvaluations.filter((evaluation) => evaluation.profileId === profileId)
        : localEvaluations;

      evaluations = scopedLocal.filter(
        (evaluation) => !deletedSet.has(evaluation.evaluationContextId),
      );

      // Always fetch from server and reconcile local cache
      try {
        const [contexts, myProfiles] = await Promise.all([
          evaluationContextService.getMyContexts(),
          profileService.getMyProfile(),
        ]);

        const scopedContexts = profileId
          ? contexts.filter((context) => context.profileId === profileId)
          : contexts;

        const filteredContexts = scopedContexts.filter(
          (context) => !deletedSet.has(context.id),
        );

        const serverIds = new Set(filteredContexts.map((context) => context.id));
        const staleLocal = scopedLocal.filter(
          (evaluation) => !serverIds.has(evaluation.evaluationContextId),
        );

        if (staleLocal.length > 0) {
          await Promise.all(
            staleLocal.map((evaluation) =>
              removeLocalEvaluationById(evaluation.evaluationContextId),
            ),
          );
        }

        if (filteredContexts.length > 0) {
          const uniqueProductIds = Array.from(
            new Set(filteredContexts.map((context) => context.productId)),
          );
          const profileMap = new Map<string, Profile>(
            myProfiles.map((profile) => [profile.id, profile]),
          );

          const products = await Promise.all(
            uniqueProductIds.map(async (productId) => {
              try {
                return await productService.getProductById(productId);
              } catch {
                return null;
              }
            }),
          );

          const productMap = new Map<string, Product>(
            products
              .filter((item): item is Product => Boolean(item))
              .map((product) => [product.id, product]),
          );

          // Convert EvaluationContext to LocalEvaluation format
          evaluations = filteredContexts.map((context: EvaluationContext) => {
            const product = productMap.get(context.productId);
            const profile = profileMap.get(context.profileId);

            return {
              evaluationContextId: context.id,
              profileId: context.profileId,
              productId: context.productId,
              promptId: context.promptId,
              resultJson: context.resultJson,
              productName: product?.name ?? "Unknown product",
              profileName: profile?.first_name?.trim() || "Unknown profile",
              imageUri: product?.product_image ?? null,
              createdAt: context.createdAt,
            } satisfies LocalEvaluation;
          });
        }
      } catch (serverError) {
        console.warn("[PastAnalysis] Failed to fetch from server:", serverError);
        // Continue with local evaluations
      }

      const sortedEvaluations = sortEvaluations(evaluations, sortOption);

      const cards = sortedEvaluations.map((evaluation) => {
        return {
          id: evaluation.evaluationContextId,
          title: evaluation.productName || "Unknown product",
          image: resolveMediaUrl(evaluation.imageUri) ?? null,
          status: typeof evaluation.resultJson.status === "string" ? evaluation.resultJson.status : null,
        } satisfies AnalysisCard;
      });

      setAnalysisCards(cards);
    } catch {
      setAnalysisCards([]);
    }
  }, [profileId, sortOption]);

  React.useEffect(() => {
    if (analysisCards.length === 0) {
      setAnalysisLoading(true);
    }

    void loadPastAnalysis().finally(() => {
      setAnalysisLoading(false);
    });
  }, [analysisCards.length, loadPastAnalysis]);

  React.useEffect(() => {
    return subscribeLocalEvaluations(() => {
      void loadPastAnalysis();
    });
  }, [loadPastAnalysis]);

  const analysisPages = React.useMemo(() => {
    const pageSize = 9;

    if (analysisLoading) {
      const loadingItems: AnalysisCard[] = Array.from({ length: pageSize }).map((_, index) => ({
        id: `loading-${index}`,
        title: "",
        image: null,
        isLoadingPlaceholder: true,
      }));

      return [loadingItems];
    }

    const pageCount = Math.max(1, Math.ceil(analysisCards.length / pageSize));

    return Array.from({ length: pageCount }, (_, pageIndex) => {
      const sliceStart = pageIndex * pageSize;
      const pageItems = analysisCards.slice(sliceStart, sliceStart + pageSize);
      const placeholders: AnalysisCard[] = Array.from({
        length: Math.max(0, pageSize - pageItems.length),
      }).map((_, placeholderIndex) => ({
        id: `placeholder-${pageIndex}-${placeholderIndex}`,
        title: "",
        image: null,
        isPlaceholder: true,
      }));

      return [...pageItems, ...placeholders];
    });
  }, [analysisCards, analysisLoading]);

  const updateAnalysisPageFromOffset = React.useCallback((offsetX: number) => {
    const effectiveViewportWidth = analysisViewportWidth || windowWidth;
    if (!effectiveViewportWidth) {
      return;
    }

    const pageIndex = Math.round(offsetX / effectiveViewportWidth);
    setAnalysisPage((previous) => (previous === pageIndex ? previous : pageIndex));
  }, [analysisViewportWidth, windowWidth]);

  const effectivePageWidth = analysisViewportWidth || windowWidth;
  const headerFirstName = profileName?.trim() || "";
  const possessiveLabel = /s$/i.test(headerFirstName)
    ? `${headerFirstName}'`
    : `${headerFirstName}'s`;

  return (
    <Box position="relative">
      {isSortOpen ? (
        <Pressable
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={90}
          onPress={() => {
            setIsSortOpen(false);
          }}
        />
      ) : null}

      <Box my="$2" style={styles.sectionHeader} position="relative">
        <Text
          fontSize={22}
          pt="$2"
          lineHeight={22}
          fontFamily="RobotoMedium"
          color="#151515"
        >
          {headerFirstName ? (
            <Text fontSize={22} lineHeight={22} fontFamily="RobotoMedium" color="#1dd2d8">
              {possessiveLabel}{" "}
            </Text>
          ) : null}
          {title}
        </Text>
        <Pressable
          onPress={() => {
            setIsSortOpen((previous) => !previous);
          }}
          p="$1"
          borderRadius="$full"
        >
          <Feather name="more-horizontal" size={28} color="#111111" />
        </Pressable>

        {isSortOpen ? (
          <SortDropdown
            selectedValue={sortOption}
            onSelect={(nextOption) => {
              setSortOption(nextOption);
              setAnalysisPage(0);
              setIsSortOpen(false);
            }}
          />
        ) : null}
      </Box>

      <Box
        onLayout={(event) => {
          setAnalysisViewportWidth(event.nativeEvent.layout.width);
        }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => {
            setIsSortOpen(false);
          }}
          onScroll={(event) => {
            updateAnalysisPageFromOffset(event.nativeEvent.contentOffset.x);
          }}
          onMomentumScrollEnd={(event) => {
            updateAnalysisPageFromOffset(event.nativeEvent.contentOffset.x);
          }}
        >
          {analysisPages.map((pageItems, pageIndex) => (
            <Box
              key={`analysis-page-${pageIndex}`}
              style={[
                styles.analysisPage,
                { width: effectivePageWidth },
              ]}
            >
              <Box style={styles.grid}>
                {pageItems.map((item, cardIndex) => (
                  <Pressable
                    key={`${item.id}-${pageIndex}-${cardIndex}`}
                    style={[
                      styles.analysisCard,
                      item.isPlaceholder ? styles.analysisPlaceholder : null,
                    ]}
                    onPress={() => {
                      setIsSortOpen(false);

                      if (item.isLoadingPlaceholder) {
                        return;
                      }

                      if (item.isPlaceholder) {
                        navigation.navigate(
                          "CameraScreen",
                          profileId ? { profileId } : undefined,
                        );
                        return;
                      }

                      navigation.navigate("EvaluationResultScreen", {
                        evaluationContextId: item.id,
                      });
                    }}
                  >
                    {item.isLoadingPlaceholder ? (
                      <MotiView
                        from={{ opacity: 0.45 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "timing", duration: 700, loop: true, repeatReverse: true }}
                        style={{
                          flex: 1,
                          borderRadius: 14,
                          backgroundColor: "#DCE3EA",
                        }}
                      />
                    ) : (
                      <>
                        <Box style={styles.analysisImageWrap}>
                          {item.isPlaceholder ? (
                            <Box style={styles.analysisImagePlaceholderPromptWrap}>
                              <Box style={styles.analysisPlaceholderIconWrap}>
                                <Feather name="camera" size={14} color="#FFFFFF" />
                              </Box>
                              <Text
                                textAlign="center"
                                fontSize={14}
                                lineHeight={18}
                                fontFamily="RobotoMedium"
                                color="#4A86C6"
                                mt="$1"
                              >
                                Scan product
                              </Text>
                              <Text
                                textAlign="center"
                                fontSize={11}
                                lineHeight={14}
                                fontFamily="Roboto"
                                color="#5F7FA5"
                                mt="$1"
                              >
                                Tap to analyse{"\n"}skincare
                              </Text>
                            </Box>
                          ) : !item.image ? (
                            <Box style={styles.analysisImagePlaceholder} />
                          ) : (
                            <Image
                              source={{ uri: item.image }}
                              style={styles.analysisImage}
                              resizeMode="cover"
                              alt={item.title || "Past analysis product"}
                              onError={() => {
                                console.warn("[PastAnalysis] Failed to load image", item.image);
                              }}
                            />
                          )}

                          {!item.isPlaceholder ? (
                            <Box position="absolute" left={12} bottom={8}>
                              <WarningChip status={item.status} />
                            </Box>
                          ) : null}
                        </Box>
                        {item.isPlaceholder ? null : (
                          <Box style={styles.cardFooter}>
                            <Text
                              numberOfLines={1}
                              style={styles.cardTitle}
                              pt="$1"
                              fontWeight={600}
                              fontSize={14}
                              lineHeight={12}
                              fontFamily="Roboto"
                              color="#121212"
                            >
                              {item.title}
                            </Text>
                            <AntDesign name="right" size={14} color="#111111" />
                          </Box>
                        )}
                      </>
                    )}
                  </Pressable>
                ))}
              </Box>
            </Box>
          ))}
        </ScrollView>
        {analysisLoading ? null : (
          <PageDots total={analysisPages.length} activeIndex={analysisPage} />
        )}
      </Box>
    </Box>
  );
}

function PageDots({ total, activeIndex }: { total: number; activeIndex: number }) {
  return (
    <Box style={styles.pageDotsRow}>
      {Array.from({ length: total }).map((_, index) => (
        <MotiView
          key={`page-dot-${index}`}
          from={{
            width: index === activeIndex ? 14 : 6,
            opacity: index === activeIndex ? 1 : 0.65,
            transform: [{ scale: index === activeIndex ? 1 : 0.92 }],
            backgroundColor: index === activeIndex ? "#556575" : "#B8C3CC",
          }}
          animate={{
            width: index === activeIndex ? 14 : 6,
            opacity: index === activeIndex ? 1 : 0.65,
            transform: [{ scale: index === activeIndex ? 1 : 0.92 }],
            backgroundColor: index === activeIndex ? "#556575" : "#B8C3CC",
          }}
          transition={{ type: "timing", duration: 240 }}
          style={[styles.pageDot, index === activeIndex ? styles.pageDotActive : null]}
        />
      ))}
    </Box>
  );
}
