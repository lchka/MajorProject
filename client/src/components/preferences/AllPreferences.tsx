import React from "react";
import { AddIcon, Box, HStack, Icon, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import CurrentProfile from "../general/CurrentProfileName";
import { styles } from "../../style/LandingPageStyle";

type PreferenceItem = {
	id: string;
	label: string;
	imageSource: number;
	imageAlt: string;
	aliases?: string[];
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

type PreferencesOverviewProps = {
	profilePreferenceNames?: string[];
	profileFirstName?: string;
	onAddPreference?: () => void;
};

// This normalizes preference text so matching works even with different spacing/hyphens.
function normalizePreferenceName(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// This resolves profile preference names into the display items used by the UI.
function resolvePreferenceItems(profilePreferenceNames?: string[]) {
	if (!profilePreferenceNames) {
		return defaultPreferences;
	}

	const resolved: PreferenceItem[] = [];
	const seen = new Set<string>();

	profilePreferenceNames.forEach((name) => {
		const normalizedName = normalizePreferenceName(name);
		const match = defaultPreferences.find((item) => {
			const valuesToMatch = [item.id, item.label, ...(item.aliases ?? [])];
			return valuesToMatch.some((candidate) => normalizePreferenceName(candidate) === normalizedName);
		});

		if (!match || seen.has(match.id)) {
			return;
		}

		seen.add(match.id);
		resolved.push(match);
	});

	return resolved;
}

export default function PreferencesOverview({
	profilePreferenceNames,
	profileFirstName,
	onAddPreference,
}: PreferencesOverviewProps) {
	// Recompute on each render so mutated arrays or deep value changes are reflected immediately.
	const preferences = resolvePreferenceItems(profilePreferenceNames);

	return (
		<>
			{/* This is the Preferences section title */}
			<Box style={styles.sectionHeader}>
				<HStack alignItems="center" pl="$2" gap={6}>
					<CurrentProfile firstName={profileFirstName} fontSize={22} lineHeight={22} color="#1dd2d8" />
					<Text fontSize={22} lineHeight={22} fontFamily="RobotoMedium" color="#151515">
						Preferences
					</Text>
				</HStack>
			</Box>

			{/* This is the horizontal preferences row */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 6, paddingRight: 16 }}
			>
				<Box flexDirection="row" alignItems="flex-start" gap={12}>
					{/* These are the existing preference icons + labels */}
					{preferences.map((preference) => (
						<Box key={preference.id} alignItems="center" width={94}>
							<Image
								source={preference.imageSource}
								alt={preference.imageAlt}
								resizeMode="contain"
								style={{ width: 70, height: 70 }}
							/>
							<Text
								mt="$2"
								pt="$1"
								textAlign="center"
								fontSize={12}
								lineHeight={12}
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
						onPress={onAddPreference}
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
		</>
	);
}
