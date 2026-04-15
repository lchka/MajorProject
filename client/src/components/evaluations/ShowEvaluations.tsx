import React from "react";
import { Linking } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import NavBarTop from "../general/NavBarTop";
import NavBarBottom from "../general/NavBarBottom";
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

	const reasons = React.useMemo(() => {
		if (!resultJson || !Array.isArray(resultJson.reasons)) {
			return [];
		}

		return resultJson.reasons;
	}, [resultJson]);

	const citations = React.useMemo(() => toStringArray(resultJson?.citations), [resultJson]);
	const citationLinks = React.useMemo(() => toStringArray(resultJson?.citation_links), [resultJson]);

	const citationSources = React.useMemo(() => {
		const value = resultJson?.citation_sources;
		if (!Array.isArray(value)) {
			return [];
		}

		return value.filter(
			(item): item is { title: string; lead_author: string; year: number | null; url: string } =>
				typeof item === "object" &&
				item !== null &&
				typeof (item as { title?: unknown }).title === "string" &&
				typeof (item as { lead_author?: unknown }).lead_author === "string" &&
				typeof (item as { url?: unknown }).url === "string",
		);
	}, [resultJson]);

	const additionalEntries = React.useMemo(() => {
		if (!resultJson) {
			return [] as Array<[string, unknown]>;
		}

		return Object.entries(resultJson).filter(([key]) => !KNOWN_KEYS.has(key));
	}, [resultJson]);

	const score = typeof resultJson?.score === "number" ? Math.max(0, Math.min(100, resultJson.score)) : null;
	const status = resultJson?.status;
	const statusTone = status && ["safe", "caution", "avoid"].includes(status) ? status : null;

	const openLink = React.useCallback(async (url: string) => {
		const trimmed = url.trim();
		if (!trimmed) {
			return;
		}

		try {
			const supported = await Linking.canOpenURL(trimmed);
			if (supported) {
				await Linking.openURL(trimmed);
			}
		} catch {
			// Ignore link opening errors on unsupported platforms/URLs.
		}
	}, []);

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
				bg="#FCFDFE"
				borderRadius={18}
				borderWidth={1}
				borderColor="#DEE6EF"
				px="$3"
				py="$3"
				flex={1}
			>
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
					<MotiView
						from={{ opacity: 0, scale: 0.97 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ type: "timing", duration: 280 }}
					>
					<Box mt="$4" alignItems="center">
						<Box
							w={120}
							h={156}
							borderRadius={14}
							overflow="hidden"
							bg="#F2F4F6"
							borderWidth={1}
							borderColor="#E3E7EC"
						>
							{imageUri ? (
								<Image
									source={{ uri: imageUri }}
									alt={productName}
									resizeMode="contain"
									style={{ width: "100%", height: "100%" }}
								/>
							) : (
								<Box flex={1} alignItems="center" justifyContent="center">
									<Feather name="image" size={24} color="#9CA8B4" />
								</Box>
							)}
						</Box>
						<Text
							mt="$3"
							fontSize={20}
							lineHeight={24}
							color="#152433"
							fontFamily="RobotoMedium"
							textAlign="center"
						>
							{productName}
						</Text>
						<Text mt="$1" fontSize={12} lineHeight={16} color="#637384" fontFamily="Roboto" textAlign="center">
							{statusText}
						</Text>
					</Box>
					</MotiView>

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

					{reasons.length > 0 ? (
						<SectionCard
							title="Why This Result"
							icon={<Feather name="message-circle" size={16} color="#42586F" />}
							index={3}
						>
							{reasons.map((reason, index) => (
								<Text
									key={`${reason}-${index}`}
									fontSize={12}
									lineHeight={17}
									color="#425264"
									fontFamily="Roboto"
									mb={index === reasons.length - 1 ? 0 : 6}
								>
									{`- ${reason}`}
								</Text>
							))}
						</SectionCard>
					) : null}

					<SectionCard
						title="Matched Profile Signals"
						icon={<Ionicons name="git-compare-outline" size={16} color="#42586F" />}
						index={4}
					>
						<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mb="$1">
							Allergens
						</Text>
						<ChipList items={toStringArray(resultJson?.matched_allergens)} />
						<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mt="$2" mb="$1">
							Conditions
						</Text>
						<ChipList items={toStringArray(resultJson?.matched_conditions)} />
						<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mt="$2" mb="$1">
							Preferences
						</Text>
						<ChipList items={toStringArray(resultJson?.matched_preferences)} />
					</SectionCard>

					<SectionCard
						title="Profile Inputs Used"
						icon={<Feather name="users" size={16} color="#42586F" />}
						index={5}
					>
						<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mb="$1">
							Profile Allergens
						</Text>
						<ChipList items={toStringArray(resultJson?.profile_allergens)} />
						<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mt="$2" mb="$1">
							Profile Conditions
						</Text>
						<ChipList items={toStringArray(resultJson?.profile_conditions)} />
						<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mt="$2" mb="$1">
							Profile Preferences
						</Text>
						<ChipList items={toStringArray(resultJson?.profile_preferences)} />
					</SectionCard>

					<SectionCard
						title="All Ingredients"
						icon={<Ionicons name="list-outline" size={16} color="#42586F" />}
						index={6}
					>
						<ChipList items={toStringArray(resultJson?.all_ingredients)} />
					</SectionCard>

					<SectionCard
						title="Citations"
						icon={<Ionicons name="book-outline" size={16} color="#42586F" />}
						index={7}
					>
						{citations.length > 0 ? (
							<Box mb={citationLinks.length > 0 || citationSources.length > 0 ? "$2" : 0}>
								{citations.map((citation, index) => (
									<Text
										key={`${citation}-${index}`}
										fontSize={12}
										lineHeight={17}
										color="#374658"
										fontFamily="Roboto"
										mb={index === citations.length - 1 ? 0 : 6}
									>
										{`- ${citation}`}
									</Text>
								))}
							</Box>
						) : null}

						{citationLinks.length > 0 ? (
							<Box mb={citationSources.length > 0 ? "$2" : 0}>
								<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mb="$1">
									Citation Links
								</Text>
								{citationLinks.map((link, index) => (
									<Pressable
										key={`${link}-${index}`}
										onPress={() => {
											void openLink(link);
										}}
										mb={index === citationLinks.length - 1 ? 0 : 6}
									>
										<Text fontSize={12} lineHeight={17} color="#1E6CA8" fontFamily="Roboto">
											{link}
										</Text>
									</Pressable>
								))}
							</Box>
						) : null}

						{citationSources.length > 0 ? (
							<Box>
								<Text fontSize={12} lineHeight={16} color="#57677A" fontFamily="Roboto" mb="$1">
									Citation Sources
								</Text>
								{citationSources.map((source, index) => (
									<Box
										key={`${source.title}-${index}`}
										borderWidth={1}
										borderColor="#E2E7EE"
										bg="#FAFBFC"
										borderRadius={10}
										p="$2"
										mb={index === citationSources.length - 1 ? 0 : 8}
									>
										<Text fontSize={12} lineHeight={16} color="#203145" fontFamily="RobotoMedium">
											{source.title}
										</Text>
										<Text fontSize={11} lineHeight={15} color="#5D6A79" fontFamily="Roboto" mt={2}>
											{`${source.lead_author}${source.year ? ` (${source.year})` : ""}`}
										</Text>
										<Pressable
											onPress={() => {
												void openLink(source.url);
											}}
											mt={4}
										>
											<Text fontSize={11} lineHeight={15} color="#1E6CA8" fontFamily="Roboto">
												{source.url}
											</Text>
										</Pressable>
									</Box>
								))}
							</Box>
						) : null}

						{!citations.length && !citationLinks.length && !citationSources.length ? (
							<Text fontSize={12} lineHeight={16} color="#7A838D" fontFamily="Roboto">
								No citation data available.
							</Text>
						) : null}
					</SectionCard>

					{additionalEntries.length > 0 ? (
						<SectionCard
							title="Additional Result Data"
							icon={<Feather name="info" size={16} color="#42586F" />}
							index={8}
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

					{onRetake ? (
						<Pressable
							mt="$4"
							alignSelf="center"
							onPress={onRetake}
							bg="#FFFFFF"
							borderWidth={1}
							borderColor="#CED9E5"
							borderRadius={10}
							px="$5"
							py="$2"
						>
							<Text fontFamily="RobotoMedium" color="#294057" fontSize={14}>
								Retake
							</Text>
						</Pressable>
					) : null}
				</ScrollView>
			</Box>
		</Box>

			<NavBarBottom
				activeTab="history"
				avatarSource={avatarSource}
				onPressUpload={onRetake}
			/>
		</Box>
	);
}
