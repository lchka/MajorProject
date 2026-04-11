import React from "react";
import {
	Box,
	HStack,
	Input,
	InputField,
	Pressable,
	ScrollView,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";

type ConditionOption = {
	id: string;
	name: string;
};

type ProfileConditionsProps = {
	conditions: ConditionOption[];
	selectedConditionIds: string[];
	onChangeSelectedConditionIds: (ids: string[]) => void;
	isDisabled?: boolean;
};

const preferredCommonOrder = [
	"acne",
	"eczema",
	"rosacea",
	"psoriasis",
	"dermatitis",
	"sensitive skin",
];

const conditionEmojiByKey: Record<string, string> = {
	acne: "🫧",
	eczema: "🪶",
	rosacea: "🩸",
	psoriasis: "▫️",
	dermatitis: "🌿",
	"sensitive skin": "🫧",
};

const normalizeConditionName = (value: string) =>
	value.trim().toLowerCase();

const getConditionEmoji = (name: string) =>
	conditionEmojiByKey[normalizeConditionName(name)] ?? "🫧";

export default function ProfileConditions({
	conditions,
	selectedConditionIds,
	onChangeSelectedConditionIds,
	isDisabled = false,
}: ProfileConditionsProps) {
	const [query, setQuery] = React.useState("");

	const selectedConditions = React.useMemo(
		() => conditions.filter((item) => selectedConditionIds.includes(item.id)),
		[conditions, selectedConditionIds]
	);

	const availableConditions = React.useMemo(
		() => conditions.filter((item) => !selectedConditionIds.includes(item.id)),
		[conditions, selectedConditionIds]
	);

	const filteredConditions = React.useMemo(() => {
		if (!query.trim()) return availableConditions;

		const normalizedQuery = query.toLowerCase();
		return availableConditions.filter((item) =>
			item.name.toLowerCase().includes(normalizedQuery)
		);
	}, [availableConditions, query]);

	const commonConditions = React.useMemo(() => {
		const withRank = availableConditions.map((item) => {
			const key = normalizeConditionName(item.name);
			const rank = preferredCommonOrder.indexOf(key);
			return { item, rank: rank === -1 ? 999 : rank };
		});

		return withRank
			.sort((a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name))
			.slice(0, 8)
			.map((entry) => entry.item);
	}, [availableConditions]);

	const suggestionConditions =
		query.trim().length > 0 ? filteredConditions.slice(0, 8) : [];

	const selectedConditionColumns = React.useMemo(() => {
		const columns: ConditionOption[][] = [];
		for (let index = 0; index < selectedConditions.length; index += 2) {
			columns.push(selectedConditions.slice(index, index + 2));
		}
		return columns;
	}, [selectedConditions]);

	const addCondition = (conditionId: string) => {
		onChangeSelectedConditionIds([...selectedConditionIds, conditionId]);
		setQuery("");
	};

	const removeCondition = (conditionId: string) => {
		onChangeSelectedConditionIds(
			selectedConditionIds.filter((id) => id !== conditionId)
		);
	};

	return (
		<VStack space="lg">
			{/* HEADER */}
			<VStack space="xs">
				
				<Text
					size="md"
					color="#6B7D99"
					style={{ fontFamily: "Roboto" }}
				>
					Tell us anything about your skin — we’ll tailor everything to you.
				</Text>
			</VStack>

			{/* SEARCH */}
			<Box opacity={isDisabled ? 0.7 : 1}>
				<Box
					borderRadius={28}
					bg="#F7FAFF"
					borderWidth={1}
					borderColor="#D6E6F7"
					px="$3"
					style={{
						shadowColor: "#000",
						shadowOpacity: 0.03,
						shadowRadius: 6,
						shadowOffset: { width: 0, height: 2 },
					}}
				>
					<HStack alignItems="center" space="sm">
						<Feather name="search" size={18} color="#8AA6C5" />
						<Box flex={1}>
							<Input borderWidth={0} bg="transparent">
								<InputField
									placeholder="Search or type a condition..."
									placeholderTextColor="#8499B5"
									value={query}
									onChangeText={setQuery}
									autoCapitalize="words"
									editable={!isDisabled}
									style={{
										color: "#2E5F8A",
										fontFamily: "Roboto",
									}}
								/>
							</Input>
						</Box>
					</HStack>
				</Box>
			</Box>

			{/* SUGGESTIONS */}
			{suggestionConditions.length > 0 && (
				<VStack space="sm">
					<Text style={{ fontFamily: "RobotoMedium", color: "#4B5563" }}>
						Suggestions
					</Text>
					<MotiView
						style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
					>
						{suggestionConditions.map((item) => (
							<MotiView
								key={item.id}
								from={{ scale: 0.95, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
							>
								<Pressable
									onPress={() => addCondition(item.id)}
									borderWidth={1}
									borderColor="#D8E6F5"
									bg="#FFFFFF"
									borderRadius={24}
									px="$3"
									py="$2"
									disabled={isDisabled}
									style={{
										shadowColor: "#000",
										shadowOpacity: 0.05,
										shadowRadius: 4,
										shadowOffset: { width: 0, height: 2 },
									}}
								>
									<Text style={{ fontFamily: "Roboto" }}>
										{`${getConditionEmoji(item.name)} ${item.name}`}
									</Text>
								</Pressable>
							</MotiView>
						))}
					</MotiView>
				</VStack>
			)}

			{/* SELECTED */}
			<VStack space="sm">
				<Text style={{ fontFamily: "RobotoMedium", color: "#4B5563" }}>
					Selected conditions
				</Text>

				{selectedConditions.length > 0 ? (
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
						<HStack space="sm" alignItems="flex-start">
							{selectedConditionColumns.map((column, columnIndex) => (
								<VStack key={`selected-column-${columnIndex}`} space="sm">
									{column.map((item) => (
										<MotiView
											key={item.id}
											from={{ scale: 0.9, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
										>
											<Pressable
												onPress={() => removeCondition(item.id)}
												bg="#DCEBFA"
												borderRadius={24}
												px="$3"
												py="$2"
												style={{
													shadowColor: "#4A90E2",
													shadowOpacity: 0.15,
													shadowRadius: 6,
													shadowOffset: { width: 0, height: 3 },
												}}
											>
												<Text
													style={{
														fontFamily: "RobotoMedium",
														color: "#1E4E79",
													}}
												>
													{`${getConditionEmoji(item.name)} ${item.name} ×`}
												</Text>
											</Pressable>
										</MotiView>
									))}
								</VStack>
							))}
						</HStack>
					</ScrollView>
				) : (
					<Text size="sm" color="#7A9BB8">
						Start typing to add your skin concerns ✨
					</Text>
				)}
			</VStack>

			{/* COMMON */}
			<VStack space="sm">
				<Text style={{ fontFamily: "RobotoMedium", color: "#4B5563" }}>
					Common conditions
				</Text>

				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
					<HStack space="sm" alignItems="center">
						{commonConditions.map((item) => (
							<MotiView
								key={item.id}
								from={{ scale: 0.95, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
							>
								<Pressable
									onPress={() => addCondition(item.id)}
									borderWidth={1}
									borderColor="#D8E6F5"
									bg="#FFFFFF"
									borderRadius={24}
									px="$3"
									py="$2"
									disabled={isDisabled}
								>
									<Text style={{ fontFamily: "Roboto" }}>
										{`${getConditionEmoji(item.name)} ${item.name}`}
									</Text>
								</Pressable>
							</MotiView>
						))}
					</HStack>
				</ScrollView>
			</VStack>
		</VStack>
	);
}