import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box, Image, ScrollView, Text } from "@gluestack-ui/themed";
import type { ImageSourcePropType } from "react-native";

type ProfileSignalsProps = {
	matchedAllergens: string[];
	matchedConditions: string[];
	matchedPreferences: string[];
	index?: number;
};

type SignalType = "allergen" | "condition" | "preference";

type PreferenceVisual = {
	label: string;
	imageSource: ImageSourcePropType;
	aliases: string[];
};

type AllergenVisual = {
	label: string;
	color: string;
	icon: ImageSourcePropType;
};

const normalize = (value: string) => value.trim().toLowerCase();
const normalizePreferenceName = (value: string) =>
	value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const PREFERENCE_VISUALS: PreferenceVisual[] = [
	{
		label: "ALCOHOL FREE",
		imageSource: require("../../../assets/preferences/alcohol-free.png"),
		aliases: ["alcohol free", "alcohol-free", "no alcohol"],
	},
	{
		label: "NON-COMEDOGENIC",
		imageSource: require("../../../assets/preferences/comedogenic.png"),
		aliases: ["non comedogenic", "non-comedogenic", "comedogenic"],
	},
	{
		label: "CRUELTY FREE",
		imageSource: require("../../../assets/preferences/cruelty-free (1).png"),
		aliases: ["cruelty free", "cruelty-free"],
	},
	{
		label: "ECO",
		imageSource: require("../../../assets/preferences/eco.png"),
		aliases: ["eco", "eco friendly", "eco-friendly"],
	},
	{
		label: "FRAGRANCE FREE",
		imageSource: require("../../../assets/preferences/fragrance-free.png"),
		aliases: ["fragrance free", "fragrance-free", "unscented"],
	},
	{
		label: "HYPO-ALLERGENIC",
		imageSource: require("../../../assets/preferences/hypoallergenic.png"),
		aliases: ["hypoallergenic", "hypo-allergenic"],
	},
	{
		label: "ORGANIC",
		imageSource: require("../../../assets/preferences/organic.png"),
		aliases: ["organic"],
	},
	{
		label: "PARABEN FREE",
		imageSource: require("../../../assets/preferences/paraben-free.png"),
		aliases: ["paraben free", "paraben-free"],
	},
	{
		label: "SULFATE FREE",
		imageSource: require("../../../assets/preferences/sulfate-free.png"),
		aliases: ["sulfate free", "sulfate-free", "sulphate free", "sulphate-free"],
	},
	{
		label: "VEGAN",
		imageSource: require("../../../assets/preferences/vegan (1).png"),
		aliases: ["vegan"],
	},
];

const resolvePreferenceVisual = (name: string): PreferenceVisual | null => {
	const normalizedInput = normalizePreferenceName(name);

	return (
		PREFERENCE_VISUALS.find((item) =>
			item.aliases.some((alias) => normalizePreferenceName(alias) === normalizedInput),
		) ?? null
	);
};

const ALLERGEN_VISUALS: Record<string, AllergenVisual> = {
	cocamidopropylbetaine: {
		label: "CAPB",
		color: "#EDD0C0",
		icon: require("../../../assets/allergens/Cocamidopropyl-Betaine.png"),
	},
	fragrance: {
		label: "FRAGRANCE",
		color: "#D2E2FF",
		icon: require("../../../assets/allergens/fragrance.png"),
	},
	balsam: {
		label: "BALSAM (BOP)",
		color: "#FFECBC",
		icon: require("../../../assets/allergens/balsam.png"),
	},
	preservativemix: {
		label: "PRESERV. MIX",
		color: "#FFE8ED",
		icon: require("../../../assets/allergens/preservative.png"),
	},
	formaldehyde: {
		label: "FORMALDEHYDE REL.",
		color: "#F5E5FF",
		icon: require("../../../assets/allergens/formaldehyde.png"),
	},
	parabens: {
		label: "PARABENS",
		color: "#DDF0DE",
		icon: require("../../../assets/allergens/paraben.png"),
	},
	lanolin: {
		label: "LANOLIN",
		color: "#FFD7EA",
		icon: require("../../../assets/allergens/lanolin.png"),
	},
	propyleneglycol: {
		label: "PG",
		color: "#DEE1E6",
		icon: require("../../../assets/allergens/Propylene Glycol.png"),
	},
	nickel: {
		label: "NICKEL",
		color: "#D0ECFF",
		icon: require("../../../assets/allergens/nickel.png"),
	},
	ppd: {
		label: "P-PHENYLENEDIAMINE (PPD)",
		color: "#E8D7D7",
		icon: require("../../../assets/allergens/ppd.png"),
	},
};

