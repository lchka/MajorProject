import React from "react";
import { Input, InputField, Text, VStack } from "@gluestack-ui/themed";

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
