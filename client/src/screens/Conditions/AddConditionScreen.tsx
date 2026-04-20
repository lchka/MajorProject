// Screen for managing health conditions for a user profile
// Allows users to add or remove conditions from a selected profile
import React from "react";
import { NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import {
  Box,
  CloseIcon,
  HStack,
  Icon,
  Pressable,
  ScrollView,
  Text,
} from "@gluestack-ui/themed";
import BackButton from "../../components/Buttons/BackButton";
import { profileService, Profile } from "../../services/profileService";
import { conditionService } from "../../services/conditionService";
import { AuthStackParamList } from "../../types/navigation";

// Normalizes condition names for matching: lowercase, removes special characters, trims whitespace
function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Returns visual styling (icon and color) based on condition type
// Each condition type has a unique icon and background color for visual distinction
function getConditionAccent(name: string) {
  const key = normalizeName(name);

  // Eczema: water droplet icon with red background
  if (key.includes("eczema")) {
    return { icon: "droplet" as const, iconBg: "#FF6B63" };
  }

  // Dermatitis: activity icon with orange background
  if (key.includes("dermatitis")) {
    return { icon: "activity" as const, iconBg: "#FFAA4C" };
  }

  // Default: shield icon with blue background for other conditions
  return { icon: "shield" as const, iconBg: "#66B9E8" };
}

// Represents a condition option available for selection
export type ConditionOption = {
  id: string;
  name: string;
};

// Props for the AddCondition component
export type AddConditionProps = {
  profileId?: string;
};

// Utility function to deduplicate array of IDs
const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

/**
 * AddCondition Component
 * Screen for adding/removing health conditions from a user profile
 * Fetches available conditions and current profile selections on mount
 */
export default function AddCondition() {
  // Navigation and route parameters
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "ConditionScreen">>();
  const routeProfileId = route.params?.profileId; // Profile ID passed from previous screen

  // State management
  const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]); // All user profiles
  const [activeProfileId, setActiveProfileId] = React.useState<string | null>(routeProfileId ?? null); // Currently selected profile
  const [availableConditions, setAvailableConditions] = React.useState<ConditionOption[]>([]); // All available conditions from API
  const [draftSelectedIds, setDraftSelectedIds] = React.useState<string[]>([]); // Condition IDs selected in current session
  const [isSaving, setIsSaving] = React.useState(false); // Saving state for UI feedback
  const [isLoading, setIsLoading] = React.useState(true); // Initial data loading state

  // Derives the currently active profile object from the profiles list
  const activeProfile = React.useMemo(
    () => allProfiles.find((profile) => profile.id === activeProfileId),
    [allProfiles, activeProfileId],
  );

  // Filters available conditions to only those currently selected by the user
  const selectedConditions = React.useMemo(
    () => availableConditions.filter((item) => draftSelectedIds.includes(item.id)),
    [availableConditions, draftSelectedIds],
  );

  // Loads profiles and available conditions on component mount
  // Sets active profile and populates initial selected conditions
  React.useEffect(() => {
    let isMounted = true; // Track if component is mounted to avoid state updates on unmounted component

    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch profiles and conditions in parallel
        const [fetchedProfiles, fetchedConditions] = await Promise.all([
          profileService.getMyProfile(),
          conditionService.getAllConditions(),
        ]);

        // Exit early if component unmounted during API call
        if (!isMounted) {
          return;
        }

        // Store all profiles and format conditions for selection
        setAllProfiles(fetchedProfiles);
        setAvailableConditions(
          fetchedConditions.map((item) => ({ id: item.id, name: item.name })),
        );

        // Determine active profile: use route param if valid, otherwise use main profile or first profile
        const fallbackProfile = fetchedProfiles.find((item) => item.main_profile) ?? fetchedProfiles[0];
        const nextProfileId =
          routeProfileId && fetchedProfiles.some((item) => item.id === routeProfileId)
            ? routeProfileId
            : fallbackProfile?.id ?? null;

        setActiveProfileId(nextProfileId);

        // Load currently selected conditions for the active profile
        const initialSelectedIds =
          fetchedProfiles.find((item) => item.id === nextProfileId)?.conditions?.map((item) => item.id) ?? [];
        setDraftSelectedIds(uniqueIds(initialSelectedIds));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    // Cleanup: mark component as unmounted
    return () => {
      isMounted = false;
    };
  }, [routeProfileId]);

  // Toggles a condition on/off in the draft selection
  // Adds condition if not selected, removes if already selected
  const toggleCondition = (conditionId: string) => {
    setDraftSelectedIds((prev) =>
      prev.includes(conditionId)
        ? prev.filter((id) => id !== conditionId) // Remove if selected
        : uniqueIds([...prev, conditionId]) // Add if not selected
    );
  };

  // Saves selected conditions to the active profile and navigates back
  const handleSave = async () => {
    // Safety check: exit if no profile selected
    if (!activeProfileId) {
      navigation.goBack();
      return;
    }

    try {
      setIsSaving(true);
      // Call condition service to save selections to API
      await conditionService.saveConditions(activeProfileId, draftSelectedIds);
      // Navigate back to previous screen after successful save
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box flex={1} bg="#FFFFFF" px="$4" mt="$7" pt="$5" pb="$4">
      {/* Header with back button, title, and close button */}
      <HStack alignItems="center" justifyContent="space-between" mb="$3">
        <BackButton />
        <Text fontSize={22} lineHeight={24} fontFamily="RobotoMedium" color="#151515">
          Manage Conditions
        </Text>
        <Pressable onPress={() => navigation.goBack()} p="$1" borderRadius="$full">
          <Icon as={CloseIcon} size="md" color="#111111" />
        </Pressable>
      </HStack>

      {/* Info text showing which profile is being edited */}
      <Text fontSize={13} lineHeight={16} fontFamily="Roboto" color="#6B7280" mb="$3">
        Editing conditions for {activeProfile?.first_name ?? "your profile"}
      </Text>

      {/* Section heading for currently selected conditions */}
      <Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
        Current Conditions
      </Text>

      {/* Display of currently selected conditions as blue badge chips */}
      <Box flexDirection="row" flexWrap="wrap" gap={8} mb="$4">
        {selectedConditions.length > 0 ? (
          selectedConditions.map((item) => (
            <Box
              key={`selected-${item.id}`}
              borderWidth={1}
              borderColor="#BFDBFE"
              bg="#EFF6FF"
              px="$3"
              py="$1.5"
              borderRadius={999}
            >
              <Text fontSize={12} lineHeight={14} fontFamily="RobotoMedium" color="#1D4ED8">
                {item.name}
              </Text>
            </Box>
          ))
        ) : (
          <Text fontSize={12} lineHeight={14} fontFamily="Roboto" color="#6B7280">
            No conditions selected yet.
          </Text>
        )}
      </Box>

      {/* Section heading for available conditions to select */}
      <Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
        Add / Remove Conditions
      </Text>

      {/* Scrollable list of available conditions to select from */}
      <ScrollView showsVerticalScrollIndicator={false} flex={1}>
        <Box style={{ gap: 10, paddingBottom: 12 }}>
          {availableConditions.map((item) => {
            const selected = draftSelectedIds.includes(item.id);
            const accent = getConditionAccent(item.name); // Get visual styling for condition type

            return (
              <Pressable
                key={item.id}
                onPress={() => toggleCondition(item.id)}
                style={{
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: selected ? "#38BDF8" : "#DCE5EF",
                  backgroundColor: selected ? "#E0F2FE" : "#F8FAFC",
                  overflow: "hidden",
                  opacity: isSaving || isLoading ? 0.7 : 1, // Dim when saving/loading
                }}
              >
                <Box style={{ flexDirection: "row", alignItems: "center", minHeight: 72 }}>
                  {/* Left accent bar with condition-type color */}
                  <Box style={{ width: 10, alignSelf: "stretch", backgroundColor: accent.iconBg }} />

                  {/* Condition type icon in a circle */}
                  <Box
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      marginLeft: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: accent.iconBg,
                    }}
                  >
                    <Feather name={accent.icon} size={18} color="#FFFFFF" />
                  </Box>

                  {/* Condition name */}
                  <Text
                    fontSize={18}
                    lineHeight={22}
                    color="#111827"
                    fontFamily="RobotoMedium"
                    style={{ marginLeft: 12, flex: 1 }}
                  >
                    {item.name}
                  </Text>

                  {/* Selection indicator: check icon if selected, plus icon if not */}
                  <Box style={{ marginRight: 14 }}>
                    <Feather name={selected ? "check-circle" : "plus-circle"} size={22} color={selected ? "#0284C7" : "#94A3B8"} />
                  </Box>
                </Box>
              </Pressable>
            );
          })}
        </Box>
      </ScrollView>

      {/* Save button - disabled while loading or saving */}
      <Pressable
        mt="$4"
        bg={isSaving || isLoading ? "#94A3B8" : "#0EA5E9"}
        borderRadius={12}
        py="$3"
        alignItems="center"
        onPress={handleSave}
        disabled={isSaving || isLoading}
      >
        <Text fontSize={14} lineHeight={16} fontFamily="RobotoMedium" color="#FFFFFF">
          {isSaving ? "Saving..." : isLoading ? "Loading..." : "Save Conditions"}
        </Text>
      </Pressable>
    </Box>
  );
}
