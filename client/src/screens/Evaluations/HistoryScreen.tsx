import React from "react";
import { NavigationProp, RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Box, ScrollView } from "@gluestack-ui/themed";
import NavBarBottom from "../../components/general/NavBarBottom";
import NavBarTop from "../../components/general/NavBarTop";
import AllEvaluations, {
  EvaluationHistoryCard,
} from "../../components/evaluations/AllEvaluations";
import { evaluationContextService, productService, profileService } from "../../services";
import type { AuthStackParamList } from "../../types/navigation";
import type { EvaluationContext } from "../../services/evaluationContextService";
import type { Product } from "../../services/productService";
import type { Profile } from "../../services/profileService";
import { styles } from "../../style/LandingPageStyle";

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "HistoryScreen">>();
  const routeProfileId = route.params?.profileId;

  const [loading, setLoading] = React.useState(true);
  const [historyItems, setHistoryItems] = React.useState<EvaluationHistoryCard[]>([]);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);

  const loadHistory = React.useCallback(async () => {
    setLoading(true);

    try {
      const [contexts, myProfiles] = await Promise.all([
        evaluationContextService.getMyContexts(),
        profileService.getMyProfile(),
      ]);

      const scopedContexts = routeProfileId
        ? contexts.filter((context) => context.profileId === routeProfileId)
        : contexts;

      const uniqueProductIds = Array.from(new Set(scopedContexts.map((context) => context.productId)));
      const uniqueProfileIds = Array.from(new Set(scopedContexts.map((context) => context.profileId)));

      const profileMap = new Map<string, Profile>(
        myProfiles.map((profile) => [profile.id, profile]),
      );

      const missingProfileIds = uniqueProfileIds.filter((id) => !profileMap.has(id));
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
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
      setHistoryItems(items);
    } catch {
      setProfiles([]);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  }, [routeProfileId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const activeProfile = React.useMemo(
    () =>
      (routeProfileId ? profiles.find((profile) => profile.id === routeProfileId) : undefined) ??
      profiles.find((profile) => profile.main_profile) ??
      profiles[0],
    [profiles, routeProfileId],
  );

  const profileSwitcherItems = React.useMemo(() => {
    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.first_name?.trim() || "Profile",
      avatarSource: profile.profile_image ? { uri: profile.profile_image } : undefined,
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
      >
        <NavBarTop notificationCount={0} />

        <AllEvaluations
          items={historyItems}
          loading={loading}
          profileSwitcherItems={profileSwitcherItems}
          activeProfileId={activeProfile?.id}
          onSelectProfile={(profileId) => {
            navigation.navigate("HistoryScreen", { profileId });
          }}
          onAddProfile={() => {
            navigation.navigate("ProfileScreen");
          }}
          onEditProfile={(profileId) => {
            const profileToEdit = profiles.find((profile) => profile.id === profileId) ?? activeProfile;

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
          onPressItem={(item) => {
            navigation.navigate("EvaluationResultScreen", {
              evaluationContextId: item.evaluationContextId,
            });
          }}
        />
      </ScrollView>

      <NavBarBottom
        activeTab="history"
        avatarSource={
          activeProfile?.profile_image
            ? { uri: activeProfile.profile_image }
            : undefined
        }
        onPressHome={() => {
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
