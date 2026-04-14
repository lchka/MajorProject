import React from "react";
import { Text } from "@gluestack-ui/themed";

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
