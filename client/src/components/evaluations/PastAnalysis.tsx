import React from "react";
import { Box, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { NavigationProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import { getLocalEvaluations } from "../../services";
import { resolveMediaUrl } from "../../config/api";
import { styles } from "../../style/LandingPageStyle";
import type { AuthStackParamList } from "../../types/navigation";

type AnalysisCard = {
  id: string;
  title: string;
  image?: string | null;
  isPlaceholder?: boolean;
};

type PastAnalysisProps = {
  profileId?: string | null;
  title?: string;
  refreshIntervalMs?: number;
};

export default function PastAnalysis({
  profileId,
  title = "Past Analysis",
  refreshIntervalMs = 3500,
}: PastAnalysisProps) {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const [analysisPage, setAnalysisPage] = React.useState(0);
  const [analysisViewportWidth, setAnalysisViewportWidth] = React.useState(0);
  const [analysisCards, setAnalysisCards] = React.useState<AnalysisCard[]>([]);
  const [analysisLoading, setAnalysisLoading] = React.useState(true);
  const cardsSignatureRef = React.useRef<string>("");

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
      const localEvaluations = await getLocalEvaluations();
      const scopedEvaluations = profileId
        ? localEvaluations.filter((evaluation) => evaluation.profileId === profileId)
        : localEvaluations;

      const cards = scopedEvaluations.map((evaluation) => {
        return {
          id: evaluation.evaluationContextId,
          title: evaluation.productName || "Unknown product",
          image: resolveMediaUrl(evaluation.imageUri) ?? null,
        } satisfies AnalysisCard;
      });

      const nextSignature = JSON.stringify(
        cards.map((card) => ({ id: card.id, title: card.title, image: card.image })),
      );

      if (nextSignature !== cardsSignatureRef.current) {
        cardsSignatureRef.current = nextSignature;
        setAnalysisCards(cards);
      }
    } catch {
      if (cardsSignatureRef.current !== "[]") {
        cardsSignatureRef.current = "[]";
        setAnalysisCards([]);
      }
    }
  }, [profileId]);

  useFocusEffect(
    React.useCallback(() => {
      setAnalysisLoading(true);

      void loadPastAnalysis().finally(() => {
        setAnalysisLoading(false);
      });

      const intervalId = setInterval(() => {
        void loadPastAnalysis();
      }, refreshIntervalMs);

      return () => {
        clearInterval(intervalId);
      };
    }, [loadPastAnalysis, refreshIntervalMs]),
  );

  const analysisPages = React.useMemo(() => {
    const pageSize = 9;
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
  }, [analysisCards]);

  return (
    <>
      <Box my="$2" style={styles.sectionHeader}>
        <Text
          fontSize={22}
          pt="$2"
          lineHeight={22}
          fontFamily="RobotoMedium"
          color="#151515"
        >
          {title}
        </Text>
        <Feather name="more-horizontal" size={28} color="#111111" />
      </Box>

      <Box
        onLayout={(event) => {
          setAnalysisViewportWidth(event.nativeEvent.layout.width);
        }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            if (!analysisViewportWidth) {
              return;
            }

            const pageIndex = Math.round(
              event.nativeEvent.contentOffset.x / analysisViewportWidth,
            );
            setAnalysisPage(pageIndex);
          }}
        >
          {analysisPages.map((pageItems, pageIndex) => (
            <Box
              key={`analysis-page-${pageIndex}`}
              style={[
                styles.analysisPage,
                analysisViewportWidth ? { width: analysisViewportWidth } : null,
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
                    disabled={Boolean(item.isPlaceholder)}
                    onPress={() => {
                      if (item.isPlaceholder) {
                        return;
                      }

                      navigation.navigate("EvaluationResultScreen", {
                        evaluationContextId: item.id,
                      });
                    }}
                  >
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
    </>
  );
}

function PageDots({ total, activeIndex }: { total: number; activeIndex: number }) {
  return (
    <Box style={styles.pageDotsRow}>
      {Array.from({ length: total }).map((_, index) => (
        <Box
          key={`page-dot-${index}`}
          style={[styles.pageDot, index === activeIndex ? styles.pageDotActive : null]}
        />
      ))}
    </Box>
  );
}
