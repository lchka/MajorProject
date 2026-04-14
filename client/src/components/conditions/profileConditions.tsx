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
import SelectionChip from "../general/SelectionChip";
import OverlayPCondition from "./OverlayPCondition";

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

const normalizeConditionName = (value: string) =>
	value.trim().toLowerCase();

export default function ProfileConditions({
	conditions,
	selectedConditionIds,
	onChangeSelectedConditionIds,
	isDisabled = false,
}: ProfileConditionsProps) {
	const [query, setQuery] = React.useState("");
	const [isCommonOverlayOpen, setIsCommonOverlayOpen] = React.useState(false);

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
		const withRank = conditions.map((item) => {
			const key = normalizeConditionName(item.name);
			const rank = preferredCommonOrder.indexOf(key);
			return { item, rank: rank === -1 ? 999 : rank };
		});

		return withRank
			.sort((a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name))
			.slice(0, 8)
			.map((entry) => entry.item);
	}, [conditions]);

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
		<VStack space="2xl">
			{/* HEADER */}
			<VStack space="sm">
				
				<Text
					size="md"
					color="#526C88"
					style={{ fontFamily: "Roboto" }}
				>
					Tell us anything about your skin — we’ll tailor everything to you.
				</Text>
			</VStack>

			{/* SEARCH */}
			<VStack space="sm" opacity={isDisabled ? 0.7 : 1}>
				<Box
					borderRadius={28}
					bg="#FFFFFF"
					borderWidth={1.8}
					borderColor="#BBD4EC"
					px="$3"
					style={{
						shadowColor: "#4A90D9",
						shadowOpacity: 0.11,
						shadowRadius: 10,
						shadowOffset: { width: 0, height: 4 },
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

				{query.trim().length > 0 ? (
					<Box
						bg="#FFFFFF"
						borderWidth={1.2}
						borderColor="#D6E5F5"
						borderRadius={16}
						px="$2"
						py="$2"
						style={{
							shadowColor: "#4A90D9",
							shadowOpacity: 0.09,
							shadowRadius: 8,
							shadowOffset: { width: 0, height: 3 },
						}}
					>
						{suggestionConditions.length > 0 ? (
							<ScrollView nestedScrollEnabled style={{ maxHeight: 210 }}>
								<VStack space="xs">
									{suggestionConditions.map((item) => (
										<Pressable
											key={item.id}
											onPress={() => addCondition(item.id)}
											disabled={isDisabled}
											px="$3"
											py="$3"
											borderRadius={12}
										>
											<HStack alignItems="center" justifyContent="space-between">
												<Text style={{ fontFamily: "Roboto", color: "#2E5F8A" }}>
													{item.name}
												</Text>
												<Feather name="plus" size={16} color="#8AA6C5" />
											</HStack>
										</Pressable>
									))}
								</VStack>
							</ScrollView>
						) : (
							<Text size="sm" color="#7A9BB8" px="$2" py="$1">
								No matching conditions found.
							</Text>
						)}
					</Box>
				) : null}
			</VStack>

			{/* VIEW ALL */}
			<VStack space="sm">
				<Text size="sm" color="#7A9BB8">
					Can&apos;t find your condition?
				</Text>
				<SelectionChip
					text="View all conditions"
					onPress={() => setIsCommonOverlayOpen(true)}
					disabled={isDisabled}
					variant="viewAll"
				/>
			</VStack>

			{/* SELECTED */}
			<VStack space="lg">
				<Text style={{ fontFamily: "RobotoMedium", color: "#4B5563" }}>
					Selected conditions
				</Text>

				{selectedConditions.length > 0 ? (
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
						<HStack space="md" alignItems="flex-start">
							{selectedConditionColumns.map((column, columnIndex) => (
								<VStack key={`selected-column-${columnIndex}`} space="md">
									{column.map((item) => (
										<MotiView
											key={item.id}
											from={{ scale: 0.9, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
										>
											<SelectionChip
												text={`${item.name} ×`}
												onPress={() => removeCondition(item.id)}
												variant="selected"
											/>
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

			<OverlayPCondition
				isOpen={isCommonOverlayOpen}
				onClose={() => setIsCommonOverlayOpen(false)}
				conditions={conditions}
				selectedConditionIds={selectedConditionIds}
				onSave={onChangeSelectedConditionIds}
			/>
		</VStack>
	);
}