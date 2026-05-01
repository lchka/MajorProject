import React from "react";
import { Text } from "@gluestack-ui/themed";
// Component for displaying the current profile name in a possessive format (e.g., "Alice's Profile"). The component accepts props for the user's first name and styling options such as font size, color, weight, family, and line height. It includes a utility function to convert the first name into a possessive label, handling edge cases such as names ending with "s". The component renders the formatted profile name using the Text component from the themed UI library, allowing for consistent styling across the app.
type CurrentProfileProps = {
	firstName?: string;
	fontSize?: number;
	color?: string;
	fontWeight?: "normal" | "bold";
	fontFamily?: string;
	lineHeight?: number;
};

function toPossessiveLabel(firstName: string) {
	const trimmed = firstName.trim();
	if (!trimmed) {
		return "Your Profile";
	}

	const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
	return /s$/i.test(capitalized) ? `${capitalized}'` : `${capitalized}'s`;
}

export default function CurrentProfile({
	firstName,
	fontSize = 26,
	color = "#92acf5",
	fontWeight = "bold",
	fontFamily = "RobotoMedium",
	lineHeight,
}: CurrentProfileProps) {
	const label = toPossessiveLabel(firstName ?? "");

	return (
		<Text
			fontSize={fontSize}
			lineHeight={lineHeight ?? fontSize + 2}
			fontFamily={fontFamily}
			fontWeight={fontWeight}
			color={color}
		>
			{label}
		</Text>
	);
}
