import React from "react";
import { ImageSourcePropType, ScrollView } from "react-native";
import { AddIcon, Box, Icon, Image, Text } from "@gluestack-ui/themed";
import CurrentProfile from "../general/CurrentProfileName";
import EditButton from "../Buttons/EditButton";

type AllergenItem = {
	id: string;
	name: string;
};

type AllAllergensProps = {
	profileFirstName?: string;
	allergens?: AllergenItem[];
	onPressEdit?: () => void;
};

type AllergenVisual = {
	label: string;
	color: string;
	icon: ImageSourcePropType;
};

// Canonical visual tokens for each supported allergen card.
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

// Normalize incoming names so backend variants still match one visual card.
const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const resolveVisual = (name: string): AllergenVisual => {
	const key = normalizeName(name);

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

	// Keep unknown allergens renderable with a neutral fallback style.
	return {
		label: name.toUpperCase(),
		color: "#E2E8F0",
		icon: require("../../../assets/allergens/fragrance.png"),
	};
};

export default function AllAllergens({ profileFirstName, allergens, onPressEdit }: AllAllergensProps) {
	// Enrich profile allergens with UI metadata once per allergens input change.
	const allergenItems = React.useMemo(() => {
		return (allergens ?? []).map((item) => ({
			...item,
			visual: resolveVisual(item.name),
		}));
	}, [allergens]);

	return (
		<Box my="$6">
			<Box
				px="$1"
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 14,
				}}
			>
				<Box>
					<Box flexDirection="row" alignItems="center" gap={6}>
						<CurrentProfile firstName={profileFirstName} fontSize={22} lineHeight={24} color="#1dd2d8" />
						<Text fontSize={22} lineHeight={24} fontFamily="RobotoMedium" color="$black">
							Allergens
						</Text>
					</Box>
				</Box>

				<Box style={{ marginTop: -4 }}>
					<EditButton
						onPress={onPressEdit}
						width={72}
						label="Edit"
						borderColor="#9ed5f2"
						textColor="#499bc7"
						style={{ height: 28, backgroundColor: "transparent", borderWidth: 2 }}
						textStyle={{ fontSize: 14, lineHeight: 16, fontFamily: "Roboto", textTransform: "none" }}
					/>
				</Box>
			</Box>

			{allergenItems.length > 0 ? (
				// Horizontal-only row to match the swipe interaction from the design.
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: 6, paddingRight: 16 }}
				>
					<Box flexDirection="row" alignItems="flex-start" gap={16}>
						{allergenItems.map((item) => (
							<Box key={item.id} alignItems="center" width={122}>
								<Box
									width={100}
									height={100}
									borderRadius={50}
									bg={item.visual.color}
									alignItems="center"
									justifyContent="center"
								>
									<Image
										source={item.visual.icon}
										alt={item.visual.label}
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
								>
									{item.visual.label}
								</Text>
							</Box>
						))}

						{/* Visual "add more" affordance, intentionally non-interactive on landing. */}
						<Box alignItems="center" width={92}>
							<Box
								width={64}
								height={64}
								borderRadius={32}
								borderWidth={2}
								borderColor="#58CCED"
								bg="#FFFFFF"
								alignItems="center"
								justifyContent="center"
								mt="$5"
							>
								<Icon as={AddIcon} size="xl" color="#58CCED" />
							</Box>
							<Text
								mt="$2"
								textAlign="center"
								fontSize={13}
								lineHeight={15}
								fontFamily="RobotoBold"
								color="#111111"
							>
								ADD more
							</Text>
						</Box>
					</Box>
				</ScrollView>
			) : (
				<Box
					bg="#FFFFFF"
					borderWidth={1}
					borderColor="#DCE5EF"
					borderRadius={14}
					px="$4"
					py="$4"
				>
					<Text fontSize={14} lineHeight={18} fontFamily="Roboto" color="#64748B">
						No allergens selected for this profile.
					</Text>
				</Box>
			)}
		</Box>
	);
}
