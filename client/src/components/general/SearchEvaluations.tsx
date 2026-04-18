import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { Box, HStack, Input, InputField, Pressable } from "@gluestack-ui/themed";

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
