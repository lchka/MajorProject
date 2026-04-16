import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";
import AllPreferences from "../preferences/AllPreferences";
import AllConditions from "../conditions/AllConditions";
import AllAllergens from "../allergens/AllAllergens";

type ProfileSignalsProps = {
  matchedAllergens: string[];
  matchedConditions: string[];
  matchedPreferences: string[];
  index?: number;
};

type SignalType = "allergen" | "condition" | "preference";

function SignalGroup({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: SignalType;
}) {
  const renderPreferences = () => (
    <AllPreferences
      preferences={items.map((name) => ({ name }))}
      variant="chips"
    />
  );

  const renderConditions = () => (
    <AllConditions
      conditions={items.map((name) => ({ name }))}
      variant="chips"
    />
  );

  const renderAllergens = () => (
    <AllAllergens
      allergens={items.map((name) => ({ name }))}
      variant="chips"
    />
  );

  return (
    <Box>
      <Text
        fontSize={16}
        lineHeight={20}
        color="#57677A"
        fontFamily="Roboto"
        mb="$2"
      >
        {title}
      </Text>

      {items.length ? (
        type === "condition" ? (
          renderConditions()
        ) : type === "preference" ? (
          renderPreferences()
        ) : type === "allergen" ? (
          renderAllergens()
        ) : null
      ) : (
        <Box
          bg="#F8FAFC"
          borderWidth={1}
          borderColor="#E4EDF6"
          borderRadius={12}
          px="$3"
          py="$2"
        >
          <Text
            fontSize={12}
            lineHeight={16}
            color="#7A838D"
            fontFamily="Roboto"
          >
            None
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default function ProfileSignals({
  matchedAllergens,
  matchedConditions,
  matchedPreferences,
  index = 4,
}: ProfileSignalsProps) {
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
          <Ionicons name="git-compare-outline" size={20} color="#42586F" />
          <Text
            fontSize={20}
            lineHeight={24}
            color="#202A36"
            fontFamily="RobotoMedium"
          >
            Matched Profile Signals
          </Text>
        </Box>

        <Box style={{ gap: 12 }}>
          <SignalGroup
            title="Allergens"
            items={matchedAllergens}
            type="allergen"
          />
          <SignalGroup
            title="Conditions"
            items={matchedConditions}
            type="condition"
          />
          <SignalGroup
            title="Preferences"
            items={matchedPreferences}
            type="preference"
          />
        </Box>
      </Box>
    </MotiView>
  );
}
