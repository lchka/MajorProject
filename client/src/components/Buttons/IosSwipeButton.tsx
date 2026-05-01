import React from "react";
import { StyleSheet } from "react-native";
import { MotiView } from "moti";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Box, Pressable } from "@gluestack-ui/themed";
// Component for an iOS-style swipe button, typically used in scenarios like confirming actions or revealing additional options. The button features a pulsing animation to draw attention and can be customized with props for handling press events, changing the icon color and size, and disabling the button when necessary. The component uses Moti for smooth animations and Gluestack UI's Pressable for handling user interactions.
type IosSwipeButtonProps = {
	onPress?: () => void;
	iconColor?: string;
	iconSize?: number;
	disabled?: boolean;
};

export default function IosSwipeButton({
	onPress,
	iconColor = "#4A5562",
	iconSize = 32,
	disabled = false,
}: IosSwipeButtonProps) {
	return (
		<Box style={styles.wrap}>
			<MotiView
				from={{ scale: 0.96, opacity: 0.9 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{
					type: "timing",
					duration: 1200,
					loop: true,
					repeatReverse: true,
				}}
			>
				<Pressable style={styles.button} onPress={onPress} disabled={disabled}>
					<MaterialCommunityIcons name="scan-helper" size={iconSize} color={iconColor} />
				</Pressable>
			</MotiView>
		</Box>
	);
}

const styles = StyleSheet.create({
	wrap: {
		marginTop: -34,
	},
	button: {
		width: 86,
		height: 86,
		borderRadius: 43,
		backgroundColor: "#F8F8F8",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#88B9E8",
		shadowOpacity: 0.55,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 8 },
		elevation: 8,
	},
});