const normalizeAllergenName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const resolveAllergenVisual = (name: string): AllergenVisual => {
	const key = normalizeAllergenName(name);

	if (key.includes("cocamidopropyl")) return ALLERGEN_VISUALS.cocamidopropylbetaine;
	if (key.includes("fragrance")) return ALLERGEN_VISUALS.fragrance;
	if (key.includes("balsam")) return ALLERGEN_VISUALS.balsam;
	if (key.includes("preservative") || key.includes("mcimi")) return ALLERGEN_VISUALS.preservativemix;
	if (key.includes("formaldehyde")) return ALLERGEN_VISUALS.formaldehyde;
	if (key.includes("paraben")) return ALLERGEN_VISUALS.parabens;
	if (key.includes("lanolin")) return ALLERGEN_VISUALS.lanolin;
	if (key.includes("propyleneglycol")) return ALLERGEN_VISUALS.propyleneglycol;
	if (key.includes("nickel")) return ALLERGEN_VISUALS.nickel;
	if (key.includes("ppd") || key.includes("phenylenediamine")) return ALLERGEN_VISUALS.ppd;

	return {
		label: name.toUpperCase(),
		color: "#E2E8F0",
		icon: require("../../../assets/allergens/fragrance.png"),
	};
};

const conditionAccent = (name: string) => {
	const normalized = normalize(name);

	if (normalized.includes("psoriasis")) {
		return {
			iconBg: "#7F83E8",
			stripBg: "#D9DBFF",
			surfaceBg: "#F6F7FF",
			icon: "shield" as const,
		};
	}

	if (normalized.includes("eczema")) {
		return {
			iconBg: "#FF6B63",
			stripBg: "#FFD8D4",
			surfaceBg: "#FFF7F6",
			icon: "droplet" as const,
		};
	}

	if (normalized.includes("dermatitis")) {
		return {
			iconBg: "#FFAA4C",
			stripBg: "#FFE4C8",
			surfaceBg: "#FFFAF3",
			icon: "activity" as const,
		};
	}

	return {
		iconBg: "#66B9E8",
		stripBg: "#D7EEFA",
		surfaceBg: "#F6FBFF",
		icon: "shield" as const,
	};
};

const signalVisual = (label: string, type: SignalType) => {
	if (type === "condition") {
		return conditionAccent(label);
	}

	if (type === "allergen") {
		return {
			iconBg: "#58CCED",
			stripBg: "#D9F4FC",
			surfaceBg: "#F5FCFF",
			icon: "alert-circle" as const,
		};
	}

	return {
		iconBg: "#7DC58B",
		stripBg: "#DDF4E2",
		surfaceBg: "#F6FCF7",
		icon: "star" as const,
	};
};

