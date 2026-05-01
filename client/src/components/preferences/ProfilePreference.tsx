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
import OverlayPPreference from "./OverlayPPreference";
// Component for managing user preferences in an overlay modal that allows users to view, add, and remove their preferences. The component accepts props for controlling the open state of the modal, a list of available preferences, the user's currently selected preferences, and a callback function for saving changes. It uses local state to manage draft selections while the user interacts with the modal and provides a smooth animated transition when opening and closing. The modal displays the current preferences at the top and a scrollable list of all available preferences with toggle buttons for selection. Users can save their changes, which triggers the onSave callback and then closes the modal with an exit animation.
type PreferenceOption = {
	id: string;
	name: string;
};

type ProfilePreferenceProps = {
	preferences: PreferenceOption[];
	selectedPreferenceIds: string[];
	onChangeSelectedPreferenceIds: (ids: string[]) => void;
	isDisabled?: boolean;
};

export default function ProfilePreference({
	preferences,
	selectedPreferenceIds,
	onChangeSelectedPreferenceIds,
	isDisabled = false,
}: ProfilePreferenceProps) {
	const [query, setQuery] = React.useState("");
	const [isCommonOverlayOpen, setIsCommonOverlayOpen] = React.useState(false);

	const selectedPreferences = React.useMemo(
		() => preferences.filter((item) => selectedPreferenceIds.includes(item.id)),
		[preferences, selectedPreferenceIds],
	);

	const availablePreferences = React.useMemo(
		() => preferences.filter((item) => !selectedPreferenceIds.includes(item.id)),
		[preferences, selectedPreferenceIds],
	);

	const filteredPreferences = React.useMemo(() => {
		if (!query.trim()) return availablePreferences;

		const normalizedQuery = query.toLowerCase();
		return availablePreferences.filter((item) =>
			item.name.toLowerCase().includes(normalizedQuery),
		);
	}, [availablePreferences, query]);

	const suggestionPreferences =
		query.trim().length > 0 ? filteredPreferences.slice(0, 8) : [];

	const selectedPreferenceColumns = React.useMemo(() => {
		const columns: PreferenceOption[][] = [];
		for (let index = 0; index < selectedPreferences.length; index += 2) {
			columns.push(selectedPreferences.slice(index, index + 2));
		}
		return columns;
	}, [selectedPreferences]);

	const addPreference = (preferenceId: string) => {
		onChangeSelectedPreferenceIds([...selectedPreferenceIds, preferenceId]);
		setQuery("");
	};

	const removePreference = (preferenceId: string) => {
		onChangeSelectedPreferenceIds(
			selectedPreferenceIds.filter((id) => id !== preferenceId),
		);
	};

	return (
		<VStack space="2xl">
			<VStack space="sm">
				<Text size="md" color="#526C88" style={{ fontFamily: "Roboto" }}>
					Pick any cosmetic preferences so we can tailor recommendations.
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
									placeholder="Search or type a preference..."
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
						{suggestionPreferences.length > 0 ? (
							<ScrollView nestedScrollEnabled style={{ maxHeight: 210 }}>
								<VStack space="xs">
									{suggestionPreferences.map((item) => (
										<Pressable
											key={item.id}
											onPress={() => addPreference(item.id)}
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
								No matching preferences found.
							</Text>
						)}
					</Box>
				) : null}
			</VStack>

			<VStack space="sm">
				<Text size="sm" color="#7A9BB8">
					Can&apos;t find your preference?
				</Text>
				<SelectionChip
					text="View all preferences"
					onPress={() => setIsCommonOverlayOpen(true)}
					disabled={isDisabled}
					variant="viewAll"
				/>
			</VStack>

			<VStack space="lg">
				<Text style={{ fontFamily: "RobotoMedium", color: "#4B5563" }}>
					Selected preferences
				</Text>

				{selectedPreferences.length > 0 ? (
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
						<HStack space="md" alignItems="flex-start">
							{selectedPreferenceColumns.map((column, columnIndex) => (
								<VStack key={`selected-column-${columnIndex}`} space="md">
									{column.map((item) => (
										<MotiView key={item.id} from={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
											<SelectionChip
												text={`${item.name} ×`}
												onPress={() => removePreference(item.id)}
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
						Start typing to add your cosmetic preferences.
					</Text>
				)}
			</VStack>

			<OverlayPPreference
				isOpen={isCommonOverlayOpen}
				onClose={() => setIsCommonOverlayOpen(false)}
				preferences={preferences}
				selectedPreferenceIds={selectedPreferenceIds}
				onSave={onChangeSelectedPreferenceIds}
			/>
		</VStack>
	);
}
