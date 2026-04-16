import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AddIcon, Box, HStack, Icon, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import CurrentProfile from "../general/CurrentProfileName";
import EditButton from "../Buttons/EditButton";
import RemoveIconTag from "../general/RemoveIconTag";
import { styles } from "../../style/LandingPageStyle";

type PreferenceItem = {
	id: string;
	label: string;
	imageSource: number;
	imageAlt: string;
	aliases?: string[];
};

type ResolvedPreferenceItem = PreferenceItem & {
	runtimeId: string;
};

// This is the master preference list with labels, aliases, and image assets.
const defaultPreferences: PreferenceItem[] = [
	{
		id: "alcohol-free",
		label: "ALCOHOL FREE",
		imageSource: require("../../../assets/preferences/alcohol-free.png"),
		imageAlt: "Alcohol free preference",
		aliases: ["alcohol free", "alcohol-free", "no alcohol"],
	},
	{
		id: "comedogenic",
		label: "NON-COMEDOGENIC",
		imageSource: require("../../../assets/preferences/comedogenic.png"),
		imageAlt: "Comedogenic preference",
		aliases: ["non comedogenic", "non-comedogenic", "comedogenic"],
	},
	{
		id: "cruelty-free",
		label: "CRUELTY FREE",
		imageSource: require("../../../assets/preferences/cruelty-free (1).png"),
		imageAlt: "Cruelty free preference",
		aliases: ["cruelty free", "cruelty-free"],
	},
	{
		id: "eco",
		label: "ECO",
		imageSource: require("../../../assets/preferences/eco.png"),
		imageAlt: "Eco preference",
		aliases: ["eco", "eco friendly", "eco-friendly"],
	},
	{
		id: "fragrance-free",
		label: "FRAGRANCE FREE",
		imageSource: require("../../../assets/preferences/fragrance-free.png"),
		imageAlt: "Fragrance free preference",
		aliases: ["fragrance free", "fragrance-free", "unscented"],
	},
	{
		id: "hypoallergenic",
		label: "HYPO-ALLERGENIC",
		imageSource: require("../../../assets/preferences/hypoallergenic.png"),
		imageAlt: "Hypoallergenic preference",
		aliases: ["hypoallergenic", "hypo-allergenic"],
	},
	{
		id: "organic",
		label: "ORGANIC",
		imageSource: require("../../../assets/preferences/organic.png"),
		imageAlt: "Organic preference",
		aliases: ["organic"],
	},
	{
		id: "paraben-free",
		label: "PARABEN FREE",
		imageSource: require("../../../assets/preferences/paraben-free.png"),
		imageAlt: "Paraben free preference",
		aliases: ["paraben free", "paraben-free"],
	},
	{
		id: "sulfate-free",
		label: "SULFATE FREE",
		imageSource: require("../../../assets/preferences/sulfate-free.png"),
		imageAlt: "Sulfate free preference",
		aliases: ["sulfate free", "sulfate-free", "sulphate free", "sulphate-free"],
	},
	{
		id: "vegan",
		label: "VEGAN",
		imageSource: require("../../../assets/preferences/vegan (1).png"),
		imageAlt: "Vegan preference",
		aliases: ["vegan"],
	},
];

type AllPreferencesProps = {
	profilePreferenceNames?: string[];
	preferences?: { id?: string; name: string }[];
	profileFirstName?: string;
	onAddPreference?: () => void;
	onRemovePreference?: (preferenceId: string) => Promise<void> | void;
	isRemovingPreference?: boolean;
	isEditMode?: boolean;
	onToggleEditMode?: () => void;
	onCloseEditMode?: () => void;
	onPressEdit?: () => void;
	variant?: "visual" | "chips";
};

