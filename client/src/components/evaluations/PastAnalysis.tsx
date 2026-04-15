import React from "react";
import { Box, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import { evaluationContextService, productService } from "../../services";
import { resolveMediaUrl } from "../../config/api";
import { styles } from "../../style/LandingPageStyle";

type AnalysisCard = {
  id: string;
  title: string;
  image?: string | null;
  isPlaceholder?: boolean;
};

type PastAnalysisProps = {
  profileId?: string | null;
};

export default function PastAnalysis({ profileId }: PastAnalysisProps) {
  const [analysisPage, setAnalysisPage] = React.useState(0);
  const [analysisViewportWidth, setAnalysisViewportWidth] = React.useState(0);
  const [analysisCards, setAnalysisCards] = React.useState<AnalysisCard[]>([]);
  const [analysisLoading, setAnalysisLoading] = React.useState(true);

  React.useEffect(() => {
    setAnalysisPage(0);
  }, [profileId]);

  React.useEffect(() => {
    let isMounted = true;

    const loadPastAnalysis = async () => {
      if (!profileId) {
        if (isMounted) {
          setAnalysisCards([]);
          setAnalysisLoading(false);
        }
        return;
      }

      setAnalysisLoading(true);

      try {
        const contexts = await evaluationContextService.getByProfileId(profileId);
        const productIds = Array.from(new Set(contexts.map((context) => context.productId)));
        const products = await Promise.all(
          productIds.map(async (productId) => {
            try {
              return await productService.getProductById(productId);
            } catch {
              return null;
            }
          }),
        );

        const productMap = new Map(
          products
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((product) => [product.id, product]),
        );

        const cards = contexts.map((context) => {
          const product = productMap.get(context.productId);
          return {
            id: context.id,
            title: product?.name ?? "Unknown product",
            image: resolveMediaUrl(product?.product_image) ?? null,
          } satisfies AnalysisCard;
        });

        if (isMounted) {
          setAnalysisCards(cards);
        }
      } catch {
        if (isMounted) {
          setAnalysisCards([]);
        }
      } finally {
        if (isMounted) {
          setAnalysisLoading(false);
        }
      }
    };

    void loadPastAnalysis();

    return () => {
      isMounted = false;
    };
  }, [profileId]);

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
                >
                  <Box style={styles.analysisImageWrap}>
                    {item.isPlaceholder || !item.image ? (
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
                    {item.isPlaceholder ? null : (
                      <AntDesign name="right" size={14} color="#111111" />
                    )}
                  </Box>
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
