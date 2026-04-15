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
import BackButton from "../Buttons/BackButton";
import profileApiService, { Profile } from "../../services/profileService";
import { AuthStackParamList } from "../../types/navigation";

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getConditionAccent(name: string) {
  const key = normalizeName(name);

  if (key.includes("eczema")) {
    return { icon: "droplet" as const, iconBg: "#FF6B63" };
  }

  if (key.includes("dermatitis")) {
    return { icon: "activity" as const, iconBg: "#FFAA4C" };
  }

  return { icon: "shield" as const, iconBg: "#66B9E8" };
}

export type ConditionOption = {
  id: string;
  name: string;
};

export type AddConditionProps = {
  profileId?: string;
};

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

export default function AddCondition() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "ConditionScreen">>();
  const routeProfileId = route.params?.profileId;

  const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = React.useState<string | null>(routeProfileId ?? null);
  const [availableConditions, setAvailableConditions] = React.useState<ConditionOption[]>([]);
  const [draftSelectedIds, setDraftSelectedIds] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const activeProfile = React.useMemo(
    () => allProfiles.find((profile) => profile.id === activeProfileId),
    [allProfiles, activeProfileId],
  );

  const selectedConditions = React.useMemo(
    () => availableConditions.filter((item) => draftSelectedIds.includes(item.id)),
    [availableConditions, draftSelectedIds],
  );

  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [fetchedProfiles, fetchedConditions] = await Promise.all([
          profileApiService.getMyProfile(),
          profileApiService.getAllConditions(),
        ]);

        if (!isMounted) {
          return;
        }

        setAllProfiles(fetchedProfiles);
        setAvailableConditions(
          fetchedConditions.map((item) => ({ id: item.id, name: item.name })),
        );

        const fallbackProfile = fetchedProfiles.find((item) => item.main_profile) ?? fetchedProfiles[0];
        const nextProfileId =
          routeProfileId && fetchedProfiles.some((item) => item.id === routeProfileId)
            ? routeProfileId
            : fallbackProfile?.id ?? null;

        setActiveProfileId(nextProfileId);

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

    return () => {
      isMounted = false;
    };
  }, [routeProfileId]);

  const toggleCondition = (conditionId: string) => {
    setDraftSelectedIds((prev) =>
      prev.includes(conditionId)
        ? prev.filter((id) => id !== conditionId)
        : uniqueIds([...prev, conditionId])
    );
  };

  const handleSave = async () => {
    if (!activeProfileId) {
      navigation.goBack();
      return;
    }

    try {
      setIsSaving(true);
      await profileApiService.updateProfile(activeProfileId, {
        conditionIds: uniqueIds(draftSelectedIds),
      });
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
          Manage Conditions
        </Text>
        <Pressable onPress={() => navigation.goBack()} p="$1" borderRadius="$full">
          <Icon as={CloseIcon} size="md" color="#111111" />
        </Pressable>
      </HStack>

      <Text fontSize={13} lineHeight={16} fontFamily="Roboto" color="#6B7280" mb="$3">
        Editing conditions for {activeProfile?.first_name ?? "your profile"}
      </Text>

      <Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
        Current Conditions
      </Text>

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

      <Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
        Add / Remove Conditions
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} flex={1}>
        <Box style={{ gap: 10, paddingBottom: 12 }}>
          {availableConditions.map((item) => {
            const selected = draftSelectedIds.includes(item.id);
            const accent = getConditionAccent(item.name);

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
                  opacity: isSaving || isLoading ? 0.7 : 1,
                }}
              >
                <Box style={{ flexDirection: "row", alignItems: "center", minHeight: 72 }}>
                  <Box style={{ width: 10, alignSelf: "stretch", backgroundColor: accent.iconBg }} />

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

                  <Text
                    fontSize={18}
                    lineHeight={22}
                    color="#111827"
                    fontFamily="RobotoMedium"
                    style={{ marginLeft: 12, flex: 1 }}
                  >
                    {item.name}
                  </Text>

                  <Box style={{ marginRight: 14 }}>
                    <Feather name={selected ? "check-circle" : "plus-circle"} size={22} color={selected ? "#0284C7" : "#94A3B8"} />
                  </Box>
                </Box>
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
          {isSaving ? "Saving..." : isLoading ? "Loading..." : "Save Conditions"}
        </Text>
      </Pressable>
    </Box>
  );
}
