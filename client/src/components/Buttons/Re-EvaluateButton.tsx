import React from "react";
import {
	DimensionValue,
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	ViewStyle,
} from "react-native";

type ReEvaluateButtonProps = {
	onPress?: () => void;
	label?: string;
	disabled?: boolean;
	isLoading?: boolean;
	width?: DimensionValue;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	backgroundColor?: string;
	borderColor?: string;
	textColor?: string;
};

export default function ReEvaluateButton({
	onPress,
	label = "Re-evaluate",
	disabled = false,
	isLoading = false,
	width = 96,
	style,
	textStyle,
	backgroundColor = "transparent",
	borderColor = "#ffca61",
	textColor = "#eeb33c",
}: ReEvaluateButtonProps) {
	const isDisabled = disabled || isLoading;

	return (
		<Pressable
			onPress={onPress}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.button,
				{
					width,
					backgroundColor,
					borderColor,
					opacity: isDisabled ? 0.65 : pressed ? 0.88 : 1,
				},
				style,
			]}
		>
			<Text style={[styles.label, { color: textColor }, textStyle]}>
				{isLoading ? "Re-evaluating..." : label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		height: 34,
		borderRadius: 999,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 12,
	},
	label: {
		fontSize: 13,
		lineHeight: 15,
		fontFamily: "RobotoMedium",
		textTransform: "uppercase",
	},
});
