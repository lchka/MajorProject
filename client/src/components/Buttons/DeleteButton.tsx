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
// Component for a customizable "Delete" button that can be used in various parts of the app, such as confirming deletion actions. The button supports disabled and loading states, and allows customization of its appearance through props for background color, border color, text color, and width. The component uses the Pressable component from Gluestack UI for handling press interactions and styling.
type DeleteButtonProps = {
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
// The DeleteButton component renders a Pressable button that changes its appearance based on the disabled and loading states. When the button is pressed, it triggers the onPress callback if provided. The button's label changes to "Deleting..." when in the loading state, and its opacity is reduced when disabled or pressed to provide visual feedback to the user. The styles for the button and label are defined using StyleSheet for better performance and maintainability.
export default function DeleteButton({
	onPress,
	label = "Delete",
	disabled = false,
	isLoading = false,
	width = 96,
	style,
	textStyle,
	backgroundColor = "transparent",
	borderColor = "#D64545",
	textColor = "#D64545",
}: DeleteButtonProps) {
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
				{isLoading ? "Deleting..." : label}
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