function SignalGroup({
	title,
	items,
	type,
}: {
	title: string;
	items: string[];
	type: SignalType;
}) {
	return (
		<Box>
			<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mb="$2">
				{title}
			</Text>

			{items.length ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingRight: 8 }}
				>
					{type === "preference" ? (
						<Box flexDirection="row" alignItems="flex-start" style={{ gap: 12 }}>
							{items.map((item, itemIndex) => {
								const visual = resolvePreferenceVisual(item);

								return (
									<Box key={`${type}-${item}-${itemIndex}`} alignItems="center" width={94}>
										{visual ? (
											<Image
												source={visual.imageSource}
												alt={visual.label}
												resizeMode="contain"
												style={{ width: 70, height: 70 }}
											/>
										) : (
											<Box
												width={70}
												height={70}
												borderRadius={35}
												bg="#E8EEF5"
												alignItems="center"
												justifyContent="center"
											>
												<Feather name="star" size={20} color="#5B7086" />
											</Box>
										)}

										<Text
											mt="$2"
											pt="$1"
											textAlign="center"
											fontSize={12}
											lineHeight={12}
											fontFamily="RobotoMedium"
											color="#111111"
											numberOfLines={2}
										>
											{visual?.label ?? item.toUpperCase()}
										</Text>
									</Box>
								);
							})}
						</Box>
					) : type === "allergen" ? (
						<Box flexDirection="row" alignItems="flex-start" style={{ gap: 16 }}>
							{items.map((item, itemIndex) => {
								const visual = resolveAllergenVisual(item);

								return (
									<Box key={`${type}-${item}-${itemIndex}`} alignItems="center" width={122}>
										<Box
											width={100}
											height={100}
											borderRadius={50}
											bg={visual.color}
											alignItems="center"
											justifyContent="center"
										>
											<Image
												source={visual.icon}
												alt={visual.label}
												resizeMode="contain"
												style={{ width: 56, height: 56 }}
											/>
										</Box>

										<Text
											mt="$2"
											textAlign="center"
											fontSize={16}
											lineHeight={15}
											fontWeight={600}
											fontFamily="RobotoBold"
											color="#111111"
											numberOfLines={2}
										>
											{visual.label}
										</Text>
									</Box>
								);
							})}
						</Box>
					) : (
						<Box flexDirection="row" style={{ gap: 10 }}>
							{items.map((item, itemIndex) => {
								const visual = signalVisual(item, type);

								return (
									<Box
										key={`${type}-${item}-${itemIndex}`}
										style={{
											width: 220,
											borderRadius: 16,
											backgroundColor: visual.surfaceBg,
											overflow: "hidden",
										}}
									>
										<Box style={{ flexDirection: "row", alignItems: "center", minHeight: 66 }}>
											<Box style={{ width: 8, alignSelf: "stretch", backgroundColor: visual.stripBg }} />

											<Box
												style={{
													width: 38,
													height: 38,
													borderRadius: 19,
													backgroundColor: visual.iconBg,
													alignItems: "center",
													justifyContent: "center",
													marginLeft: 12,
												}}
											>
												<Feather name={visual.icon} size={16} color="#FFFFFF" />
											</Box>

											<Text
												fontSize={14}
												lineHeight={18}
												color="#1E2D3D"
												fontFamily="RobotoMedium"
												numberOfLines={2}
												style={{ marginLeft: 10, marginRight: 12, flex: 1 }}
											>
												{item}
											</Text>
										</Box>
									</Box>
								);
							})}
						</Box>
					)}
				</ScrollView>
			) : (
				<Box
					bg="#F8FAFC"
					borderWidth={1}
					borderColor="#E4EDF6"
					borderRadius={12}
					px="$3"
					py="$2"
				>
					<Text fontSize={12} lineHeight={16} color="#7A838D" fontFamily="Roboto">
						None
					</Text>
				</Box>
			)}
		</Box>
	);
}

export default function ProfileSignals({
	matchedAllergens,
	matchedConditions,
	matchedPreferences,
	index = 4,
}: ProfileSignalsProps) {
	return (
		<MotiView
			from={{ opacity: 0, translateY: 8 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: "timing", duration: 260, delay: 70 + index * 50 }}
		>
			<Box
				mt="$3"
				borderWidth={1}
				borderColor="#E4E6EA"
				bg="#FFFFFF"
				borderRadius={14}
				p="$3"
			>
				<Box flexDirection="row" alignItems="center" mb="$2" style={{ gap: 8 }}>
					<Ionicons name="git-compare-outline" size={16} color="#42586F" />
					<Text fontSize={14} lineHeight={18} color="#202A36" fontFamily="RobotoMedium">
						Matched Profile Signals
					</Text>
				</Box>

				<Box style={{ gap: 12 }}>
					<SignalGroup title="Allergens" items={matchedAllergens} type="allergen" />
					<SignalGroup title="Conditions" items={matchedConditions} type="condition" />
					<SignalGroup title="Preferences" items={matchedPreferences} type="preference" />
				</Box>
			</Box>
		</MotiView>
	);
}
