import React from "react";
import { Box, Image, Text } from "@gluestack-ui/themed";
import EditButton from "../Buttons/EditButton";
import { styles } from "../../style/LandingPageStyle";

type PreferenceItem = {
	id: string;
	label: string;
	imageSource: number;
	imageAlt: string;
};

const defaultPreferences: PreferenceItem[] = [
	{
		id: "vegan",
		label: "VEGAN",
		imageSource: require("../../../assets/preferences/vegan (1).png"),
		imageAlt: "Vegan preference",
	},
	{
		id: "alcohol-free",
		label: "ALCOHOL FREE",
		imageSource: require("../../../assets/preferences/alcohol-free.png"),
		imageAlt: "Alcohol free preference",
	},
	{
		id: "organic",
		label: "ORGANIC",
		imageSource: require("../../../assets/preferences/organic.png"),
		imageAlt: "Organic preference",
	},
	{
		id: "paraben-free",
		label: "PARABEN FREE",
		imageSource: require("../../../assets/preferences/paraben-free.png"),
		imageAlt: "Paraben free preference",
	},
	{
		id: "cruelty-free",
		label: "CRUELTY FREE",
		imageSource: require("../../../assets/preferences/cruelty-free (1).png"),
		imageAlt: "Cruelty free preference",
	},
];

type PreferencesOverviewProps = {
	preferences?: PreferenceItem[];
};

export default function PreferencesOverview({
	preferences = defaultPreferences,
}: PreferencesOverviewProps) {
	return (
		<>
			<Box style={styles.sectionHeader}>
				<Text fontSize={17} lineHeight={22} fontFamily="RobotoMedium" color="#151515">
					Preferences Overview
				</Text>
				<EditButton width={100} textStyle={styles.editText} style={styles.editButton} />
			</Box>

			<Box style={styles.preferenceRow}>
				{preferences.map((preference) => (
					<Box key={preference.id} alignItems="center" flex={1}>
						<Image
							source={preference.imageSource}
							alt={preference.imageAlt}
							resizeMode="contain"
							style={{ width: 56, height: 56 }}
						/>
						<Text mt="$1" textAlign="center" fontSize={8} lineHeight={10} fontFamily="RobotoMedium" color="#111111">
							{preference.label}
						</Text>
					</Box>
				))}
			</Box>
		</>
	);
}
