import React from "react";
import { NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import {
  Box,
  CloseIcon,
  HStack,
  Icon,
  Image,
  Pressable,
  ScrollView,
  Text,
} from "@gluestack-ui/themed";
import BackButton from "../../components/Buttons/BackButton";
import { profileService, Profile } from "../../services/profileService";
import { allergenService } from "../../services/allergenService";
import { AuthStackParamList } from "../../types/navigation";

type AllergenOption = {
  id: string;
  name: string;
};

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

const allergenImageByKey: Record<string, number> = {
  balsam: require("../../../assets/allergens/balsam.png"),
  cocamidopropylbetaine: require("../../../assets/allergens/Cocamidopropyl-Betaine.png"),
  formaldehyde: require("../../../assets/allergens/formaldehyde.png"),
  fragrance: require("../../../assets/allergens/fragrance.png"),
  lanolin: require("../../../assets/allergens/lanolin.png"),
  nickel: require("../../../assets/allergens/nickel.png"),
  paraben: require("../../../assets/allergens/paraben.png"),
  ppd: require("../../../assets/allergens/ppd.png"),
  phenylenediamine: require("../../../assets/allergens/ppd.png"),
  preservative: require("../../../assets/allergens/preservative.png"),
  mcimi: require("../../../assets/allergens/preservative.png"),
  propyleneglycol: require("../../../assets/allergens/Propylene Glycol.png"),
};

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function getAllergenImageSource(name: string) {
  const key = normalizeName(name);

  for (const [token, source] of Object.entries(allergenImageByKey)) {
    if (key.includes(token)) {
      return source;
    }
  }

  return require("../../../assets/allergens/fragrance.png");
}

export default function AddAllergen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "AllergenScreen">>();
  const routeProfileId = route.params?.profileId;

  const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = React.useState<string | null>(routeProfileId ?? null);
  const [availableAllergens, setAvailableAllergens] = React.useState<AllergenOption[]>([]);
  const [draftSelectedIds, setDraftSelectedIds] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const activeProfile = React.useMemo(
    () => allProfiles.find((profile) => profile.id === activeProfileId),
    [allProfiles, activeProfileId],
  );

  const selectedAllergens = React.useMemo(
    () => availableAllergens.filter((item) => draftSelectedIds.includes(item.id)),
    [availableAllergens, draftSelectedIds],
  );

  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [fetchedProfiles, fetchedAllergens] = await Promise.all([
          profileService.getMyProfile(),
          allergenService.getAllAllergens(),
        ]);

        if (!isMounted) {
          return;
        }

        setAllProfiles(fetchedProfiles);
        setAvailableAllergens(
          fetchedAllergens.map((item) => ({ id: item.id, name: item.name })),
        );

        const fallbackProfile = fetchedProfiles.find((item) => item.main_profile) ?? fetchedProfiles[0];
        const nextProfileId =
          routeProfileId && fetchedProfiles.some((item) => item.id === routeProfileId)
            ? routeProfileId
            : fallbackProfile?.id ?? null;

        setActiveProfileId(nextProfileId);

        const initialSelectedIds =
          fetchedProfiles.find((item) => item.id === nextProfileId)?.allergens?.map((item) => item.id) ?? [];
        setDraftSelectedIds(uniqueIds(initialSelectedIds));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [routeProfileId]);

  const toggleAllergen = (allergenId: string) => {
    setDraftSelectedIds((previous) =>
      previous.includes(allergenId)
        ? previous.filter((item) => item !== allergenId)
        : uniqueIds([...previous, allergenId]),
    );
  };

  const handleSave = async () => {
    if (!activeProfileId) {
      navigation.goBack();
      return;
    }

    try {
      setIsSaving(true);
      await allergenService.saveAllergens(activeProfileId, draftSelectedIds);
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box flex={1} bg="#FFFFFF" px="$4" mt="$7" pt="$5" pb="$4">
      <HStack alignItems="center" justifyContent="space-between" mb="$3">
        <BackButton />
        <Text fontSize={22} lineHeight={24} fontFamily="RobotoMedium" color="#151515">
          Manage Allergens
        </Text>
        <Pressable onPress={() => navigation.goBack()} p="$1" borderRadius="$full">
          <Icon as={CloseIcon} size="md" color="#111111" />
        </Pressable>
      </HStack>

      <Text fontSize={13} lineHeight={16} fontFamily="Roboto" color="#6B7280" mb="$3">
        Editing allergens for {activeProfile?.first_name ?? "your profile"}
      </Text>

      <Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
        Current Allergens
      </Text>

      <Box flexDirection="row" flexWrap="wrap" gap={8} mb="$4">
        {selectedAllergens.length > 0 ? (
          selectedAllergens.map((item) => (
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
            No allergens selected yet.
          </Text>
        )}
      </Box>

      <Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
        Add / Remove Allergens
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} flex={1}>
        <Box flexDirection="row" flexWrap="wrap" gap={10} pb="$3">
          {availableAllergens.map((item) => {
            const selected = draftSelectedIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleAllergen(item.id)}
                borderWidth={2}
                borderColor={selected ? "#38BDF8" : "#E5E7EB"}
                bg={selected ? "#E0F2FE" : "#FFFFFF"}
                borderRadius={14}
                p="$2"
                width={108}
                alignItems="center"
                shadowColor={selected ? "#38BDF8" : "transparent"}
                shadowOpacity={selected ? 0.45 : 0}
                shadowRadius={selected ? 10 : 0}
                shadowOffset={{ width: 0, height: 0 }}
                elevation={selected ? 6 : 0}
              >
                <Image
                  source={getAllergenImageSource(item.name)}
                  alt={`${item.name} allergen`}
                  resizeMode="contain"
                  style={{ width: 48, height: 48 }}
                />
                <Text mt="$1.5" textAlign="center" fontSize={11} lineHeight={12} fontFamily="RobotoMedium" color="#111827">
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </ScrollView>

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
          {isSaving ? "Saving..." : isLoading ? "Loading..." : "Save Allergens"}
        </Text>
      </Pressable>
    </Box>
  );
}
