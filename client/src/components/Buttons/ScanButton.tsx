import React from "react";
import { StyleSheet } from "react-native";
import { MotiView } from "moti";
import LottieView from "lottie-react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { Box, Pressable } from "@gluestack-ui/themed";
import { AuthStackParamList } from "../../types/navigation";
//	Component for a scan button that can be used to trigger a scanning action, such as opening a camera screen for QR code scanning. The button features a pulsing animation to draw attention and can be customized with props for handling press events, changing the icon size, and disabling the button when necessary. The component uses Moti for smooth animations, LottieView for displaying an animated icon, and Gluestack UI's Pressable for handling user interactions and styling. If no onPress callback is provided, the button will navigate to the "CameraScreen" in the navigation stack when pressed.
type ScanButtonProps = {
	onPress?: () => void;
	iconColor?: string;
	iconSize?: number;
	disabled?: boolean;
};

export default function ScanButton
({
	onPress,
	iconSize = 32,
	disabled = false,
}: ScanButtonProps) {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

	const handlePress = React.useCallback(() => {
		if (onPress) {
			onPress();
			return;
		}

		navigation.navigate("CameraScreen");
	}, [navigation, onPress]);

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
				<Pressable style={styles.button} onPress={handlePress} disabled={disabled}>
					<LottieView
						source={require("../../../assets/animations/scansmaller.json")}
						autoPlay
						loop
						style={{ width: iconSize + 18, height: iconSize + 18 }}
					/>
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
		shadowColor: "#6EC6FF",
		shadowOpacity: 0.9,
		shadowRadius: 28,
		shadowOffset: { width: 0, height: 12 },
		elevation: 18,
	},
});
