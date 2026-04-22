import React from "react";
import {
  NavigationProp,
  RouteProp,
  StackActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { Box, ScrollView } from "@gluestack-ui/themed";
import BackButton from "../../components/Buttons/BackButton";
import NavBarBottom from "../../components/general/NavBarBottom";
import NavBarTop from "../../components/general/NavBarTop";
import AllEvaluations, {
  EvaluationHistoryCard,
} from "../../components/evaluations/AllEvaluations";
import SwitchProfile from "../../components/profile/SwitchProfile";
import { useScrollPastThreshold } from "../../hooks/useScrollPastThreshold";
import {
  evaluationContextService,
  productService,
  profileService,
  getLocalEvaluations,
} from "../../services";
import type { AuthStackParamList } from "../../types/navigation";
import type { EvaluationContext } from "../../types/evaluationContext.type";
import type { Product } from "../../services/productService";
import type { Profile } from "../../services/profileService";
import type { LocalEvaluation } from "../../services";
import { styles } from "../../style/LandingPageStyle";

let cachedProfiles: Profile[] = [];

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "HistoryScreen">>();
  const routeProfileId = route.params?.profileId;

  const { hasScrolled, onScroll, scrollEventThrottle } =
    useScrollPastThreshold(5);

  const [loading, setLoading] = React.useState(true);
  const [historyItems, setHistoryItems] = React.useState<
    EvaluationHistoryCard[]
  >([]);
  const [profiles, setProfiles] = React.useState<Profile[]>(cachedProfiles);

  const loadHistory = React.useCallback(async () => {
    // FAST PATH: Load from local storage first
    let hasLocalData = false;
    try {
      const localEvaluations = await getLocalEvaluations();
      const scopedLocal = routeProfileId
        ? localEvaluations.filter(
            (evaluation) => evaluation.profileId === routeProfileId,
          )
        : localEvaluations;

      hasLocalData = scopedLocal.length > 0;

      const sortedLocal = [...scopedLocal].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const localItems = sortedLocal.map(
        (evaluation: LocalEvaluation) =>
          ({
            evaluationContextId: evaluation.evaluationContextId,
            productName: evaluation.productName || "Unknown product",
            profileName: evaluation.profileName || "Unknown profile",
            createdAt: evaluation.createdAt,
            status:
              typeof evaluation.resultJson?.status === "string"
                ? evaluation.resultJson.status
                : undefined,
            summary:
              typeof evaluation.resultJson?.summary === "string"
                ? evaluation.resultJson.summary
                : undefined,
            imageUri: evaluation.imageUri ?? null,
          }) satisfies EvaluationHistoryCard,
      );

      setHistoryItems(localItems);

      // Only stop loading if we have local data
      if (hasLocalData) {
        setLoading(false);
      }
    } catch {
      setHistoryItems([]);
      // Continue loading from server if local storage fails
    }

    // Fetch fresh data from server (always do this if no local data, or in background if local data exists)
    try {
      const [contexts, myProfiles] = await Promise.all([
        evaluationContextService.getMyContexts(),
        profileService.getMyProfile(),
      ]);

      const scopedContexts = routeProfileId
        ? contexts.filter((context) => context.profileId === routeProfileId)
        : contexts;

      const uniqueProductIds = Array.from(
        new Set(scopedContexts.map((context) => context.productId)),
      );
      const uniqueProfileIds = Array.from(
        new Set(scopedContexts.map((context) => context.profileId)),
      );

      const profileMap = new Map<string, Profile>(
        myProfiles.map((profile) => [profile.id, profile]),
      );

      const missingProfileIds = uniqueProfileIds.filter(
        (id) => !profileMap.has(id),
      );
      if (missingProfileIds.length > 0) {
        const missingProfiles = await Promise.all(
          missingProfileIds.map(async (profileId) => {
            try {
              return await profileService.getProfileById(profileId);
            } catch {
              return null;
            }
          }),
        );

        missingProfiles
          .filter((item): item is Profile => Boolean(item))
          .forEach((item) => {
            profileMap.set(item.id, item);
          });
      }

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

      const sortedContexts = [...scopedContexts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const items = sortedContexts.map((context: EvaluationContext) => {
        const product = productMap.get(context.productId);
        const profile = profileMap.get(context.profileId);

        return {
          evaluationContextId: context.id,
          productName: product?.name ?? "Unknown product",
          profileName: profile?.first_name?.trim() || "Unknown profile",
          createdAt: context.createdAt,
          status:
            typeof context.resultJson?.status === "string"
              ? context.resultJson.status
              : undefined,
          summary:
            typeof context.resultJson?.summary === "string"
              ? context.resultJson.summary
              : undefined,
          imageUri: product?.product_image ?? null,
        } satisfies EvaluationHistoryCard;
      });

      setProfiles(Array.from(profileMap.values()));
      setHistoryItems(items); // Update with server data

      // Always set loading to false after server fetch completes
      setLoading(false);
    } catch {
      // If server fetch fails, still stop loading and show what we have
      setLoading(false);
    }
  }, [routeProfileId]);

  React.useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  React.useEffect(() => {
    // Load profiles once for the switcher and keep them cached
    profileService
      .getMyProfile()
      .then((myProfiles) => {
        cachedProfiles = myProfiles;
        setProfiles(myProfiles);
      })
      .catch(() => {
        setProfiles((current) => (current.length > 0 ? current : []));
      });
  }, []);

  const activeProfile = React.useMemo(
    () =>
      (routeProfileId
        ? profiles.find((profile) => profile.id === routeProfileId)
        : undefined) ??
      profiles.find((profile) => profile.main_profile) ??
      profiles[0],
    [profiles, routeProfileId],
  );

  const profileSwitcherItems = React.useMemo(() => {
    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.first_name?.trim() || "Profile",
      avatarSource: profile.profile_image
        ? { uri: profile.profile_image }
        : undefined,
      isMain: profile.main_profile,
    }));
  }, [profiles]);

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

      {/* SwitchProfile with scroll trigger - animates marginTop on scroll */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        stickyHeaderIndices={[1]}
      >
        <NavBarTop notificationCount={0} />



        {/* Sticky header: back button sits above SwitchProfile */}
        <Box>
          <BackButton />       
           {/* Profile switcher with scroll animation - sticky at top */}
          <SwitchProfile
          hasBackButton
            profiles={profileSwitcherItems}
            activeProfileId={activeProfile?.id}
            onSelectProfile={(profileId) => {
              navigation.setParams({ profileId });
            }}
            onAddProfile={() => {
              navigation.navigate("ProfileScreen");
            }}
            onEditProfile={(profileId) => {
              const profileToEdit =
                profiles.find((profile) => profile.id === profileId) ??
                activeProfile;
              navigation.navigate("EditProfileScreen", {
                profileId: profileToEdit?.id,
                profileName: profileToEdit?.first_name || undefined,
                profileImageUri: profileToEdit?.profile_image ?? undefined,
                profilePreferenceNames:
                  profileToEdit?.preferences?.map((item) => item.name) ?? [],
                profileAge: profileToEdit?.age?.toString()?.trim() || undefined,
                profileIsMain: profileToEdit?.main_profile ?? false,
              });
            }}
            title="Switch Profile"
            hasScrolled={hasScrolled}
          />
        </Box>
        <Box px="$2">
          <AllEvaluations
            items={historyItems}
            loading={loading}
            useExternalScroll
            showProfileSwitcher={false}
            onPressItem={(item) => {
              navigation.navigate("EvaluationResultScreen", {
                evaluationContextId: item.evaluationContextId,
              });
            }}
            onDeleteEvaluation={(evaluationContextId) => {
              setHistoryItems((prev) =>
                prev.filter(
                  (item) => item.evaluationContextId !== evaluationContextId,
                ),
              );
            }}
          />
        </Box>
      </ScrollView>

      <NavBarBottom
        activeTab="history"
        avatarSource={
          activeProfile?.profile_image
            ? { uri: activeProfile.profile_image }
            : undefined
        }
        onPressHome={() => {
          if (navigation.canGoBack()) {
            navigation.dispatch(StackActions.popToTop());
            return;
          }

          navigation.navigate("LandingScreen");
        }}
        onPressProfile={() => {
          navigation.navigate("EditProfileScreen", {
            profileId: activeProfile?.id,
            profileName: activeProfile?.first_name || undefined,
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
