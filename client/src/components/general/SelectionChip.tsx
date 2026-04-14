import React from "react";
import { Pressable, Text } from "@gluestack-ui/themed";

type SelectionChipVariant = "suggestion" | "selected" | "common" | "viewAll";

type SelectionChipProps = {
	text: string;
	onPress?: () => void;
	disabled?: boolean;
	variant?: SelectionChipVariant;
};

const VARIANT_STYLES: Record<
	SelectionChipVariant,
	{
		borderWidth: number;
		borderColor: string;
		backgroundColor: string;
		textColor: string;
		fontFamily: string;
		shadowColor: string;
		shadowOpacity: number;
		shadowRadius: number;
		shadowOffset: { width: number; height: number };
	}
> = {
	suggestion: {
		borderWidth: 1,
		borderColor: "#D8E6F5",
		backgroundColor: "#FFFFFF",
		textColor: "#2E5F8A",
		fontFamily: "Roboto",
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
	},
	selected: {
		borderWidth: 1.2,
		borderColor: "#A9CBEA",
		backgroundColor: "#EAF4FF",
		textColor: "#2F628F",
		fontFamily: "RobotoMedium",
		shadowColor: "#4A90E2",
		shadowOpacity: 0.1,
		shadowRadius: 5,
		shadowOffset: { width: 0, height: 2 },
	},
	common: {
		borderWidth: 1.4,
		borderColor: "#9FC6EA",
		backgroundColor: "#F8FCFF",
		textColor: "#245784",
		fontFamily: "RobotoMedium",
		shadowColor: "#4A90D9",
		shadowOpacity: 0.08,
		shadowRadius: 5,
		shadowOffset: { width: 0, height: 2 },
	},
	viewAll: {
		borderWidth: 0,
		borderColor: "transparent",
		backgroundColor: "#F8FCFF",
		textColor: "#245784",
		fontFamily: "RobotoMedium",
		shadowColor: "#4A90D9",
		shadowOpacity: 0.06,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
	},
};

export default function SelectionChip({
	text,
	onPress,
	disabled = false,
	variant = "common",
}: SelectionChipProps) {
	const chipStyle = VARIANT_STYLES[variant];
	const shouldCenterText = variant === "viewAll";

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			borderWidth={chipStyle.borderWidth}
			borderColor={chipStyle.borderColor}
			bg={chipStyle.backgroundColor}
			borderRadius={24}
			px="$4"
			py="$3"
			style={{
				alignItems: shouldCenterText ? "center" : undefined,
				shadowColor: chipStyle.shadowColor,
				shadowOpacity: chipStyle.shadowOpacity,
				shadowRadius: chipStyle.shadowRadius,
				shadowOffset: chipStyle.shadowOffset,
			}}
		>
			<Text
				style={{
					fontFamily: chipStyle.fontFamily,
					color: chipStyle.textColor,
					textAlign: shouldCenterText ? "center" : "left",
				}}
			>
				{text}
			</Text>
		</Pressable>
	);
}
