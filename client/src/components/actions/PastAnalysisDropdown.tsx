import React from "react";
import { MotiView } from "moti";
import {
  Box,
  Text,
  Pressable,
  VStack,
  HStack,
} from "@gluestack-ui/themed";

export const PAST_ANALYSIS_SORT_OPTIONS = [
  "Newest First (DEFAULT)",
  "Oldest First",
  "Brand A-Z",
  "Skin Concern",
  "Missing History?",
] as const;

export type PastAnalysisSortOption = (typeof PAST_ANALYSIS_SORT_OPTIONS)[number];

type Props = {
  selectedValue: PastAnalysisSortOption;
  onSelect: (value: PastAnalysisSortOption) => void;
};

const optionMeta: Record<PastAnalysisSortOption, { label: string; hint: string }> = {
  "Newest First (DEFAULT)": {
    label: "Newest First",
    hint: "Show the latest scans first",
  },
  "Oldest First": {
    label: "Oldest First",
    hint: "Show the earliest scans first",
  },
  "Brand A-Z": {
    label: "Brand A-Z",
    hint: "Sort products alphabetically",
  },
  "Skin Concern": {
    label: "Skin Concern",
    hint: "Group by concern tags",
  },
  "Missing History?": {
    label: "Missing History?",
    hint: "Surface items missing detail",
  },
};

export const SortDropdown: React.FC<Props> = ({ selectedValue, onSelect }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -8, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "timing", duration: 220 }}
      style={{
        position: "absolute",
        top: 60,
        right: 0,
        zIndex: 100,
      }}
    >
      <Box
        bg="white"
        borderRadius="$3xl"
        borderWidth={1}
        borderColor="#DFE6EE"
        px="$4"
        py="$4"
        shadowColor="#000"
        shadowOpacity={0.14}
        shadowRadius={14}
        elevation={6}
        minWidth={260}
      >
        <Text
          fontSize="$2xs"
          color="#6D7C8B"
          mb="$1"
          fontFamily="RobotoMedium"
          textTransform="uppercase"
          letterSpacing={0.4}
        >
          Sort By
        </Text>

        <Text
          fontSize="$sm"
          color="#1D2A36"
          mb="$3"
          fontFamily="RobotoMedium"
        >
          Organise your past analysis
        </Text>

        <VStack space="xs">
          {PAST_ANALYSIS_SORT_OPTIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => onSelect(item)}
              borderRadius="$2xl"
              px="$3"
              py="$2"
              bg={item === selectedValue ? "#ECF4FC" : "transparent"}
              borderWidth={item === selectedValue ? 1 : 0}
              borderColor={item === selectedValue ? "#B5D2EE" : "transparent"}
            >
              <HStack alignItems="center" justifyContent="space-between">
                <Box flex={1} pr="$2">
                  <Text
                    fontSize="$md"
                    fontWeight={item === selectedValue ? "$semibold" : "$normal"}
                    color={
                      item === "Missing History?"
                        ? "#C33939"
                        : item === selectedValue
                          ? "#1F4F86"
                          : "#243241"
                    }
                  >
                    {optionMeta[item].label}
                  </Text>

                  <Text
                    fontSize="$xs"
                    color={item === selectedValue ? "#4D6F93" : "#7C8A99"}
                    mt="$0.5"
                  >
                    {optionMeta[item].hint}
                  </Text>
                </Box>

                {item === selectedValue ? (
                  <Box
                    bg="#2F6AA7"
                    borderRadius="$full"
                    minWidth={18}
                    minHeight={18}
                    alignItems="center"
                    justifyContent="center"
                    px="$1"
                  >
                    <Text color="#FFFFFF" fontSize="$2xs" fontFamily="RobotoMedium">
                      OK
                    </Text>
                  </Box>
                ) : null}
              </HStack>
            </Pressable>
          ))}
        </VStack>
      </Box>
    </MotiView>
  );
};