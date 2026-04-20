import React from "react";
import LottieView from "lottie-react-native";
import { MotiText } from "moti";
import { Box } from "@gluestack-ui/themed";

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
