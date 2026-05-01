import React from "react";
import LottieView from "lottie-react-native";
import { MotiText } from "moti";
import { Box } from "@gluestack-ui/themed";
//	Component for a simple loading screen that displays a loading animation and an optional message. The component accepts props for the message text, whether to take up the full screen, a compact mode for smaller displays, the size of the animation, and the background color. It uses a Lottie animation to provide visual feedback during loading processes and styles the container and text to create a clean and user-friendly interface. The component is flexible and can be used in various parts of the app where a loading state needs to be indicated to the user.	
type SimpleLoadingScreenProps = {
	message?: string;
	fullScreen?: boolean;
	compact?: boolean;
	animationSize?: number;
	backgroundColor?: string;
};

export default function SimpleLoadingScreen({
	message = "Loading...",
	fullScreen = true,
	compact = false,
	animationSize = 180,
	backgroundColor = "#F8FBFF",
}: SimpleLoadingScreenProps) {
	return (
		<Box
			flex={fullScreen ? 1 : undefined}
			bg={backgroundColor}
			alignItems="center"
			justifyContent="center"
			px="$5"
			py={compact ? "$2" : "$6"}
		>
			<Box alignItems="center" justifyContent="center">
				<LottieView
					source={require("../../../assets/animations/loading_screen.json")}
					autoPlay
					loop
					style={{ width: animationSize, height: animationSize }}
				/>

				<MotiText
					from={{ opacity: 0, translateY: 4 }}
					animate={{ opacity: 1, translateY: 0 }}
					transition={{ type: "timing", duration: 280 }}
					style={{
						marginTop: 6,
						textAlign: "center",
						fontSize: 14,
						lineHeight: 20,
						color: "#2A3B4D",
						fontFamily: "RobotoMedium",
					}}
				>
					{message}
				</MotiText>
			</Box>
		</Box>
	);
}
