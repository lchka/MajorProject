import React from "react";
import { AddIcon, Box, Icon, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import EditButton from "../Buttons/EditButton";
import { styles } from "../../style/LandingPageStyle";

type PreferenceItem = {
	id: string;
	label: string;
	imageSource: number;
	imageAlt: string;
	aliases?: string[];
};

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
	onAddPreference?: () => void;
};

function normalizePreferenceName(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

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
	onAddPreference,
}: PreferencesOverviewProps) {
	const preferences = React.useMemo(
		() => resolvePreferenceItems(profilePreferenceNames),
		[profilePreferenceNames],
	);

	return (
		<>
			<Box style={styles.sectionHeader}>
				<Text fontSize={22} lineHeight={22} fontFamily="RobotoMedium" color="#151515">
					Preferences
				</Text>
				<EditButton width={100} textStyle={styles.editText} style={styles.editButton} />
			</Box>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 6, paddingRight: 16 }}
			>
				<Box flexDirection="row" alignItems="flex-start" gap={12}>
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
