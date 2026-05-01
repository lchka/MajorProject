import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";
import AllPreferences from "../preferences/AllPreferences";
import AllConditions from "../conditions/AllConditions";
import AllAllergens from "../allergens/AllAllergens";
// Component for displaying matched profile signals in a product evaluation. The component accepts arrays of matched allergens, conditions, and preferences, as well as the user's profile allergens, conditions, and preferences for comparison. It uses Moti for smooth fade-in and slide-up animations when rendered, and it displays the matched signals in a styled card format with a header and individual sections for allergens, conditions, and preferences. Each section shows the matched items in a chip format, or a message indicating no matches or that no profile signals are set up if applicable.
type ProfileSignalsProps = {
  matchedAllergens: string[];
  matchedConditions: string[];
  matchedPreferences: string[];
  profileAllergens?: string[];
  profileConditions?: string[];
  profilePreferences?: string[];
  index?: number;
};

type SignalType = "allergen" | "condition" | "preference";

function SignalGroup({
  title,
  items,
  profileItems,
  type,
}: {
  title: string;
  items: string[];
  profileItems?: string[];
  type: SignalType;
}) {
  const hasProfileSetup = Array.isArray(profileItems) && profileItems.length > 0;

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
            {hasProfileSetup
              ? "No matches for this scan"
              : `No ${title.toLowerCase()} set in this profile yet`}
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
  profileAllergens,
  profileConditions,
  profilePreferences,
  index = 4,
}: ProfileSignalsProps) {
  const hasAnyProfileSignals =
    (profileAllergens?.length ?? 0) > 0 ||
    (profileConditions?.length ?? 0) > 0 ||
    (profilePreferences?.length ?? 0) > 0;

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

        {!hasAnyProfileSignals ? (
          <Box
            mb="$3"
            bg="#F5F9FF"
            borderWidth={1}
            borderColor="#D9E7F6"
            borderRadius={12}
            px="$3"
            py="$3"
          >
            <Text fontSize={12} lineHeight={18} color="#3C556F" fontFamily="Roboto">
              This profile has no allergens, conditions, or preferences selected yet.
              Add them in Profile settings for more personalized scan results.
            </Text>
          </Box>
        ) : null}

        <Box style={{ gap: 12 }}>
          <SignalGroup
            title="Allergens"
            items={matchedAllergens}
            profileItems={profileAllergens}
            type="allergen"
          />
          <SignalGroup
            title="Conditions"
            items={matchedConditions}
            profileItems={profileConditions}
            type="condition"
          />
          <SignalGroup
            title="Preferences"
            items={matchedPreferences}
            profileItems={profilePreferences}
            type="preference"
          />
        </Box>
      </Box>
    </MotiView>
  );
}
