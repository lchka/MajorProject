import React from "react";
import { Input, InputField, Text, VStack } from "@gluestack-ui/themed";
// Component for managing the input of a user's first name, last name, and age in a profile setup or edit screen. The component provides labeled input fields for each piece of information, with optional fields for last name and age. It accepts props for the current values of the first name, last name, and age, as well as callback functions for handling changes to each field. The component also includes a disabled state to prevent user interaction when necessary, such as during loading states or when certain conditions are not met. The input fields are styled with rounded borders and appropriate keyboard types for text and numeric input.
type ProfileNameAgeSectionProps = {
	firstName: string;
	lastName: string;
	age: string;
	onFirstNameChange: (value: string) => void;
	onLastNameChange: (value: string) => void;
	onAgeChange: (value: string) => void;
	isDisabled?: boolean;
};

export default function ProfileNameAgeSection({
	firstName,
	lastName,
	age,
	onFirstNameChange,
	onLastNameChange,
	onAgeChange,
	isDisabled = false,
}: ProfileNameAgeSectionProps) {
	return (
		<VStack space="xl">
			<VStack space="xs">
				<Text style={{ fontFamily: "RobotoMedium" }}>First Name</Text>
				<Input size="lg" borderRadius="$full">
					<InputField
						placeholder="Enter first name"
						value={firstName}
						onChangeText={onFirstNameChange}
						autoCapitalize="words"
						editable={!isDisabled}
					/>
				</Input>
			</VStack>

			<VStack space="xs">
				<Text style={{ fontFamily: "RobotoMedium" }}>Last Name (optional)</Text>
				<Input size="lg" borderRadius="$full">
					<InputField
						placeholder="Enter last name (optional)"
						value={lastName}
						onChangeText={onLastNameChange}
						autoCapitalize="words"
						editable={!isDisabled}
					/>
				</Input>
			</VStack>

			<VStack space="xs">
				<Text style={{ fontFamily: "RobotoMedium" }}>Age (optional)</Text>
				<Input size="lg" borderRadius="$full">
					<InputField
						placeholder="Enter age"
						value={age}
						onChangeText={onAgeChange}
						keyboardType="number-pad"
						editable={!isDisabled}
					/>
				</Input>
			</VStack>
		</VStack>
	);
}
