import React from "react";
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { Box, ScrollView } from "@gluestack-ui/themed";
import { clearAuthToken } from "../../utils/authStorage";
import NavBarBottom from "../../components/general/NavBarBottom";
import QuickStartPanel from "../../components/general/QuickStartPanel";
import NavBarTop from "../../components/general/NavBarTop";
import SystemErrorModal from "../../components/banners/SystemError";
import SwitchProfile from "../../components/profile/SwitchProfile";
import PastAnalysis from "../../components/evaluations/PastAnalysis";
import { UvIndexCard } from "../../components/general/UvIndexWidget";
import ProdScanCta from "../../components/general/ProdScanCta";
import PreferencesOverview from "../../components/preferences/AllPreferences";
import AllConditions from "../../components/conditions/AllConditions";
import SingleCondition from "../../components/conditions/SingleCondition";
import AllAllergens from "../../components/allergens/AllAllergens";
import {
  weatherService,
  CurrentUvSnapshot,
} from "../../services/weatherService";
import profileApiService, { Profile } from "../../services/profileService";
import {
  consumePendingSystemErrorEvent,
  subscribeSystemErrorEvents,
} from "../../config/api";
import { AuthStackParamList } from "../../types/navigation";
import { styles } from "../../style/LandingPageStyle";

const DEFAULT_UV_LAT = 53.3498;
const DEFAULT_UV_LON = -6.2603;
const SWITCH_PROFILE_SCROLL_TRIGGER_PX = 6;

