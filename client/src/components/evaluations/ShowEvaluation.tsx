import React from "react";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Image, ScrollView, Text } from "@gluestack-ui/themed";
import NavBarTop from "../general/NavBarTop";
import NavBarBottom from "../general/NavBarBottom";
import ProfileRetakeBanner from "../banners/ProfileRetakeBanner";
import Citations from "./Citations";
import ImageEvaluation from "./ImageEvaluation";
import ProfileSignals from "./ProfileSignals";
import WhyThisResult from "./WhyThisResult";
import type { EvaluationResultJson, EvaluationStatus } from "../../services/evaluationContextService";
import { resolveMediaUrl } from "../../config/api";
import { styles } from "../../style/LandingPageStyle";

type IngredientRow = {
	label: string;
	status: EvaluationStatus;
};

type CreateEvaluationsProps = {
	imageUri?: string | null;
	productName?: string;
	isProcessing?: boolean;
	greetingName?: string;
	profileImageUri?: string;
	currentProfileAllergens?: string[];
	currentProfileConditions?: string[];
	currentProfilePreferences?: string[];
	resultJson?: EvaluationResultJson | null;
	onRetake?: () => void;
};

const defaultIngredients: IngredientRow[] = [
	{ label: "Ingredient1", status: "caution" },
	{ label: "Ingredient2", status: "safe" },
	{ label: "Ingredient3", status: "avoid" },
	{ label: "Ingredient4", status: "caution" },
	{ label: "Ingredient5", status: "safe" },
	{ label: "Ingredient6", status: "avoid" },
];

const statusColor: Record<IngredientRow["status"], string> = {
	safe: "#3D9560",
	caution: "#313538",
	avoid: "#E34141",
};

const statusCardColor: Record<EvaluationStatus, string> = {
	safe: "#E6F5EC",
	caution: "#FFF6E5",
	avoid: "#FDEAEA",
};

const statusTextColor: Record<EvaluationStatus, string> = {
	safe: "#1C6D3F",
	caution: "#8A5A00",
	avoid: "#A22626",
};

const KNOWN_KEYS = new Set([
	"status",
	"score",
	"summary",
	"reasons",
	"matched_allergens",
	"matched_conditions",
	"matched_preferences",
	"profile_allergens",
	"profile_conditions",
	"profile_preferences",
	"all_ingredients",
	"dangerous_ingredients",
	"citations",
	"citation_links",
	"citation_sources",
]);

const toStringArray = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const normalizeName = (value: string): string =>
	value.trim().toLowerCase().replace(/\s+/g, " ");

const normalizeAndSort = (values?: string[]): string[] => {
	if (!values) {
		return [];
	}

	return values
		.map(normalizeName)
		.filter(Boolean)
		.sort((left, right) => left.localeCompare(right));
};

const sameEntityList = (left?: string[], right?: string[]): boolean => {
	const normalizedLeft = normalizeAndSort(left);
	const normalizedRight = normalizeAndSort(right);

	if (normalizedLeft.length !== normalizedRight.length) {
		return false;
	}

	return normalizedLeft.every((value, index) => value === normalizedRight[index]);
};

const safeJsonValue = (value: unknown): string => {
	if (typeof value === "string") {
		return value;
	}

	if (
		typeof value === "number" ||
		typeof value === "boolean" ||
		value === null ||
		value === undefined
	) {
		return String(value);
	}

	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return "[unserializable value]";
	}
};

const formatLabel = (value: string): string =>
	value
		.replace(/_/g, " ")
		.replace(/\b\w/g, (match) => match.toUpperCase());

function SectionCard({
	title,
	icon,
	index = 0,
	children,
}: {
	title: string;
	icon?: React.ReactNode;
	index?: number;
	children: React.ReactNode;
}) {
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
					{icon}
					<Text fontSize={14} lineHeight={18} color="#202A36" fontFamily="RobotoMedium">
						{title}
					</Text>
				</Box>
				{children}
			</Box>
		</MotiView>
	);
}

function ChipList({ items }: { items: string[] }) {
	if (!items.length) {
		return (
			<Text fontSize={12} lineHeight={16} color="#7A838D" fontFamily="Roboto">
				None
			</Text>
		);
	}

	return (
		<Box flexDirection="row" flexWrap="wrap" style={{ gap: 8 }}>
			{items.map((item, index) => (
				<Box key={`${item}-${index}`} px="$2" py="$1" bg="#F2F4F7" borderRadius={999}>
					<Text fontSize={12} lineHeight={16} color="#2F3A47" fontFamily="Roboto">
						{item}
					</Text>
				</Box>
			))}
		</Box>
	);
}