// This normalizes preference text so matching works even with different spacing/hyphens.
function normalizePreferenceName(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findPreferenceByName(name: string) {
	const normalizedName = normalizePreferenceName(name);

	return defaultPreferences.find((item) => {
		const valuesToMatch = [item.id, item.label, ...(item.aliases ?? [])];
		return valuesToMatch.some((candidate) => normalizePreferenceName(candidate) === normalizedName);
	});
}

// This resolves profile preference names into the display items used by the UI.
function resolvePreferenceItems(
	profilePreferenceNames?: string[],
	sourcePreferences?: { id?: string; name: string }[],
) {
	const resolved: ResolvedPreferenceItem[] = [];
	const seen = new Set<string>();
	const input =
		sourcePreferences && sourcePreferences.length > 0
			? sourcePreferences.map((item) => ({
					key: item.id ?? item.name,
					name: item.name,
				}))
			: profilePreferenceNames?.map((name) => ({
					key: name,
					name,
				})) ?? [];

	input.forEach((item) => {
		const match = findPreferenceByName(item.name);
		if (!match) {
			return;
		}

		const uniqueKey = match.id;
		if (seen.has(uniqueKey)) {
			return;
		}

		seen.add(uniqueKey);
		resolved.push({
			...match,
			runtimeId: item.key,
		});
	});

	return resolved;
}

export default function AllPreferences({
	profilePreferenceNames,
	preferences,
	profileFirstName,
	onAddPreference,
	onRemovePreference,
	isRemovingPreference = false,
	isEditMode = false,
	onToggleEditMode,
	onCloseEditMode,
	onPressEdit,
	variant = "visual",
}: AllPreferencesProps) {
	const [removingId, setRemovingId] = React.useState<string | null>(null);
	const inactivityTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const resolvedPreferences = React.useMemo(() => {
		return resolvePreferenceItems(profilePreferenceNames, preferences);
	}, [preferences, profilePreferenceNames]);

	const handleDeletePreference = React.useCallback(
		async (preferenceId: string) => {
			if (!onRemovePreference || isRemovingPreference || removingId) {
				return;
			}

			try {
				setRemovingId(preferenceId);
				await onRemovePreference(preferenceId);
			} finally {
				setRemovingId(null);
			}
		},
		[onRemovePreference, isRemovingPreference, removingId],
	);

	const toggleEditMode = React.useMemo(
		() => onToggleEditMode ?? onPressEdit,
		[onToggleEditMode, onPressEdit],
	);

	const closeEditMode = React.useCallback(() => {
		if (!isEditMode) {
			return;
		}

		if (onCloseEditMode) {
			onCloseEditMode();
			return;
		}

		toggleEditMode?.();
	}, [isEditMode, onCloseEditMode, toggleEditMode]);

	const resetInactivityTimer = React.useCallback(() => {
		if (!isEditMode) {
			return;
		}

		if (inactivityTimeoutRef.current) {
			clearTimeout(inactivityTimeoutRef.current);
		}

		inactivityTimeoutRef.current = setTimeout(() => {
			closeEditMode();
		}, 25000);
	}, [isEditMode, closeEditMode]);

	React.useEffect(() => {
		if (isEditMode) {
			resetInactivityTimer();
		} else if (inactivityTimeoutRef.current) {
			clearTimeout(inactivityTimeoutRef.current);
			inactivityTimeoutRef.current = null;
		}

		return () => {
			if (inactivityTimeoutRef.current) {
				clearTimeout(inactivityTimeoutRef.current);
				inactivityTimeoutRef.current = null;
			}
		};
	}, [isEditMode, resetInactivityTimer]);

	const renderChips = React.useCallback(() => {
		if (!resolvedPreferences.length) {
			return (
				<Text fontSize={12} lineHeight={16} color="#7A838D" fontFamily="Roboto">
					None
				</Text>
			);
		}

		return (
			<Box flexDirection="row" flexWrap="wrap" style={{ gap: 8 }}>
				{resolvedPreferences.map((preference) => (
					<Box
						key={preference.runtimeId}
						flexDirection="row"
						alignItems="center"
						px="$3"
						py="$1"
						borderRadius={20}
						bg="#EEF6FF"
						borderWidth={1}
						borderColor="#D6E8FF"
						style={{ gap: 6 }}
					>
						<Ionicons name="checkmark" size={12} color="#3B82F6" />

						<Text fontSize={12} fontFamily="RobotoMedium" color="#2A3642">
							{preference.label}
						</Text>
					</Box>
				))}
			</Box>
		);
	}, [resolvedPreferences]);

	return (
		<Box my={variant === "chips" ? "$0" : "$6"} onTouchStart={resetInactivityTimer}>
			{variant === "visual" ? (
				<>
					{/* This is the Preferences section title */}
					<Box 
						pr="$2"
						style={{
							...styles.sectionHeader,
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: 14,
						}}
					>
						<Box>
							<HStack alignItems="center" pl="$2" gap={6}>
								<CurrentProfile firstName={profileFirstName} fontSize={20} lineHeight={24} color="#1dd2d8" />
								<Text fontSize={20} lineHeight={24} fontFamily="RobotoMedium" color="$black">
									Preferences
								</Text>
							</HStack>
						</Box>

						<Box style={{ marginTop: -4 }}>
							<EditButton
								onPress={() => {
									resetInactivityTimer();
									toggleEditMode?.();
								}}
								width={72}
								label={isEditMode ? "Done" : "Edit"}
								borderColor="#9ed5f2"
								textColor="#499bc7"
								style={{ height: 28, backgroundColor: "transparent", borderWidth: 2 }}
								textStyle={{ fontSize: 14, lineHeight: 16, fontFamily: "Roboto", textTransform: "none" }}
							/>
						</Box>
					</Box>

					<Box>
						{/* This is the horizontal preferences row with pagination dots like Past Analysis. */}
						<ScrollView
							horizontal
							onScrollBeginDrag={resetInactivityTimer}
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 6, paddingRight: 16 }}
						>
							<Box flexDirection="row" alignItems="flex-start" gap={12}>
							{/* These are the existing preference icons + labels */}
							{resolvedPreferences.map((preference) => (
								<Box key={preference.runtimeId} alignItems="center" width={94}>
									<Box position="relative">
										<Image
											source={preference.imageSource}
											alt={preference.imageAlt}
											resizeMode="contain"
											style={{ width: 70, height: 70 }}
										/>

										{isEditMode && onRemovePreference ? (
											<RemoveIconTag
												onDelete={() => {
													resetInactivityTimer();
													void handleDeletePreference(preference.runtimeId);
												}}
												disabled={isRemovingPreference || removingId !== null}
												size={22}
												position={{ top:0, right: -8 }}
												accessibilityLabel={`Remove ${preference.label}`}
											/>
										) : null}
									</Box>
									<Text
										mt="$2"
										pt="$1"
										textAlign="center"
										fontSize={12}
										lineHeight={12}
										fontWeight={700}
										fontFamily="RobotoMedium"
										color="#111111"
									>
										{preference.label}
									</Text>
								</Box>
							))}

							{/* This is the Add More button that opens preference management */}
								<Pressable
								alignItems="center"
								width={94}
								onPress={() => {
									resetInactivityTimer();
									onAddPreference?.();
								}}
								disabled={!onAddPreference}
							>
								<Box
									width={48}
									height={48}
									borderRadius={24}
									borderWidth={2}
									borderColor="#58CCED"
									alignItems="center"
									justifyContent="center"
									mt="$3"
								>
									<Icon as={AddIcon} size="lg" color="#58CCED" />
								</Box>
								<Text
									mt="$3"
									pt="$1"
									textAlign="center"
									fontSize={12}
									lineHeight={12}
									fontFamily="RobotoMedium"
									color="#111111"
								>
									ADD MORE
								</Text>
								</Pressable>
							</Box>
						</ScrollView>
					</Box>
				</>
			) : (
				renderChips()
			)}
		</Box>
	);
}
