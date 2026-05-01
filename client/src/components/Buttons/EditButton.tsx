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
// Component for a customizable "Edit" button that can be used in various parts of the app, such as editing user profiles or modifying settings. The button supports a disabled state and allows customization of its appearance through props for border color, text color, width, and label. The component uses the Pressable component from Gluestack UI for handling press interactions and styling, and it provides visual feedback by changing opacity when pressed or disabled.
type EditButtonProps = {
	onPress?: () => void;
	label?: string;
	disabled?: boolean;
	width?: DimensionValue;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	borderColor?: string;
	textColor?: string;
};
// The EditButton component renders a Pressable button that changes its appearance based on the disabled state. When the button is pressed, it triggers the onPress callback if provided. The button's label defaults to "EDIT" but can be customized through props. The opacity of the button is reduced when disabled or pressed to provide visual feedback to the user. The styles for the button and label are defined using StyleSheet for better performance and maintainability.
export default function EditButton({
	onPress,
	label = "EDIT",
	disabled = false,
	width = 110,
	style,
	textStyle,
	borderColor = "#8FC3FF",
	textColor = "#8FC3FF",
}: EditButtonProps) {
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={({ pressed }) => [
				styles.button,
				{ width, borderColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
				style,
			]}
		>
			<Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		height: 42,
		borderWidth: 2,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "transparent",
	},
	label: {
		fontSize: 26,
		lineHeight: 28,
		fontWeight: "700",
		letterSpacing: 0.5,
		textTransform: "uppercase",
	},
});
