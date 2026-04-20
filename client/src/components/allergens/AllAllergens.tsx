import React from "react";
import { ImageSourcePropType, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AddIcon, Box, Icon, Image, Pressable, Text } from "@gluestack-ui/themed";
import CurrentProfile from "../general/CurrentProfileName";
import EditButton from "../Buttons/EditButton";
import RemoveIconTag from "../general/RemoveIconTag";

type AllergenItem = {
	id?: string;
	name: string;
};

type ResolvedAllergenItem = {
	runtimeId: string;
	name: string;
	visual: AllergenVisual;
};

type AllAllergensProps = {
	profileFirstName?: string;
	allergenNames?: string[];
	allergens?: AllergenItem[];
	availableAllergens?: AllergenItem[];
	onSaveAllergens?: (allergenIds: string[]) => Promise<void> | void;
	onRemoveAllergen?: (allergenId: string) => Promise<void> | void;
	onOpenAddAllergen?: () => void;
	isRemovingAllergen?: boolean;
	isEditMode?: boolean;
	onToggleEditMode?: () => void;
	onCloseEditMode?: () => void;
	variant?: "visual" | "chips";
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

const normalizeLabel = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

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

function resolveAllergenItems(
	allergenNames?: string[],
	sourceAllergens?: { id?: string; name: string }[],
) {
	const resolved: ResolvedAllergenItem[] = [];
	const seen = new Set<string>();

	const input =
		sourceAllergens && sourceAllergens.length > 0
			? sourceAllergens.map((item) => ({
					key: item.id ?? item.name,
					name: item.name,
				}))
			: allergenNames?.map((name) => ({
					key: name,
					name,
				})) ?? [];

	input.forEach((item) => {
		const visual = resolveVisual(item.name);
		const dedupeKey = normalizeLabel(visual.label);
		if (!dedupeKey || seen.has(dedupeKey)) {
			return;
		}

		seen.add(dedupeKey);
		resolved.push({
			runtimeId: String(item.key),
			name: item.name,
			visual,
		});
	});

	return resolved;
}

export default function AllAllergens({
	profileFirstName,
	allergenNames,
	allergens,
	onRemoveAllergen,
	onOpenAddAllergen,
	isRemovingAllergen = false,
	isEditMode = false,
	onToggleEditMode,
	onCloseEditMode,
	variant = "visual",
}: AllAllergensProps) {
	const [removingId, setRemovingId] = React.useState<string | null>(null);
	const inactivityTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	// Enrich profile allergens with UI metadata once per allergens input change.
	const allergenItems = React.useMemo(
		() => resolveAllergenItems(allergenNames, allergens),
		[allergenNames, allergens],
	);

	const handleDeleteAllergen = React.useCallback(
		async (allergenId: string) => {
			if (!onRemoveAllergen || isRemovingAllergen || removingId) {
				return;
			}

			try {
				setRemovingId(allergenId);
				await onRemoveAllergen(allergenId);
			} finally {
				setRemovingId(null);
			}
		},
		[onRemoveAllergen, isRemovingAllergen, removingId]
	);

	const closeEditMode = React.useCallback(() => {
		if (!isEditMode) {
			return;
		}

		if (onCloseEditMode) {
			onCloseEditMode();
			return;
		}

		onToggleEditMode?.();
	}, [isEditMode, onCloseEditMode, onToggleEditMode]);

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
		if (!allergenItems.length) {
			return (
				<Text fontSize={12} lineHeight={16} color="#7A838D" fontFamily="Roboto">
					None
				</Text>
			);
		}

		return (
			<Box flexDirection="row" flexWrap="wrap" style={{ gap: 8 }}>
				{allergenItems.map((item) => (
					<Box
						key={item.runtimeId}
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
							{item.visual.label}
						</Text>
					</Box>
				))}
			</Box>
		);
	}, [allergenItems]);

	return (
		<Box onTouchStart={resetInactivityTimer}>
			<Box>
				{variant === "visual" ? (
					<Box
						px="$1"
						pr="$2"
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: 14,
						}}
					>
						<Box>
							<Box flexDirection="row" alignItems="center" gap={6}>
								<CurrentProfile firstName={profileFirstName} fontSize={20} lineHeight={24} color="#1dd2d8" />
								<Text fontSize={20} lineHeight={24} fontFamily="RobotoMedium" color="$black">
									Allergens
								</Text>
							</Box>
						</Box>

						<Box p="$2" style={{ marginTop: -4 }}>
							<EditButton
								onPress={() => {
									resetInactivityTimer();
									onToggleEditMode?.();
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
				) : null}

				{allergenItems.length > 0 ? (
					variant === "chips" ? (
						renderChips()
					) : (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								flexDirection: "row",
								alignItems: "flex-start",
								paddingHorizontal: 6,
								paddingRight: 6,
							}}
						>
							{allergenItems.map((item, index) => (
								<Box key={item.runtimeId} alignItems="center" width={122} style={{ marginRight: index === allergenItems.length - 1 ? 0 : 16 }}>
									<Box position="relative">
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

										{isEditMode ? (
											<RemoveIconTag
												onDelete={() => {
													resetInactivityTimer();
													void handleDeleteAllergen(item.runtimeId);
												}}
												disabled={isRemovingAllergen || removingId === item.runtimeId}
												size={22}
												position={{ top: 2, right: 2 }}
												accessibilityLabel={`Remove ${item.visual.label}`}
											/>
										) : null}
									</Box>

									<Text
										mt="$2"
										textAlign="center"
										fontSize={12}
										lineHeight={15}
										fontWeight={700}
										fontFamily="RobotoBold"
										color="#111111"
									>
										{item.visual.label}
									</Text>
								</Box>
							))}

							<Pressable
								alignItems="center"
								width={92}
								style={{ marginLeft: 16 }}
								onPress={() => {
									resetInactivityTimer();
									onOpenAddAllergen?.();
								}}
								disabled={!onOpenAddAllergen || isRemovingAllergen}
							>
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
									opacity={!onOpenAddAllergen || isRemovingAllergen ? 0.55 : 1}
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
									ADD MORE
								</Text>
							</Pressable>
						</ScrollView>
					)
				) : (
					<Box
						bg={variant === "chips" ? "#F8FAFC" : "#FFFFFF"}
						borderWidth={0}
						borderColor="transparent"
						borderRadius={variant === "chips" ? 12 : 14}
						px={variant === "chips" ? "$3" : "$4"}
						py={variant === "chips" ? "$2" : "$4"}
						alignItems={variant === "chips" ? undefined : "center"}
					>
						{variant === "chips" ? (
							<Text fontSize={12} lineHeight={16} color="#7A838D" fontFamily="Roboto">
								None
							</Text>
						) : (
							<Box alignItems="center" width="100%">
								<Text
									textAlign="center"
									fontSize={14}
									lineHeight={18}
									color="#4B5563"
									fontFamily="Roboto"
									mb="$3"
								>
									Add allergens to your profile
								</Text>
								<Pressable
									alignItems="center"
									onPress={() => {
										resetInactivityTimer();
										onOpenAddAllergen?.();
									}}
									disabled={!onOpenAddAllergen || isRemovingAllergen}
								>
									<Box
										width={64}
										height={64}
										borderRadius={32}
										borderWidth={2}
										borderColor="#58CCED"
										bg="#FFFFFF"
										alignItems="center"
										justifyContent="center"
										opacity={!onOpenAddAllergen || isRemovingAllergen ? 0.55 : 1}
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
										ADD MORE
									</Text>
								</Pressable>
							</Box>
						)}
					</Box>
				)}
			</Box>
		</Box>
	);
}
