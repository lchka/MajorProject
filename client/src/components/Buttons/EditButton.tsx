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
