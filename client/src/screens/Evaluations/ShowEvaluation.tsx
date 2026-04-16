import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box, ScrollView, Text } from "@gluestack-ui/themed";
import NavBarTop from "../../components/general/NavBarTop";
import NavBarBottom from "../../components/general/NavBarBottom";
import ProfileRetakeBanner from "../../components/banners/ProfileRetakeBanner";
import DeleteButton from "../../components/Buttons/DeleteButton";
import Citations from "../../components/evaluations/Citations";
import ProdouctInfo from "../../components/conditions/ProductInfo";
import AllIngredients from "../../components/evaluations/AllIngredients";
import DangerousIngredients from "../../components/evaluations/DangerousIngredients";
import RiskMap from "../../components/evaluations/RiskMap";
import DifferentProfile, { type DifferentProfileItem } from "../../components/profile/DifferentProfile";
import ImageEvaluation from "../../components/evaluations/ImageEvaluation";
import ProfileSignals from "../../components/evaluations/ProfileSignals";
import WhyThisResult from "../../components/evaluations/WhyThisResult";
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
	differentProfiles?: DifferentProfileItem[];
	activeDifferentProfileId?: string;
	onSelectDifferentProfile?: (profileId: string) => void;
	onAddDifferentProfile?: () => void;
	onEditDifferentProfile?: (profileId?: string) => void;
	currentProfileAllergens?: string[];
	currentProfileConditions?: string[];
	currentProfilePreferences?: string[];
	resultJson?: EvaluationResultJson | null;
	onRetake?: () => void;
	onDelete?: () => void;
};

const defaultIngredients: IngredientRow[] = [
	{ label: "Ingredient1", status: "caution" },
	{ label: "Ingredient2", status: "safe" },
	{ label: "Ingredient3", status: "avoid" },
	{ label: "Ingredient4", status: "caution" },
	{ label: "Ingredient5", status: "safe" },
	{ label: "Ingredient6", status: "avoid" },
];

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

export default function CreateEvaluations({
	imageUri,
	productName = "Scanned Product",
	isProcessing = false,
	greetingName = "Lili",
	profileImageUri,
	differentProfiles,
	activeDifferentProfileId,
	onSelectDifferentProfile,
	onAddDifferentProfile,
	onEditDifferentProfile,
	currentProfileAllergens,
	currentProfileConditions,
	currentProfilePreferences,
	resultJson,
	onRetake,
	onDelete,
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
	const avatarSource = React.useMemo(() => (avatarUri ? { uri: avatarUri } : undefined), [avatarUri]);
	const profileSwitcherItems = React.useMemo<DifferentProfileItem[]>(() => {
		if (differentProfiles && differentProfiles.length > 0) {
			return differentProfiles;
		}

		return [
			{
				id: "current-profile",
				name: greetingName,
				avatarSource: avatarSource,
				isMain: true,
			},
		];
	}, [avatarSource, differentProfiles, greetingName]);

	const activeProfileId = activeDifferentProfileId ?? profileSwitcherItems[0]?.id;

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

			<Box flex={1} px="$3" pt="$2">
				<DifferentProfile
					profiles={profileSwitcherItems}
					activeProfileId={activeProfileId}
					onSelectProfile={onSelectDifferentProfile}
					onAddProfile={onAddDifferentProfile}
					onEditProfile={onEditDifferentProfile}
					title="Profiles Used"
					cardTitle="Different Profile"
					cardAvatarSource={avatarSource}
				/>

				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
					<Box mb="$2">
						<DeleteButton
							label="Delete"
							onPress={onDelete}
							disabled={!onDelete}
						/>
					</Box>

					<ImageEvaluation imageUri={imageUri} />

					<ProdouctInfo
						productName={productName}
						summary={statusText}
						status={statusTone}
						isProcessing={isProcessing}
					/>

					<ProfileRetakeBanner
						isVisible={profileMismatchDetected}
						onRetake={onRetake}
					/>

					{score !== null ? (
						<SectionCard
							title="AI Confidence Score"
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

					<RiskMap ingredients={ingredients} index={1} />

					<DangerousIngredients items={resultJson?.dangerous_ingredients} index={2} />

					<WhyThisResult reasons={reasons} index={3} />

					<ProfileSignals
						matchedAllergens={toStringArray(resultJson?.matched_allergens)}
						matchedConditions={toStringArray(resultJson?.matched_conditions)}
						matchedPreferences={toStringArray(resultJson?.matched_preferences)}
						profileAllergens={currentProfileAllergens}
						profileConditions={currentProfileConditions}
						profilePreferences={currentProfilePreferences}
						index={4}
					/>

					<AllIngredients items={toStringArray(resultJson?.all_ingredients)} index={5} />

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
