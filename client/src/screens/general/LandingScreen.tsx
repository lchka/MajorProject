// Main landing/home screen component for the application
// Displays user profile information, evaluations, conditions, preferences, and allergens
import React from "react";
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { Box, ScrollView } from "@gluestack-ui/themed";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearAuthToken } from "../../utils/authStorage";
import NavBarBottom from "../../components/general/NavBarBottom";
import QuickStartPanel from "../../components/landingpage/QuickStartPanel";
import NavBarTop from "../../components/general/NavBarTop";
import Banner from "../../components/banners/GenBanner";
import SystemErrorModal from "../../components/banners/ErrorBanner";
import SwitchProfile from "../../components/profile/SwitchProfile";
import PastAnalysis from "../../components/evaluations/PastAnalysis";
import { UvIndexCard } from "../../components/landingpage/UvIndexWidget";
import ProdScanCta from "../../components/landingpage/ProdScanCta";
import PreferencesOverview from "../../components/preferences/AllPreferences";
import AllConditions from "../../components/conditions/AllConditions";
import SingleCondition from "../../components/conditions/SingleCondition";
import AllAllergens from "../../components/allergens/AllAllergens";
import { useScrollPastThreshold } from "../../hooks/useScrollPastThreshold";
import {
  weatherService,
  CurrentUvSnapshot,
} from "../../services/weatherService";
import {
  profileService,
  Profile,
  consumePendingProfileBanner,
  subscribeProfileChanges,
} from "../../services/profileService";
import { allergenService } from "../../services/allergenService";
import { preferenceService } from "../../services/preferenceService";
import {
  consumePendingSystemErrorEvent,
  subscribeSystemErrorEvents,
} from "../../config/api";
import { AuthStackParamList } from "../../types/navigation";
import { styles } from "../../style/LandingPageStyle";

// Default coordinates for UV index lookup (Dublin, Ireland)
const DEFAULT_UV_LAT = 53.3498;
const DEFAULT_UV_LON = -6.2603;

/**
 * LandingScreen Component
 * Main dashboard screen showing profile data, health metrics, and quick-start options
 */
