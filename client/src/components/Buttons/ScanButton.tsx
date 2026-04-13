import React from "react";
import { StyleSheet } from "react-native";
import { MotiView } from "moti";
import LottieView from "lottie-react-native";
import { Box, Pressable } from "@gluestack-ui/themed";

type ScanButton = {
	onPress?: () => void;
	iconColor?: string;
	iconSize?: number;
	disabled?: boolean;
};

export default function ScanButton
({
	onPress,
	iconColor = "#4A5562",
	iconSize = 32,
	disabled = false,
}: ScanButton) {
	const animationRef = React.useRef<LottieView>(null);

	const handlePress = React.useCallback(() => {
		animationRef.current?.reset();
		animationRef.current?.play();
		onPress?.();
	}, [onPress]);

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
						ref={animationRef}
						source={require("../../../assets/animations/scansmaller.json")}
						autoPlay={false}
						loop={false}
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
