import React from "react";
import { TextInput } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import {
  Box,
  Image,
  Pressable,
  ScrollView,
  Text,
  VStack,
  HStack,
} from "@gluestack-ui/themed";
import NavBarTop from "../../components/general/NavBarTop";
import EvaluationProfile, {
  type EvaluationProfileItem,
} from "../../components/profile/EvaluationProfile";
import type { Product } from "../../services/productService";
import BackButton from "../../components/Buttons/BackButton";
// Component for displaying the details of a product that has been captured and evaluated. It shows the product image, name, brand, category, and pulled ingredients, allowing the user to confirm the information before proceeding to the evaluation results. The component also provides options to edit the pulled ingredients and to continue to the evaluation profile selection or retake the photo if the product information is incorrect.
type ShowProductProps = {
  product: Product;
  capturedUri: string;
  isProcessing: boolean;
  evaluationProfiles: EvaluationProfileItem[];
  defaultProfileId?: string;
  onContinue: (ingredients: string[], profileIds: string[]) => void;
  onRetake: () => void;
};

const toIngredientList = (value: Product["ingredients"]): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
};

export default function ShowProduct({
  product,
  capturedUri,
  isProcessing,
  evaluationProfiles,
  defaultProfileId,
  onContinue,
  onRetake,
}: ShowProductProps) {
  const [isIngredientsExpanded, setIsIngredientsExpanded] =
    React.useState(false);
  const [isEditingIngredients, setIsEditingIngredients] = React.useState(false);
  const [isEvaluationProfileOpen, setIsEvaluationProfileOpen] =
    React.useState(false);
  const [ingredientsText, setIngredientsText] = React.useState("");

  React.useEffect(() => {
    const ingredients = toIngredientList(product.ingredients);
    setIngredientsText(ingredients.join(", "));
    setIsEditingIngredients(false);
  }, [product.id, product.ingredients]);
// useMemo to parse the ingredients text into a list of individual ingredients whenever the text changes. It splits the text by commas, trims whitespace from each ingredient, and filters out any empty strings, resulting in a clean array of ingredient names that can be used for the evaluation.
  const parsedIngredients = React.useMemo(() => {
    return ingredientsText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, [ingredientsText]);

  return (
    <Box flex={1} bg="#F4F7FB">
      <NavBarTop notificationCount={0} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <Box px="$5" pt="$4" pb="$6">
          {/* Header */}
          <VStack space="xs" mb="$5">
            {/* Wrap the button and title in an HStack to put them inline */}
            <HStack alignItems="center" space="sm">
              <BackButton />
              <Text
                fontSize={30}
                lineHeight={34}
                color="#0F172A"
                fontFamily="RobotoMedium"
              >
                Product Found
              </Text>
            </HStack>

            <Text fontSize={14} color="#64748B">
              Confirm the product before continuing
            </Text>
          </VStack>

          {/* Product Card */}
          <Box
            borderRadius={22}
            overflow="hidden"
            bg="white"
            shadowColor="#000"
            shadowOpacity={0.06}
            shadowRadius={12}
            elevation={4}
          >
            {/* Image */}
            <Image
              source={{ uri: product.product_image ?? capturedUri }}
              alt={product.name}
              style={{ width: "100%", height: 280 }}
              resizeMode="cover"
            />

            {/* Content */}
            <VStack px="$5" py="$4" space="sm">
              {/* Product Name */}
              <Text
                fontSize={24}
                lineHeight={28}
                color="#0F172A"
                fontFamily="RobotoMedium"
              >
                {product.name}
              </Text>

              {/* Meta Info */}
              <HStack space="sm" flexWrap="wrap">
                {product.brand && (
                  <Box bg="#EEF4FF" px="$3" py="$1" borderRadius="$full">
                    <Text fontSize={12} color="#3B82F6">
                      {product.brand}
                    </Text>
                  </Box>
                )}

                {product.category && (
                  <Box bg="#F1F5F9" px="$3" py="$1" borderRadius="$full">
                    <Text fontSize={12} color="#475569">
                      {product.category}
                    </Text>
                  </Box>
                )}
              </HStack>
{/* Ingredients */}
              <Box mt="$3">
                <HStack
                  alignItems="center"
                  justifyContent="space-between"
                  mb="$2"
                >
                  <Text fontSize={14} color="#334155" fontFamily="RobotoMedium">
                    Pulled Ingredients
                  </Text>

                  <HStack space="xs" alignItems="center">
                    <Pressable
                      onPress={() => {
                        setIsIngredientsExpanded((previous) => !previous);
                      }}
                      p="$1.5"
                      borderRadius="$full"
                      bg="#EEF2F7"
                      borderWidth={1}
                      borderColor="#D6DEE8"
                    >
                      <Feather
                        name={
                          isIngredientsExpanded ? "chevron-up" : "chevron-down"
                        }
                        size={15}
                        color="#5B6B7A"
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setIsEditingIngredients((previous) => !previous);
                        if (!isIngredientsExpanded) {
                          setIsIngredientsExpanded(true);
                        }
                      }}
                      p="$1.5"
                      borderRadius="$full"
                      bg={isEditingIngredients ? "#DFF0FF" : "#EEF2F7"}
                      borderWidth={1}
                      borderColor={isEditingIngredients ? "#8EC5F0" : "#D6DEE8"}
                    >
                      <Feather
                        name="edit-2"
                        size={14}
                        color={isEditingIngredients ? "#2E96CB" : "#5B6B7A"}
                      />
                    </Pressable>
                  </HStack>
                </HStack>

                {isIngredientsExpanded ? (
                  isEditingIngredients ? (
                    <Box
                      borderWidth={1}
                      borderColor="#CBD5E1"
                      borderRadius={12}
                      bg="#FFFFFF"
                      px="$3"
                      py="$2"
                    >
                      <TextInput
                        value={ingredientsText}
                        onChangeText={setIngredientsText}
                        multiline
                        textAlignVertical="top"
                        placeholder="Enter ingredients separated by commas"
                        placeholderTextColor="#94A3B8"
                        style={{
                          minHeight: 86,
                          fontSize: 14,
                          lineHeight: 20,
                          color: "#1E293B",
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      borderWidth={1}
                      borderColor="#E2E8F0"
                      borderRadius={12}
                      bg="#F8FAFC"
                      px="$3"
                      py="$2.5"
                    >
                      <Text fontSize={13} lineHeight={18} color="#475569">
                        {parsedIngredients.length > 0
                          ? parsedIngredients.join(", ")
                          : "No ingredients were detected. Tap the pencil to add them."}
                      </Text>
                    </Box>
                  )
                ) : null}
              </Box>
            </VStack>
          </Box>

          {/* Actions */}
          <VStack mt="$6" space="sm">
            <Pressable
              onPress={() => {
                setIsEvaluationProfileOpen(true);
              }}
              disabled={isProcessing}
              style={{
                height: 54,
                borderRadius: 16,
                backgroundColor: "#4D9FD8",
                alignItems: "center",
                justifyContent: "center",
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              <Text fontSize={16} color="#FFFFFF" fontFamily="RobotoMedium">
                Continue to Evaluation
              </Text>
            </Pressable>

            <Pressable
              onPress={onRetake}
              style={{
                height: 50,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text fontSize={15} color="#475569" fontFamily="RobotoMedium">
                Retake Photo
              </Text>
            </Pressable>
          </VStack>
        </Box>
      </ScrollView>

      <EvaluationProfile
        isOpen={isEvaluationProfileOpen}
        onClose={() => {
          setIsEvaluationProfileOpen(false);
        }}
        profiles={evaluationProfiles}
        defaultProfileId={defaultProfileId}
        onSubmit={(selectedProfileIds) => {
          setIsEvaluationProfileOpen(false);
          onContinue(parsedIngredients, selectedProfileIds);
        }}
      />
    </Box>
  );
}
