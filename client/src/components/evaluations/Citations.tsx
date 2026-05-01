import React from "react";
import { Linking } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Pressable, Text } from "@gluestack-ui/themed";
import type { EvaluationResultJson } from "../../types/evaluationContext.type";
// Component for displaying a list of citation sources associated with a product evaluation. The component accepts an optional resultJson prop that contains an array of citation sources, each with a title, lead author, publication year, and URL. The component uses Moti for smooth fade-in and slide-up animations when rendered, and it displays the citation sources in a styled card format with a header and individual entries for each source. Each entry includes the title, lead author with publication year, and a clickable URL that opens the link in the device's default browser. If there are no citation sources available, it shows a message indicating that no citation data is available.
type CitationsProps = {
  resultJson?: EvaluationResultJson | null;
  index?: number;
};

type CitationSource = {
  title: string;
  lead_author: string;
  year: number | null;
  url: string;
};

export default function Citations({ resultJson, index = 6 }: CitationsProps) {
  const citationSources = React.useMemo(() => {
    const value = resultJson?.citation_sources;
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is CitationSource =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { title?: unknown }).title === "string" &&
        typeof (item as { lead_author?: unknown }).lead_author === "string" &&
        typeof (item as { url?: unknown }).url === "string",
    );
  }, [resultJson]);

  const openLink = React.useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(trimmed);
      if (supported) {
        await Linking.openURL(trimmed);
      }
    } catch {
      // Ignore link opening errors on unsupported platforms/URLs.
    }
  }, []);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 260, delay: 70 + index * 50 }}
    >
      <Box
        mt="$3"
        borderWidth={1}
        borderColor="#E4E6EA"
        bg="#FFFFFF"
        borderRadius={14}
        p="$3"
      >
        <Box flexDirection="row" alignItems="center" mb="$2" style={{ gap: 8 }}>
          <Ionicons name="book-outline" size={20} color="#42586F" />
          <Text
            fontSize={20}
            lineHeight={24}
            color="#202A36"
            fontFamily="RobotoMedium"
          >
            Citations
          </Text>
        </Box>

        {citationSources.length > 0 ? (
          <Box>
            {citationSources.map((source, sourceIndex) => (
              <Box
                key={`${source.title}-${sourceIndex}`}
                borderWidth={1}
                borderColor="#E2E7EE"
                bg="#FAFBFC"
                borderRadius={10}
                p="$2"
                mb={sourceIndex === citationSources.length - 1 ? 0 : 8}
              >
                <Text
                  fontSize={12}
                  lineHeight={16}
                  color="#203145"
                  fontFamily="RobotoMedium"
                >
                  {source.title}
                </Text>
                <Text
                  fontSize={11}
                  lineHeight={15}
                  color="#5D6A79"
                  fontFamily="Roboto"
                  mt={2}
                >
                  {`${source.lead_author}${source.year ? ` (${source.year})` : ""}`}
                </Text>
                <Pressable
                  onPress={() => {
                    void openLink(source.url);
                  }}
                  mt={4}
                >
                  <Text
                    fontSize={11}
                    lineHeight={15}
                    color="#1E6CA8"
                    fontFamily="Roboto"
                  >
                    {source.url}
                  </Text>
                </Pressable>
              </Box>
            ))}
          </Box>
        ) : null}

        {!citationSources.length ? (
          <Text
            fontSize={12}
            lineHeight={16}
            color="#7A838D"
            fontFamily="Roboto"
          >
            No citation data available.
          </Text>
        ) : null}
      </Box>
    </MotiView>
  );
}
