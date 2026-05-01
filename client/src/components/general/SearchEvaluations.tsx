import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { Box, HStack, Input, InputField, Pressable } from "@gluestack-ui/themed";
// Component for a search input field specifically designed for searching through product evaluations. The component includes a search icon, an input field for entering the search query, and a clear button that appears when there is text in the input. The component accepts props for the current value of the search input, a callback function to handle changes to the input text, and an optional placeholder text. The styling includes a rounded border, background color, and shadow to make it visually distinct and user-friendly within the app's interface.
type SearchEvaluationsProps = {
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
};

export default function SearchEvaluations({
	value,
	onChangeText,
	placeholder = "Search evaluations...",
}: SearchEvaluationsProps) {
	return (
		<Box
			borderRadius={28}
			bg="#FFFFFF"
			borderWidth={1.8}
			borderColor="#D6E5F5"
			px="$3"
			py="$1"
			style={{
				shadowColor: "#4A90D9",
				shadowOpacity: 0.08,
				shadowRadius: 8,
				shadowOffset: { width: 0, height: 3 },
			}}
		>
			<HStack alignItems="center" space="sm">
				<Feather name="search" size={18} color="#8AA6C5" />

				<Box flex={1}>
					<Input borderWidth={0} bg="transparent">
						<InputField
							value={value}
							onChangeText={onChangeText}
							placeholder={placeholder}
							placeholderTextColor="#8DA6C0"
							autoCapitalize="none"
							autoCorrect={false}
							style={{
								color: "#2E5F8A",
								fontFamily: "Roboto",
							}}
						/>
					</Input>
				</Box>

				{value.trim().length > 0 ? (
					<Pressable
						onPress={() => onChangeText("")}
						accessibilityLabel="Clear evaluation search"
						px="$1"
					>
						<Feather name="x-circle" size={18} color="#8AA6C5" />
					</Pressable>
				) : null}
			</HStack>
		</Box>
	);
}