export default function LandingScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [profileDetails, setProfileDetails] = React.useState<Profile[]>([]);
  const [isProfilesLoading, setIsProfilesLoading] = React.useState(true); // FIX: Track initial profile load
  const [availableAllergens, setAvailableAllergens] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [isRemovingPreference, setIsRemovingPreference] = React.useState(false);
  const [isPreferenceEditMode, setIsPreferenceEditMode] = React.useState(false);
  const [isRemovingAllergen, setIsRemovingAllergen] = React.useState(false);
  const [isAllergenEditMode, setIsAllergenEditMode] = React.useState(false);
  const [selectedCondition, setSelectedCondition] = React.useState<{
    name: string;
    description?: string;
  } | null>(null);
  const [systemErrorOverlay, setSystemErrorOverlay] = React.useState<{
    title: string;
    message: string;
  } | null>(null);
  const [profiles, setProfiles] = React.useState<
    { id: string; name: string; avatarUri?: string; isMain: boolean }[]
  >([]);
  const [uvSnapshot, setUvSnapshot] = React.useState<CurrentUvSnapshot | null>(
    null,
  );
  const [isUvLoading, setIsUvLoading] = React.useState(false);
  const [isSwitchProfileSticky, setIsSwitchProfileSticky] = React.useState(false);

  const loadProfiles = React.useCallback(async () => {
    try {
      const fetchedProfiles = await profileApiService.getMyProfile();
      const fallbackProfile =
        fetchedProfiles.find((item) => item.main_profile) ?? fetchedProfiles[0];

      setProfileDetails(fetchedProfiles);
      setProfiles(
        fetchedProfiles.map((item) => ({
          id: item.id,
          name: item.first_name.trim(),
          avatarUri: item.profile_image || undefined,
          isMain: item.main_profile,
        })),
      );

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
      setProfileDetails([]);
      setProfiles([]);
      setProfileId(null);
    } finally {
      // FIX: Mark profiles as loaded (whether successful or failed)
      setIsProfilesLoading(false);
    }
  }, []);

  const loadUv = React.useCallback(async () => {
    try {
      setIsUvLoading(true);
      const snapshot = await weatherService.getCurrentUv(
        DEFAULT_UV_LAT,
        DEFAULT_UV_LON,
      );
      setUvSnapshot(snapshot);
    } catch {
      setUvSnapshot(null);
    } finally {
      setIsUvLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const pendingSystemError = consumePendingSystemErrorEvent();
      if (pendingSystemError) {
        setSystemErrorOverlay({
          title: pendingSystemError.title,
          message: pendingSystemError.message,
        });
      }

      void loadProfiles();
      void loadUv();

      void profileApiService
        .getAllAllergens()
        .then((items) => {
          setAvailableAllergens(
            items.map((item) => ({ id: item.id, name: item.name })),
          );
        })
        .catch(() => {
          setAvailableAllergens([]);
        });
    }, [loadProfiles, loadUv]),
  );

  // FIX: Load profiles on initial mount (before focus effect)
  // This prevents PastAnalysis from rendering with null profileId after login
  React.useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const uvRecommendation = React.useMemo(() => {
    if (isUvLoading && !uvSnapshot) {
      return "Loading live UV data...";
    }

    if (!uvSnapshot) {
      return "Live UV unavailable right now.";
    }

    const uv = uvSnapshot.uvIndex;
    const weatherLabel = uvSnapshot.weatherMain ?? "Current conditions";
    const temperatureLabel =
      typeof uvSnapshot.temperatureCelsius === "number"
        ? ` ${Math.round(uvSnapshot.temperatureCelsius)}°C`
        : "";

    if (uv <= 2) {
      return `${weatherLabel}${temperatureLabel}. Minimal sun protection needed.`;
    }

    if (uv <= 5) {
      return `${weatherLabel}${temperatureLabel}. Wear sunscreen and sunglasses.`;
    }

    if (uv <= 7) {
      return `${weatherLabel}${temperatureLabel}. SPF 30+, hat, and shade recommended.`;
    }

    return `${weatherLabel}${temperatureLabel}. High UV: avoid peak sun and reapply SPF.`;
  }, [isUvLoading, uvSnapshot]);

  React.useEffect(() => {
    return subscribeSystemErrorEvents((event) => {
      setSystemErrorOverlay({
        title: event.title,
        message: event.message,
      });
    });
  }, []);

  // Clears local auth state and routes back to the login flow.
  const handleSignOut = async () => {
    await clearAuthToken();
    navigation.navigate("LoginScreen");
  };

  const activeProfile = React.useMemo(
    () =>
      profileDetails.find((profile) => profile.id === profileId) ??
      profileDetails.find((profile) => profile.main_profile) ??
      profileDetails[0],
    [profileDetails, profileId],
  );

  const activeProfileFirstName = React.useMemo(() => {
    const explicitFirstName = activeProfile?.first_name?.trim();
    if (explicitFirstName) {
      return explicitFirstName;
    }

    const fallbackName =
      profiles.find((profile) => profile.id === activeProfile?.id)?.name?.trim() ?? "";
    return fallbackName.split(/\s+/)[0] ?? "";
  }, [activeProfile, profiles]);

  const activeProfilePreferences = React.useMemo(() => {
    return activeProfile?.preferences?.map((item) => item.name) ?? [];
  }, [activeProfile]);

  const activeProfileConditions = React.useMemo(() => {
    return activeProfile?.conditions?.map((item) => item.name) ?? [];
  }, [activeProfile]);

  const completionStats = React.useMemo(() => {
    const allergenCount = activeProfile?.allergens?.length ?? 0;
    const conditionCount = activeProfile?.conditions?.length ?? 0;
    const preferenceCount = activeProfile?.preferences?.length ?? 0;
    return { allergens: allergenCount, conditions: conditionCount, preferences: preferenceCount };
  }, [activeProfile]);

  const activeProfileConditionDetails = React.useMemo(() => {
    return activeProfile?.conditions ?? [];
  }, [activeProfile]);

  const handleRemoveAllergen = React.useCallback(
    async (allergenId: string) => {
      if (!activeProfile?.id || isRemovingAllergen) {
        return;
      }

      const previousProfileDetails = profileDetails;

      const nextAllergenIds =
        activeProfile.allergens
          ?.filter((item) => item.id !== allergenId)
          .map((item) => item.id) ?? [];
      const dedupedAllergenIds = Array.from(new Set(nextAllergenIds));

      // Optimistic UI update so removal feels immediate.
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
        await profileApiService.updateProfile(activeProfile.id, {
          allergenIds: dedupedAllergenIds,
        });
        void loadProfiles();
      } catch {
        setProfileDetails(previousProfileDetails);
      } finally {
        setIsRemovingAllergen(false);
      }
    },
    [activeProfile, isRemovingAllergen, loadProfiles, profileDetails],
  );

  const handleRemovePreference = React.useCallback(
    async (preferenceId: string) => {
      if (!activeProfile?.id || isRemovingPreference) {
        return;
      }

      const previousProfileDetails = profileDetails;

      const nextPreferenceIds =
        activeProfile.preferences
          ?.filter((item) => item.id !== preferenceId)
          .map((item) => item.id) ?? [];
      const dedupedPreferenceIds = Array.from(new Set(nextPreferenceIds));

      // Optimistic UI update so preference removal feels immediate.
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
        await profileApiService.updateProfile(activeProfile.id, {
          preferenceIds: dedupedPreferenceIds,
        });
        void loadProfiles();
      } catch {
        setProfileDetails(previousProfileDetails);
      } finally {
        setIsRemovingPreference(false);
      }
    },
    [activeProfile, isRemovingPreference, loadProfiles, profileDetails],
  );

  const handleSaveAllergens = React.useCallback(
    async (allergenIds: string[]) => {
      if (!activeProfile?.id || isRemovingAllergen) {
        return;
      }

      const dedupedAllergenIds = Array.from(new Set(allergenIds));

      try {
        setIsRemovingAllergen(true);
        await profileApiService.updateProfile(activeProfile.id, {
          allergenIds: dedupedAllergenIds,
        });
        await loadProfiles();
      } finally {
        setIsRemovingAllergen(false);
      }
    },
    [activeProfile?.id, isRemovingAllergen, loadProfiles],
  );

  return (
    <Box style={styles.screen}>
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
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          const shouldBeSticky = offsetY >= SWITCH_PROFILE_SCROLL_TRIGGER_PX;

          setIsSwitchProfileSticky((previous) =>
            previous === shouldBeSticky ? previous : shouldBeSticky,
          );
        }}
      >
        <NavBarTop notificationCount={2} onPressAvatar={handleSignOut} />

        <Box px="$2" mt="$6">
          <SwitchProfile
            isSticky={isSwitchProfileSticky}
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
          />
        </Box>
        {/* FIX: Only render PastAnalysis after profiles are loaded to prevent render with null profileId */}
        {!isProfilesLoading && (
          <Box px="$2" mt="$2">
            <PastAnalysis profileId={profileId} profileName={activeProfileFirstName} />
          </Box>
        )}
        <Box px="$2" mt="$3">
          <ProdScanCta
            onPress={() =>
              navigation.navigate("CameraScreen", {
                profileId: profileId ?? activeProfile?.id,
              })
            }
          />
        </Box>
       
        <Box px="$2" mt="$9">
          <UvIndexCard
            uvIndex={uvSnapshot?.uvIndex ?? 0}
            recommendation={uvRecommendation}
          />
        </Box>
         <Box px="$2" mt="$3">
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
        <Box px="$2" mt="$4">
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

        <Box px="$2" my="$4">
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
        {/* remember to delete this once the navbar takes up the proper space */}

        <Box px="$2" pb="$8">
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
      </ScrollView>

      <SingleCondition
        isOpen={Boolean(selectedCondition)}
        conditionName={selectedCondition?.name}
        conditionDescription={selectedCondition?.description}
        onClose={() => {
          setSelectedCondition(null);
        }}
      />

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
      {/* Sticky bottom navigation */}
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
