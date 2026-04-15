import React from "react";
import { Box, Text } from "@gluestack-ui/themed";
import { NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import CreateEvaluations from "../ShowEvaluation";
import { evaluationContextService, productService, profileService } from "../../services";
import type { EvaluationContext } from "../../services/evaluationContextService";
import type { Product } from "../../services/productService";
import type { Profile } from "../../services/profileService";
import type { AuthStackParamList } from "../../types/navigation";

type EvaluationResultRoute = RouteProp<AuthStackParamList, "EvaluationResultScreen">;

export default function EvaluationResultScreen() {
  const route = useRoute<EvaluationResultRoute>();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const [loading, setLoading] = React.useState(true);
  const [context, setContext] = React.useState<EvaluationContext | null>(null);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadEvaluation = async () => {
      setLoading(true);

      try {
        const selectedContext = await evaluationContextService.getById(
          route.params.evaluationContextId,
        );

        const [selectedProduct, selectedProfile] = await Promise.all([
          productService.getProductById(selectedContext.productId),
          profileService.getProfileById(selectedContext.profileId),
        ]);

        if (!isMounted) {
          return;
        }

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

  if (loading) {
    return (
      <Box flex={1} bg="#F8FBFF" alignItems="center" justifyContent="center" px="$5">
        <Text fontSize={16} lineHeight={20} color="#4E6074" fontFamily="RobotoMedium">
          Loading evaluation...
        </Text>
      </Box>
    );
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

  return (
    <CreateEvaluations
      imageUri={product?.product_image ?? undefined}
      productName={product?.name ?? "Evaluated Product"}
      greetingName={profile?.first_name?.trim() || "Lili"}
      profileImageUri={profile?.profile_image}
      currentProfileAllergens={profile?.allergens?.map((item) => item.name) ?? []}
      currentProfileConditions={profile?.conditions?.map((item) => item.name) ?? []}
      currentProfilePreferences={profile?.preferences?.map((item) => item.name) ?? []}
      resultJson={context.resultJson}
      onRetake={() => {
        navigation.navigate("CameraScreen", {
          profileId: context.profileId,
        });
      }}
    />
  );
}