export default function CreateEvaluations({
	imageUri,
	productName = "Scanned Product",
	isProcessing = false,
	greetingName = "Lili",
	profileImageUri,
	currentProfileAllergens,
	currentProfileConditions,
	currentProfilePreferences,
	resultJson,
	onRetake,
}: CreateEvaluationsProps) {
	const ingredients = React.useMemo<IngredientRow[]>(() => {
		if (!resultJson) {
			return defaultIngredients;
		}

		const dangerous = Array.isArray(resultJson.dangerous_ingredients)
			? resultJson.dangerous_ingredients
			: [];
		if (dangerous.length > 0) {
			return dangerous.slice(0, 6).map((item) => ({
				label: item.ingredient,
				status:
					item.danger_level >= 7
						? "avoid"
						: item.danger_level >= 4
							? "caution"
							: "safe",
			}));
		}

		const allIngredients = Array.isArray(resultJson.all_ingredients)
			? resultJson.all_ingredients
			: [];
		const matchedAllergens = new Set(resultJson.matched_allergens ?? []);
		const matchedConditions = new Set(resultJson.matched_conditions ?? []);

		if (allIngredients.length > 0) {
			return allIngredients.slice(0, 6).map((name) => {
				const lower = name.toLowerCase();
				const hasAllergen = [...matchedAllergens].some((item) => lower.includes(item.toLowerCase()));
				const hasCondition = [...matchedConditions].some((item) => lower.includes(item.toLowerCase()));

				return {
					label: name,
					status: hasAllergen ? "avoid" : hasCondition ? "caution" : "safe",
				};
			});
		}

		return defaultIngredients;
	}, [resultJson]);

	const statusText = isProcessing
		? "Analyzing ingredients..."
		: resultJson?.summary || "Analysis complete";

	const profileMismatchDetected = React.useMemo(() => {
		if (!resultJson) {
			return false;
		}

		if (
			!currentProfileAllergens &&
			!currentProfileConditions &&
			!currentProfilePreferences
		) {
			return false;
		}

		const snapshotAllergens = toStringArray(resultJson.profile_allergens);
		const snapshotConditions = toStringArray(resultJson.profile_conditions);
		const snapshotPreferences = toStringArray(resultJson.profile_preferences);

		return (
			!sameEntityList(snapshotAllergens, currentProfileAllergens) ||
			!sameEntityList(snapshotConditions, currentProfileConditions) ||
			!sameEntityList(snapshotPreferences, currentProfilePreferences)
		);
	}, [
		currentProfileAllergens,
		currentProfileConditions,
		currentProfilePreferences,
		resultJson,
	]);

	const reasons = React.useMemo(() => {
		if (!resultJson || !Array.isArray(resultJson.reasons)) {
			return [];
		}

		return resultJson.reasons;
	}, [resultJson]);

	const additionalEntries = React.useMemo(() => {
		if (!resultJson) {
			return [] as [string, unknown][];
		}

		return Object.entries(resultJson).filter(([key]) => !KNOWN_KEYS.has(key));
	}, [resultJson]);

	const score = typeof resultJson?.score === "number" ? Math.max(0, Math.min(100, resultJson.score)) : null;
	const status = resultJson?.status;
	const statusTone = status && ["safe", "caution", "avoid"].includes(status) ? status : null;

	const avatarUri = resolveMediaUrl(profileImageUri);
	const avatarSource = avatarUri ? { uri: avatarUri } : undefined;

	return (
		<Box style={styles.screen}>
			<Box 
				position="absolute"
				top={-60}
				right={-30}
				w={180}
				h={180}
				borderRadius={999}
				bg="#D8ECFF"
				opacity={0.5}
			/>
			<Box
				position="absolute"
				bottom={-40}
				left={-20}
				w={140}
				h={140}
				borderRadius={999}
				bg="#BFDFFF"
				opacity={0.25}
			/>

			<NavBarTop notificationCount={0} />

			<Box flex={1} px="$3" pt="$5" style={{ paddingBottom: 120 }}>
				<Box 
					flexDirection="row"
					alignItems="center"
					justifyContent="space-between"
					borderBottomWidth={1}
					borderBottomColor="#E8EDF3"
					pb="$2"
				>
					<Box flexDirection="row" alignItems="center"  gap={10}>
						<Box
							w={32}
							h={32}
							borderRadius={16}
							bg="#E8EEF5"
							alignItems="center"
							justifyContent="center"
						>
							<Feather name="user" size={17} color="#58708A" />
						</Box>
						<Text fontFamily="RobotoMedium" color="#0F1D2C" fontSize={24} lineHeight={26}>
							{`Hi, ${greetingName}!`}
						</Text>
					</Box>
					{avatarSource ? (
						<Image
							source={avatarSource}
							alt="Profile avatar"
							style={{ width: 34, height: 34, borderRadius: 17 }}
							resizeMode="cover"
						/>
					) : (
						<Feather name="menu" size={23} color="#607487" />
					)}
				</Box>

				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
					<ImageEvaluation
						imageUri={imageUri}
						productName={productName}
						statusText={statusText}
					/>

					{statusTone ? (
						<MotiView
							from={{ opacity: 0, translateY: 6 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ type: "timing", duration: 260, delay: 100 }}
						>
						<Box mt="$3" bg={statusCardColor[statusTone]} borderRadius={12} px="$3" py="$2">
							<Text
								fontFamily="RobotoMedium"
								fontSize={13}
								lineHeight={18}
								color={statusTextColor[statusTone]}
							>
								{`Overall status: ${statusTone.toUpperCase()}`}
							</Text>
						</Box>
						</MotiView>
					) : null}

					<ProfileRetakeBanner
						isVisible={profileMismatchDetected}
						onRetake={onRetake}
					/>

					{score !== null ? (
						<SectionCard
							title="Confidence Score"
							icon={<Feather name="bar-chart-2" size={16} color="#42586F" />}
							index={0}
						>
							<Text fontSize={26} lineHeight={30} fontFamily="RobotoMedium" color="#142131">
								{`${score}/100`}
							</Text>
							<Box mt="$2" h={8} bg="#E8EDF3" borderRadius={999} overflow="hidden">
								<MotiView
									from={{ width: "0%" }}
									animate={{ width: `${score}%` }}
									transition={{ type: "timing", duration: 500 }}
									style={{ height: 8, borderRadius: 999, backgroundColor: "#4A8EC9" }}
								/>
							</Box>
						</SectionCard>
					) : null}

					<SectionCard
						title="Ingredient Risk Map"
						icon={<Ionicons name="flask-outline" size={16} color="#42586F" />}
						index={1}
					>
						<Box borderWidth={1} borderStyle="dashed" borderColor="#BFD0E1" borderRadius={8} p="$2">
							{ingredients.map((ingredient, index) => (
								<Box
									key={`${ingredient.label}-${index}`}
									flexDirection="row"
									alignItems="center"
									mb={index === ingredients.length - 1 ? 0 : 8}
								>
									<Text
										minWidth={95}
										fontSize={13}
										lineHeight={17}
										color="#233142"
										fontFamily="Roboto"
										numberOfLines={1}
									>
										{`${ingredient.label}:`}
									</Text>
									<Box flex={1} h={5} bg="#E6ECF2" borderRadius={999} overflow="hidden">
										<Box
											h={5}
											borderRadius={999}
											bg={statusColor[ingredient.status]}
											style={{
												width:
													ingredient.status === "safe"
														? "100%"
														: ingredient.status === "caution"
															? "72%"
															: "86%",
											}}
										/>
									</Box>
								</Box>
							))}
						</Box>
					</SectionCard>

					{Array.isArray(resultJson?.dangerous_ingredients) && resultJson.dangerous_ingredients.length > 0 ? (
						<SectionCard
							title="Dangerous Ingredients"
							icon={<Ionicons name="warning-outline" size={16} color="#A22626" />}
							index={2}
						>
							{resultJson.dangerous_ingredients.map((item, index) => {
								const level = Math.max(0, Math.min(10, item.danger_level));
								return (
									<Box key={`${item.ingredient}-${index}`} mb={index === resultJson.dangerous_ingredients!.length - 1 ? 0 : 10}>
										<Text fontSize={13} lineHeight={18} color="#1C2938" fontFamily="RobotoMedium">
											{item.ingredient}
										</Text>
										<Text fontSize={12} lineHeight={16} color="#4A5A6B" fontFamily="Roboto" mt={2}>
											{`Danger level: ${level}/10`}
										</Text>
										<Box mt={4} h={5} bg="#E6ECF2" borderRadius={999} overflow="hidden">
											<Box h={5} borderRadius={999} bg="#DD4B4B" style={{ width: `${level * 10}%` }} />
										</Box>
										{item.reason ? (
											<Text fontSize={12} lineHeight={16} color="#5C6A78" fontFamily="Roboto" mt={4}>
												{item.reason}
											</Text>
										) : null}
									</Box>
								);
							})}
						</SectionCard>
					) : null}

					<WhyThisResult reasons={reasons} index={3} />

					<ProfileSignals
						matchedAllergens={toStringArray(resultJson?.matched_allergens)}
						matchedConditions={toStringArray(resultJson?.matched_conditions)}
						matchedPreferences={toStringArray(resultJson?.matched_preferences)}
						index={4}
					/>

					<SectionCard
						title="All Ingredients"
						icon={<Ionicons name="list-outline" size={16} color="#42586F" />}
						index={5}
					>
						<ChipList items={toStringArray(resultJson?.all_ingredients)} />
					</SectionCard>

					<Citations resultJson={resultJson} index={6} />

					{additionalEntries.length > 0 ? (
						<SectionCard
							title="Additional Result Data"
							icon={<Feather name="info" size={16} color="#42586F" />}
							index={7}
						>
							{additionalEntries.map(([key, value], index) => (
								<Box key={key} mb={index === additionalEntries.length - 1 ? 0 : 10}>
									<Text fontSize={12} lineHeight={16} color="#213145" fontFamily="RobotoMedium" mb={4}>
										{formatLabel(key)}
									</Text>
									<Text fontSize={11} lineHeight={15} color="#556476" fontFamily="Roboto">
										{safeJsonValue(value)}
									</Text>
								</Box>
							))}
						</SectionCard>
					) : null}

				</ScrollView>
			</Box>

			<NavBarBottom
				activeTab="history"
				avatarSource={avatarSource}
				onPressUpload={onRetake}
			/>
		</Box>
	);
}
