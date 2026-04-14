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
import BackButton from "../components/Buttons/BackButton";
import profileService, { Profile } from "../services/profileService";
import { AuthStackParamList } from "../types/navigation";

type PreferenceOption = {
	id: string;
	name: string;
};

const preferenceImageByKey: Record<string, number> = {
	"alcohol free": require("../../assets/preferences/alcohol-free.png"),
	"non comedogenic": require("../../assets/preferences/comedogenic.png"),
	comedogenic: require("../../assets/preferences/comedogenic.png"),
	"cruelty free": require("../../assets/preferences/cruelty-free (1).png"),
	eco: require("../../assets/preferences/eco.png"),
	"fragrance free": require("../../assets/preferences/fragrance-free.png"),
	hypoallergenic: require("../../assets/preferences/hypoallergenic.png"),
	hypoallergenice: require("../../assets/preferences/hypoallergenic.png"),
	organic: require("../../assets/preferences/organic.png"),
	"paraben free": require("../../assets/preferences/paraben-free.png"),
	"sulfate free": require("../../assets/preferences/sulfate-free.png"),
	"sulphate free": require("../../assets/preferences/sulfate-free.png"),
	vegan: require("../../assets/preferences/vegan (1).png"),
};

function normalizeName(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getPreferenceImageSource(name: string) {
	const key = normalizeName(name);
	return preferenceImageByKey[key] ?? require("../../assets/preferences/eco.png");
}

export default function PreferenceScreen() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
	const route = useRoute<RouteProp<AuthStackParamList, "PreferenceScreen">>();
	const routeProfileId = route.params?.profileId;

	const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]);
	const [activeProfileId, setActiveProfileId] = React.useState<string | null>(routeProfileId ?? null);
	const [availablePreferences, setAvailablePreferences] = React.useState<PreferenceOption[]>([]);
	const [draftSelectedIds, setDraftSelectedIds] = React.useState<string[]>([]);
	const [isSaving, setIsSaving] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState(true);

	const activeProfile = React.useMemo(
		() => allProfiles.find((profile) => profile.id === activeProfileId),
		[allProfiles, activeProfileId],
	);

	const selectedPreferences = React.useMemo(
		() => availablePreferences.filter((item) => draftSelectedIds.includes(item.id)),
		[availablePreferences, draftSelectedIds],
	);

	React.useEffect(() => {
		let isMounted = true;

		const loadData = async () => {
			try {
				setIsLoading(true);
				const [fetchedProfiles, fetchedPreferences] = await Promise.all([
					profileService.getMyProfile(),
					profileService.getAllPreferences(),
				]);

				if (!isMounted) {
					return;
				}

				setAllProfiles(fetchedProfiles);
				setAvailablePreferences(fetchedPreferences.map((item) => ({ id: item.id, name: item.name })));

				const fallbackProfile = fetchedProfiles.find((item) => item.main_profile) ?? fetchedProfiles[0];
				const nextProfileId =
					routeProfileId && fetchedProfiles.some((item) => item.id === routeProfileId)
						? routeProfileId
						: fallbackProfile?.id ?? null;

				setActiveProfileId(nextProfileId);

				const initialSelectedIds =
					fetchedProfiles.find((item) => item.id === nextProfileId)?.preferences?.map((item) => item.id) ?? [];
				setDraftSelectedIds(initialSelectedIds);
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

	const togglePreference = (preferenceId: string) => {
		setDraftSelectedIds((previous) =>
			previous.includes(preferenceId)
				? previous.filter((item) => item !== preferenceId)
				: [...previous, preferenceId],
		);
	};

	const handleSave = async () => {
		if (!activeProfileId) {
			navigation.goBack();
			return;
		}

		try {
			setIsSaving(true);
			await profileService.updateProfile(activeProfileId, {
				preferenceIds: draftSelectedIds,
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
					Manage Preferences
				</Text>
				<Pressable onPress={() => navigation.goBack()} p="$1" borderRadius="$full">
					<Icon as={CloseIcon} size="md" color="#111111" />
				</Pressable>
			</HStack>

			<Text fontSize={13} lineHeight={16} fontFamily="Roboto" color="#6B7280" mb="$3">
				Editing preferences for {activeProfile?.first_name ?? "your profile"}
			</Text>

			<Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
				Current Preferences
			</Text>

			<Box flexDirection="row" flexWrap="wrap" gap={8} mb="$4">
				{selectedPreferences.length > 0 ? (
					selectedPreferences.map((item) => (
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
						No preferences selected yet.
					</Text>
				)}
			</Box>

			<Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
				Add / Remove Preferences
			</Text>

			<ScrollView showsVerticalScrollIndicator={false} flex={1}>
				<Box flexDirection="row" flexWrap="wrap" gap={10} pb="$3">
					{availablePreferences.map((item) => {
						const selected = draftSelectedIds.includes(item.id);
						return (
							<Pressable
								key={item.id}
								onPress={() => togglePreference(item.id)}
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
									source={getPreferenceImageSource(item.name)}
									alt={`${item.name} preference`}
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
					{isSaving ? "Saving..." : isLoading ? "Loading..." : "Save Preferences"}
				</Text>
			</Pressable>
		</Box>
	);
}
