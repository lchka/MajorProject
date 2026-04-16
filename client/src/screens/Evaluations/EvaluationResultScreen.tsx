import React from "react";
import { Alert } from "react-native";
import { Box, Text } from "@gluestack-ui/themed";
import { NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import CreateEvaluations from "./ShowEvaluation";
import LoadingScreen from "../../components/general/loadingScreen";
import { type DifferentProfileItem } from "../../components/profile/DifferentProfile";
import {
  evaluationContextService,
  productService,
  profileService,
  removeLocalEvaluationById,
} from "../../services";
import type { EvaluationContext } from "../../services/evaluationContextService";
import type { Product } from "../../services/productService";
import type { Profile } from "../../services/profileService";
import type { AuthStackParamList } from "../../types/navigation";
import { resolveMediaUrl } from "../../config/api";

type EvaluationResultRoute = RouteProp<AuthStackParamList, "EvaluationResultScreen">;

type EvaluationVariant = {
  context: EvaluationContext;
  profile: Profile;
};

const RELATED_EVALUATION_WINDOW_MS = 2 * 60 * 1000;

export default function EvaluationResultScreen() {
  const route = useRoute<EvaluationResultRoute>();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const [loading, setLoading] = React.useState(true);
  const [isReEvaluating, setIsReEvaluating] = React.useState(false);
  const [context, setContext] = React.useState<EvaluationContext | null>(null);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [evaluationVariants, setEvaluationVariants] = React.useState<EvaluationVariant[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    const loadEvaluation = async () => {
      setLoading(true);

      try {
        const selectedContext = await evaluationContextService.getById(
          route.params.evaluationContextId,
        );

        const [selectedProduct, selectedProfile, allContexts, myProfiles] = await Promise.all([
          productService.getProductById(selectedContext.productId),
          profileService.getProfileById(selectedContext.profileId),
          evaluationContextService.getMyContexts(),
          profileService.getMyProfile(),
        ]);

        const selectedTimestamp = new Date(selectedContext.createdAt).getTime();
        const candidateContexts = allContexts.filter((item) => {
          if (item.productId !== selectedContext.productId) {
            return false;
          }

          const itemTimestamp = new Date(item.createdAt).getTime();
          return Math.abs(itemTimestamp - selectedTimestamp) <= RELATED_EVALUATION_WINDOW_MS;
        });

        const contextList = candidateContexts.some((item) => item.id === selectedContext.id)
          ? candidateContexts
          : [selectedContext, ...candidateContexts];

        const profileMap = new Map<string, Profile>(
          myProfiles.map((item) => [item.id, item]),
        );
        if (!profileMap.has(selectedProfile.id)) {
          profileMap.set(selectedProfile.id, selectedProfile);
        }

        const missingProfileIds = Array.from(
          new Set(contextList.map((item) => item.profileId).filter((id) => !profileMap.has(id))),
        );

        if (missingProfileIds.length > 0) {
          const fetchedMissing = await Promise.all(
            missingProfileIds.map(async (profileId) => {
              try {
                return await profileService.getProfileById(profileId);
              } catch {
                return null;
              }
            }),
          );

          fetchedMissing
            .filter((item): item is Profile => Boolean(item))
            .forEach((item) => {
              profileMap.set(item.id, item);
            });
        }

        const variants = contextList
          .map((item) => {
            const variantProfile = profileMap.get(item.profileId);
            if (!variantProfile) {
              return null;
            }

            return {
              context: item,
              profile: variantProfile,
            } satisfies EvaluationVariant;
          })
          .filter((item): item is EvaluationVariant => Boolean(item));

        const orderedVariants = [
          ...variants.filter((item) => item.context.id === selectedContext.id),
          ...variants.filter((item) => item.context.id !== selectedContext.id),
        ];

        if (!isMounted) {
          return;
        }

        setEvaluationVariants(orderedVariants);
        setContext(selectedContext);
        setProduct(selectedProduct);
        setProfile(selectedProfile);
      } catch {
        if (!isMounted) {
          return;
        }

        setContext(null);
        setProduct(null);
        setProfile(null);
        setEvaluationVariants([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadEvaluation();

    return () => {
      isMounted = false;
    };
  }, [route.params.evaluationContextId]);

  const differentProfiles = React.useMemo<DifferentProfileItem[]>(() => {
    return evaluationVariants.map(({ profile: itemProfile }) => {
      const avatarUri = resolveMediaUrl(itemProfile.profile_image);
      return {
        id: itemProfile.id,
        name: itemProfile.first_name?.trim() || "Profile",
        avatarSource: avatarUri ? { uri: avatarUri } : undefined,
        isMain: itemProfile.main_profile,
      };
    });
  }, [evaluationVariants]);

  const handleReEvaluate = React.useCallback(async () => {
    if (!context || !profile) {
      return;
    }

    try {
      setIsReEvaluating(true);
      const nextContext = await evaluationContextService.evaluateProduct({
        productId: context.productId,
        profileId: profile.id,
        promptId: context.promptId ?? undefined,
      });

      navigation.navigate("EvaluationResultScreen", {
        evaluationContextId: nextContext.id,
      });
    } catch {
      Alert.alert("Re-evaluation failed", "Could not re-evaluate this product right now.");
    } finally {
      setIsReEvaluating(false);
    }
  }, [context, navigation, profile]);

  if (loading) {
    return <LoadingScreen staged={false} message="Loading evaluation..." />;
  }

  if (isReEvaluating) {
    return <LoadingScreen staged={false} message="Re-evaluating profile..." />;
  }

  if (!context) {
    return (
      <Box flex={1} bg="#F8FBFF" alignItems="center" justifyContent="center" px="$5">
        <Text fontSize={16} lineHeight={20} color="#4E6074" fontFamily="RobotoMedium" textAlign="center">
          Could not load this evaluation result.
        </Text>
      </Box>
    );
  }

  const handleDelete = async () => {
    if (!context) {
      return;
    }

    Alert.alert(
      "Delete Evaluation",
      "Are you sure you want to delete this evaluation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await evaluationContextService.deleteById(context.id);
              await removeLocalEvaluationById(context.id);
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("HistoryScreen", { profileId: context.profileId });
              }
            } catch {
              Alert.alert("Delete failed", "Could not delete this evaluation right now.");
            }
          },
        },
      ],
    );
  };

  return (
    <CreateEvaluations
      imageUri={product?.product_image ?? undefined}
      productName={product?.name ?? "Evaluated Product"}
      greetingName={profile?.first_name?.trim() || "Lili"}
      profileImageUri={profile?.profile_image}
      differentProfiles={differentProfiles}
      activeDifferentProfileId={profile?.id}
      onSelectDifferentProfile={(selectedProfileId) => {
        const selectedVariant = evaluationVariants.find(
          (item) => item.profile.id === selectedProfileId,
        );

        if (!selectedVariant) {
          return;
        }

        setContext(selectedVariant.context);
        setProfile(selectedVariant.profile);
      }}
      currentProfileAllergens={profile?.allergens?.map((item) => item.name) ?? []}
      currentProfileConditions={profile?.conditions?.map((item) => item.name) ?? []}
      currentProfilePreferences={profile?.preferences?.map((item) => item.name) ?? []}
      resultJson={context.resultJson}
      onDelete={handleDelete}
      onRetake={() => {
        void handleReEvaluate();
      }}
      onPressProfile={() => {
        const fullName = [profile?.first_name?.trim(), profile?.last_name?.trim()]
          .filter(Boolean)
          .join(" ");

        navigation.navigate("EditProfileScreen", {
          profileId: profile?.id,
          profileName: fullName || profile?.first_name || undefined,
          profileImageUri: profile?.profile_image ?? undefined,
          profilePreferenceNames: profile?.preferences?.map((item) => item.name) ?? [],
          profileAge: profile?.age?.toString()?.trim() || undefined,
          profileIsMain: profile?.main_profile ?? false,
        });
      }}
    />
  );
}
