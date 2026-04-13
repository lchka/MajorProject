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
import OverlayPAllergens from "./OverlayPAllergens";

type AllergenOption = {
	id: string;
	name: string;
};

type ProfileAllergensProps = {
	allergens: AllergenOption[];
	selectedAllergenIds: string[];
	onChangeSelectedAllergenIds: (ids: string[]) => void;
	isDisabled?: boolean;
};

export default function ProfileAllergens({
	allergens,
	selectedAllergenIds,
	onChangeSelectedAllergenIds,
	isDisabled = false,
}: ProfileAllergensProps) {
	const [query, setQuery] = React.useState("");
	const [isCommonOverlayOpen, setIsCommonOverlayOpen] = React.useState(false);

	const selectedAllergens = React.useMemo(
		() => allergens.filter((item) => selectedAllergenIds.includes(item.id)),
		[allergens, selectedAllergenIds],
	);

	const availableAllergens = React.useMemo(
		() => allergens.filter((item) => !selectedAllergenIds.includes(item.id)),
		[allergens, selectedAllergenIds],
	);

	const filteredAllergens = React.useMemo(() => {
		if (!query.trim()) return availableAllergens;

		const normalizedQuery = query.toLowerCase();
		return availableAllergens.filter((item) =>
			item.name.toLowerCase().includes(normalizedQuery),
		);
	}, [availableAllergens, query]);

	const suggestionAllergens = query.trim().length > 0 ? filteredAllergens.slice(0, 8) : [];

	const selectedAllergenColumns = React.useMemo(() => {
		const columns: AllergenOption[][] = [];
		for (let index = 0; index < selectedAllergens.length; index += 2) {
			columns.push(selectedAllergens.slice(index, index + 2));
		}
		return columns;
	}, [selectedAllergens]);

	const addAllergen = (allergenId: string) => {
		onChangeSelectedAllergenIds([...selectedAllergenIds, allergenId]);
		setQuery("");
	};

	const removeAllergen = (allergenId: string) => {
		onChangeSelectedAllergenIds(selectedAllergenIds.filter((id) => id !== allergenId));
	};

	return (
		<VStack space="2xl">
			<VStack space="sm">
				<Text size="md" color="#526C88" style={{ fontFamily: "Roboto" }}>
					Add any allergens to avoid so we can personalize safer recommendations.
				</Text>
			</VStack>

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
									placeholder="Search or type an allergen..."
									placeholderTextColor="#8499B5"
									value={query}
									onChangeText={setQuery}
									autoCapitalize="words"
									editable={!isDisabled}
									style={{ color: "#2E5F8A", fontFamily: "Roboto" }}
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
						{suggestionAllergens.length > 0 ? (
							<ScrollView nestedScrollEnabled style={{ maxHeight: 210 }}>
								<VStack space="xs">
									{suggestionAllergens.map((item) => (
										<Pressable
											key={item.id}
											onPress={() => addAllergen(item.id)}
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
								No matching allergens found.
							</Text>
						)}
					</Box>
				) : null}
			</VStack>

			<VStack space="sm">
				<Text size="sm" color="#7A9BB8">
					Can&apos;t find your allergen?
				</Text>
				<SelectionChip
					text="View all allergens"
					onPress={() => setIsCommonOverlayOpen(true)}
					disabled={isDisabled}
					variant="viewAll"
				/>
			</VStack>

			<VStack space="lg">
				<Text style={{ fontFamily: "RobotoMedium", color: "#4B5563" }}>
					Selected allergens
				</Text>

				{selectedAllergens.length > 0 ? (
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
						<HStack space="md" alignItems="flex-start">
							{selectedAllergenColumns.map((column, columnIndex) => (
								<VStack key={`selected-column-${columnIndex}`} space="md">
									{column.map((item) => (
										<MotiView key={item.id} from={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
											<SelectionChip
												text={`${item.name} ×`}
												onPress={() => removeAllergen(item.id)}
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
						Start typing to add allergens you want to avoid.
					</Text>
				)}
			</VStack>

			<OverlayPAllergens
				isOpen={isCommonOverlayOpen}
				onClose={() => setIsCommonOverlayOpen(false)}
				allergens={allergens}
				selectedAllergenIds={selectedAllergenIds}
				onSave={onChangeSelectedAllergenIds}
			/>
		</VStack>
	);
}