export default function LandingScreen() {
  // Navigation and safe area handling
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  // Android bottom inset for navigation bar; iOS uses full screen spanning
  const androidBottomInset =
    Platform.OS === "android" ? Math.max(insets.bottom, 12) : 0;

  // Profile state management
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [profileDetails, setProfileDetails] = React.useState<Profile[]>([]);
  const [isProfilesLoading, setIsProfilesLoading] = React.useState(true); // Track initial profile load
  const [profiles, setProfiles] = React.useState<
    { id: string; name: string; avatarUri?: string; isMain: boolean }[]
  >([]);

  // Allergen and allergen list management
  const [availableAllergens, setAvailableAllergens] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [isRemovingAllergen, setIsRemovingAllergen] = React.useState(false);
  const [isAllergenEditMode, setIsAllergenEditMode] = React.useState(false);

  // Preference management
  const [isRemovingPreference, setIsRemovingPreference] = React.useState(false);
  const [isPreferenceEditMode, setIsPreferenceEditMode] = React.useState(false);

  // Condition modal state
  const [selectedCondition, setSelectedCondition] = React.useState<{
    name: string;
    description?: string;
  } | null>(null);

  // System error overlay state for displaying API errors
  const [systemErrorOverlay, setSystemErrorOverlay] = React.useState<{
    title: string;
    message: string;
  } | null>(null);
  const [profileBanner, setProfileBanner] = React.useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  // UV index data and loading state
  const [uvSnapshot, setUvSnapshot] = React.useState<CurrentUvSnapshot | null>(
    null,
  );
  const [isUvLoading, setIsUvLoading] = React.useState(false);

  // Track scroll position to conditionally apply margin to SwitchProfile
  const { hasScrolled, onScroll, scrollEventThrottle } = useScrollPastThreshold(5);

  // Fetches all profiles for the current user from the API
  // Sets active profile to the main profile or first profile if main doesn't exist
  const loadProfiles = React.useCallback(async () => {
    setIsProfilesLoading(true);

    try {
      // Fetch all profiles for the user
      const fetchedProfiles = await profileService.getMyProfile();
      // Determine fallback profile: prefer main profile, otherwise use first profile
      const fallbackProfile =
        fetchedProfiles.find((item) => item.main_profile) ?? fetchedProfiles[0];

      // Store full profile details for data access
      setProfileDetails(fetchedProfiles);
      // Store simplified profile data for UI display
      setProfiles(
        fetchedProfiles.map((item) => ({
          id: item.id,
          name: item.first_name.trim(),
          avatarUri: item.profile_image || undefined,
          isMain: item.main_profile,
        })),
      );

      // Update active profile ID: preserve current selection if it still exists, otherwise use fallback
      setProfileId((previousProfileId) => {
        if (
          previousProfileId &&
          fetchedProfiles.some((profile) => profile.id === previousProfileId)
        ) {
          return previousProfileId;
        }

        return fallbackProfile?.id ?? null;
      });
    } catch {
      // On error, clear all profile data
      setProfileDetails([]);
      setProfiles([]);
      setProfileId(null);
    } finally {
      setIsProfilesLoading(false);
    }
  }, []);

  // Fetches current UV index data from weather service at default Dublin coordinates
  const loadUv = React.useCallback(async () => {
    setIsUvLoading(true);

    try {
      // Query UV index at specified coordinates
      const snapshot = await weatherService.getCurrentUv(
        DEFAULT_UV_LAT,
        DEFAULT_UV_LON,
      );
      setUvSnapshot(snapshot);
    } catch {
      // On error, clear UV data to show fallback message
      setUvSnapshot(null);
    } finally {
      setIsUvLoading(false);
    }
  }, []);

  const loadAvailableAllergens = React.useCallback(async () => {
    try {
      const items = await allergenService.getAllAllergens();
      setAvailableAllergens(
        items.map((item) => ({ id: item.id, name: item.name })),
      );
    } catch {
      setAvailableAllergens([]);
    }
  }, []);

  // Runs when screen comes into focus (tab selection, navigation back)
  // Only consumes pending system errors so normal navigation keeps the current screen state.
  useFocusEffect(
    React.useCallback(() => {
      // Check for pending system errors from previous operations
      const pendingSystemError = consumePendingSystemErrorEvent();
      if (pendingSystemError) {
        setSystemErrorOverlay({
          title: pendingSystemError.title,
          message: pendingSystemError.message,
        });
      }

      const pendingProfileBanner = consumePendingProfileBanner();
      if (pendingProfileBanner) {
        setProfileBanner(pendingProfileBanner);
      }
    }, []),
  );

  // Load profiles on initial component mount (before focus effect)
  // This prevents PastAnalysis from rendering with null profileId after login
  React.useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  React.useEffect(() => {
    void loadUv();
    void loadAvailableAllergens();
  }, [loadAvailableAllergens, loadUv]);

  React.useEffect(() => {
    return subscribeProfileChanges(() => {
      void loadProfiles();
    });
  }, [loadProfiles]);

  // Subscribe to system-wide error events and display them in an overlay modal
  // This allows errors from background operations to be displayed to the user
  React.useEffect(() => {
    return subscribeSystemErrorEvents((event) => {
      setSystemErrorOverlay({
        title: event.title,
        message: event.message,
      });
    });
  }, []);

  // Clears local authentication token and navigates back to login screen
  const handleSignOut = async () => {
    await clearAuthToken();
    navigation.navigate("LoginScreen");
  };

  // Derives the currently active profile object from full profile details
  // Falls back to main profile or first profile if selected profile no longer exists
  const activeProfile = React.useMemo(
    () =>
      profileDetails.find((profile) => profile.id === profileId) ??
      profileDetails.find((profile) => profile.main_profile) ??
      profileDetails[0],
    [profileDetails, profileId],
  );

  // Extracts the first name of the active profile, with fallback to simplified name
  const activeProfileFirstName = React.useMemo(() => {
    // Try to get explicit first name from profile details
    const explicitFirstName = activeProfile?.first_name?.trim();
    if (explicitFirstName) {
      return explicitFirstName;
    }

    // Fallback to simplified profile name and extract first word
    const fallbackName =
      profiles
        .find((profile) => profile.id === activeProfile?.id)
        ?.name?.trim() ?? "";
    return fallbackName.split(/\s+/)[0] ?? "";
  }, [activeProfile, profiles]);

  // Extracts preference names for display in the UI
  const activeProfilePreferences = React.useMemo(() => {
    return activeProfile?.preferences?.map((item) => item.name) ?? [];
  }, [activeProfile]);

  // Extracts condition names for display in the UI
  const activeProfileConditions = React.useMemo(() => {
    return activeProfile?.conditions?.map((item) => item.name) ?? [];
  }, [activeProfile]);

  // Calculates completion statistics for display in QuickStartPanel
  // Shows number of allergens, conditions, and preferences added
  const completionStats = React.useMemo(() => {
    const allergenCount = activeProfile?.allergens?.length ?? 0;
    const conditionCount = activeProfile?.conditions?.length ?? 0;
    const preferenceCount = activeProfile?.preferences?.length ?? 0;
    return {
      allergens: allergenCount,
      conditions: conditionCount,
      preferences: preferenceCount,
    };
  }, [activeProfile]);

  // Stores full condition details for use in condition modal
  const activeProfileConditionDetails = React.useMemo(() => {
    return activeProfile?.conditions ?? [];
  }, [activeProfile]);

  // Removes an allergen from the active profile
  // Uses optimistic UI update for immediate visual feedback before API confirmation
  const handleRemoveAllergen = React.useCallback(
    async (allergenId: string) => {
      // Guard against invalid state or concurrent removal operations
      if (!activeProfile?.id || isRemovingAllergen) {
        return;
      }

      // Save current state in case removal fails
      const previousProfileDetails = profileDetails;

      // Optimistic UI update: remove allergen immediately from local state
      setProfileDetails((previous) =>
        previous.map((profile) => {
          if (profile.id !== activeProfile.id) {
            return profile;
          }

          return {
            ...profile,
            allergens:
              profile.allergens?.filter((item) => item.id !== allergenId) ?? [],
          };
        }),
      );

      try {
        setIsRemovingAllergen(true);
        // Use allergen service to remove allergen
        await allergenService.removeAllergen(
          activeProfile.id,
          allergenId,
          activeProfile.allergens,
        );
        // Reload profiles to ensure sync with server state
        void loadProfiles();
      } catch {
        // Restore previous state on API error
        setProfileDetails(previousProfileDetails);
      } finally {
        setIsRemovingAllergen(false);
      }
    },
    [activeProfile, isRemovingAllergen, loadProfiles, profileDetails],
  );

  // Removes a preference from the active profile
  // Uses optimistic UI update for immediate visual feedback before API confirmation
  const handleRemovePreference = React.useCallback(
    async (preferenceId: string) => {
      // Guard against invalid state or concurrent removal operations
      if (!activeProfile?.id || isRemovingPreference) {
        return;
      }

      // Save current state in case removal fails
      const previousProfileDetails = profileDetails;

      // Optimistic UI update: remove preference immediately from local state
      setProfileDetails((previous) =>
        previous.map((profile) => {
          if (profile.id !== activeProfile.id) {
            return profile;
          }

          return {
            ...profile,
            preferences:
              profile.preferences?.filter((item) => item.id !== preferenceId) ??
              [],
          };
        }),
      );

      try {
        setIsRemovingPreference(true);
        // Use preference service to remove preference
        await preferenceService.removePreference(
          activeProfile.id,
          preferenceId,
          activeProfile.preferences,
        );
        // Reload profiles to ensure sync with server state
        void loadProfiles();
      } catch {
        // Restore previous state on API error
        setProfileDetails(previousProfileDetails);
      } finally {
        setIsRemovingPreference(false);
      }
    },
    [activeProfile, isRemovingPreference, loadProfiles, profileDetails],
  );

  // Saves updated allergen list to API and reloads profile data
  // Used by AllAllergens component when user adds/edits allergens
  const handleSaveAllergens = React.useCallback(
    async (allergenIds: string[]) => {
      // Guard against invalid state or concurrent save operations
      if (!activeProfile?.id || isRemovingAllergen) {
        return;
      }

      try {
        setIsRemovingAllergen(true);
        // Use allergen service to save allergens
        await allergenService.saveAllergens(activeProfile.id, allergenIds);
        // Reload profiles to sync with server state
        await loadProfiles();
      } finally {
        setIsRemovingAllergen(false);
      }
    },
    [activeProfile?.id, isRemovingAllergen, loadProfiles],
  );

  return (
    <Box style={styles.screen}>
      <Banner
        isOpen={Boolean(profileBanner)}
        message={profileBanner?.message ?? ""}
        type={profileBanner?.type ?? "success"}
        onDismiss={() => {
          setProfileBanner(null);
        }}
      />
      {/* Background decorative circles */}
      <Box
        position="absolute"
        top={-60}
        right={-30}
        w={180}
        h={180}
        borderRadius={999}
        bg="#D8ECFF"
        opacity={0.5}
      />
      <Box
        position="absolute"
        bottom={-40}
        left={-20}
        w={140}
        h={140}
        borderRadius={999}
        bg="#BFDFFF"
        opacity={0.25}
      />

      {/* Main scrollable content area */}
      {/* Android bottom inset applied for navigation bar; iOS spans full screen */}
      <ScrollView
        style={{ marginHorizontal: 0, paddingHorizontal: 0 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 0,
            paddingBottom: androidBottomInset,
            paddingHorizontal: 0,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        stickyHeaderIndices={[1]} // Keep header fixed when scrolling
      >
        {/* Top navigation bar - sticky, stays fixed while scrolling */}
        <NavBarTop notificationCount={2} onPressAvatar={handleSignOut} />

        {/* Profile switcher section */}
        <SwitchProfile
          profiles={profiles.map((profile) => ({
            id: profile.id,
            name: profile.name,
            avatarSource: profile.avatarUri
              ? { uri: profile.avatarUri }
              : undefined,
            isMain: profile.isMain,
          }))}
            activeProfileId={profileId ?? undefined}
            onSelectProfile={(selectedProfileId) => {
              setProfileId(selectedProfileId);
            }}
            onAddProfile={() => {
              navigation.navigate("ProfileScreen");
            }}
            onEditProfile={(selectedProfileId) => {
              const targetProfileId =
                selectedProfileId ?? profileId ?? undefined;
              const targetProfile =
                profileDetails.find((item) => item.id === targetProfileId) ??
                activeProfile;
              const fullName = [
                targetProfile?.first_name?.trim(),
                targetProfile?.last_name?.trim(),
              ]
                .filter(Boolean)
                .join(" ");
              const targetProfileName =
                fullName ||
                profiles.find((item) => item.id === targetProfileId)?.name ||
                activeProfile?.first_name ||
                undefined;
              const targetProfilePreferenceNames =
                targetProfile?.preferences?.map((item) => item.name) ?? [];
              const targetProfileAge =
                targetProfile?.age?.toString()?.trim() || undefined;
              const targetProfileIsMain = targetProfile?.main_profile ?? false;
              const targetProfileImageUri =
                profiles.find((item) => item.id === targetProfileId)
                  ?.avatarUri ??
                activeProfile?.profile_image ??
                undefined;

              navigation.navigate("EditProfileScreen", {
                profileId: targetProfileId,
                profileName: targetProfileName,
                profileImageUri: targetProfileImageUri,
                profilePreferenceNames: targetProfilePreferenceNames,
                profileAge: targetProfileAge,
                profileIsMain: targetProfileIsMain,
              });
            }}
            hasScrolled={hasScrolled}
          />

        <Box mx="$2">
          {/* Past evaluations - only render after profiles are loaded to prevent null profileId */}
          {!isProfilesLoading && (
            <Box>
              <PastAnalysis
                profileId={profileId}
                profileName={activeProfileFirstName}
              />
            </Box>
          )}

          {/* Product scan call-to-action button */}
          <Box mt="$3">
            <ProdScanCta
              onPress={() =>
                navigation.navigate("CameraScreen", {
                  profileId: profileId ?? activeProfile?.id,
                })
              }
            />
          </Box>

          {/* UV index recommendation card */}
          <Box mt="$9">
            <UvIndexCard
              uvIndex={uvSnapshot?.uvIndex ?? 0}
              uvSnapshot={uvSnapshot}
              isUvLoading={isUvLoading}
            />
          </Box>

          {/* Quick start panel with completion stats */}
          <Box mt="$3">
            <QuickStartPanel
              profileFirstName={activeProfileFirstName}
              allergenCount={completionStats.allergens}
              conditionCount={completionStats.conditions}
              preferenceCount={completionStats.preferences}
              onPressAddAllergens={() =>
                navigation.navigate("AllergenScreen", {
                  profileId: profileId ?? activeProfile?.id,
                })
              }
              onPressAddConditions={() =>
                navigation.navigate("ConditionScreen", {
                  profileId: profileId ?? activeProfile?.id,
                })
              }
              onPressAddPreferences={() =>
                navigation.navigate("PreferenceScreen", {
                  profileId: profileId ?? activeProfile?.id,
                })
              }
            />
          </Box>

          {/* Conditions section with card styling */}
          <Box mt="$4">
            <Box
              bg="$backgroundLight0"
              borderRadius="$3xl"
              p="$2"
              borderWidth={1}
              borderColor="$coolGray100"
              shadowColor="#000"
              shadowOpacity={0.05}
              shadowRadius={10}
              elevation={3}
            >
              <AllConditions
                conditionNames={activeProfileConditions}
                profileFirstName={activeProfile?.first_name}
                onPressCondition={(conditionName) => {
                  const matchedCondition = activeProfileConditionDetails.find(
                    (item) => item.name === conditionName,
                  );

                  setSelectedCondition({
                    name: conditionName,
                    description: matchedCondition?.description,
                  });
                }}
                onPressEdit={() =>
                  navigation.navigate("ConditionScreen", {
                    profileId: profileId ?? undefined,
                  })
                }
              />
            </Box>
          </Box>

          {/* Preferences section with card styling */}
          <Box my="$4">
            <Box
              bg="$backgroundLight0"
              borderRadius="$3xl"
              borderWidth={1}
              borderColor="$coolGray100"
              shadowColor="#000"
              shadowOpacity={0.05}
              shadowRadius={10}
              elevation={3}
            >
              <PreferencesOverview
                profilePreferenceNames={activeProfilePreferences}
                preferences={activeProfile?.preferences?.map((item) => ({
                  id: item.id,
                  name: item.name,
                }))}
                profileFirstName={activeProfile?.first_name}
                onRemovePreference={handleRemovePreference}
                isRemovingPreference={isRemovingPreference}
                isEditMode={isPreferenceEditMode}
                onToggleEditMode={() => {
                  setIsPreferenceEditMode((previous) => !previous);
                }}
                onCloseEditMode={() => {
                  setIsPreferenceEditMode(false);
                }}
                onAddPreference={() =>
                  navigation.navigate("PreferenceScreen", {
                    profileId: profileId ?? undefined,
                  })
                }
              />
            </Box>
          </Box>

          {/* Allergens section with card styling and bottom padding for navbar spacing */}
          <Box pb="$8">
            <Box
              bg="$backgroundLight0"
              borderRadius="$3xl"
              py="$2"
              borderWidth={1}
              borderColor="$coolGray100"
              shadowColor="#000"
              shadowOpacity={0.05}
              shadowRadius={10}
              elevation={3}
            >
              <AllAllergens
                profileFirstName={activeProfile?.first_name}
                allergens={activeProfile?.allergens?.map((item) => ({
                  id: item.id,
                  name: item.name,
                }))}
                availableAllergens={availableAllergens}
                onRemoveAllergen={handleRemoveAllergen}
                onSaveAllergens={handleSaveAllergens}
                onOpenAddAllergen={() => {
                  navigation.navigate("AllergenScreen", {
                    profileId: profileId ?? undefined,
                  });
                }}
                isRemovingAllergen={isRemovingAllergen}
                isEditMode={isAllergenEditMode}
                onToggleEditMode={() => {
                  setIsAllergenEditMode((previous) => !previous);
                }}
                onCloseEditMode={() => {
                  setIsAllergenEditMode(false);
                }}
              />
            </Box>
          </Box>
        </Box>
      </ScrollView>

      {/* Condition detail modal - displays when user taps on a condition */}
      <SingleCondition
        isOpen={Boolean(selectedCondition)}
        conditionName={selectedCondition?.name}
        conditionDescription={selectedCondition?.description}
        onClose={() => {
          setSelectedCondition(null);
        }}
      />

      {/* System error modal - displays API errors and operation failures */}
      <SystemErrorModal
        isOpen={Boolean(systemErrorOverlay)}
        title={systemErrorOverlay?.title}
        message={systemErrorOverlay?.message}
        onClose={() => {
          setSystemErrorOverlay(null);
        }}
        onRetry={() => {
          setSystemErrorOverlay(null);
          void loadProfiles();
        }}
        onReport={() => {
          setSystemErrorOverlay(null);
        }}
      />

      {/* Sticky bottom navigation bar */}
      <NavBarBottom
        activeTab="home"
        historyProfileId={profileId ?? activeProfile?.id}
        cameraProfileId={profileId ?? activeProfile?.id}
        avatarSource={
          activeProfile?.profile_image
            ? { uri: activeProfile.profile_image }
            : undefined
        }
        onPressProfile={() => {
          const fullName = [
            activeProfile?.first_name?.trim(),
            activeProfile?.last_name?.trim(),
          ]
            .filter(Boolean)
            .join(" ");

          navigation.navigate("EditProfileScreen", {
            profileId: activeProfile?.id,
            profileName: fullName || activeProfile?.first_name || undefined,
            profileImageUri: activeProfile?.profile_image ?? undefined,
            profilePreferenceNames:
              activeProfile?.preferences?.map((item) => item.name) ?? [],
            profileAge: activeProfile?.age?.toString()?.trim() || undefined,
            profileIsMain: activeProfile?.main_profile ?? false,
          });
        }}
      />
    </Box>
  );
}
