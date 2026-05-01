import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";
//	Component for displaying a red banner notification, typically used for error messages or important alerts. The banner includes an alert icon and a message, and it uses Moti for smooth animations when appearing or disappearing. The visibility of the banner can be controlled through the `visible` prop, allowing it to be shown or hidden based on certain conditions in the parent component.
type RedBannerProps = {
	message: string;
	visible?: boolean;
};

export default function RedBanner({ message, visible = false }: RedBannerProps) {
	return (
		<MotiView
			animate={{
				opacity: visible ? 1 : 0,
				translateY: visible ? 0 : -6,
				scale: visible ? 1 : 0.98,
			}}
			transition={{
				type: "timing",
				duration: 200,
			}}
			pointerEvents="none"
		>
			<Box
				style={{
					width: "100%",
					flexDirection: "row",
					alignItems: "center",
					gap: 8,
					paddingHorizontal: 14,
					paddingVertical: 9,
					borderRadius: 12,
					backgroundColor: "#FFE9EC",
					borderWidth: 1,
					borderColor: "#FFC9D0",
				}}
			>
				<Feather name="alert-triangle" size={16} color="#CB3A52" />
				<Text fontSize={13} lineHeight={16} color="#CB3A52" fontFamily="RobotoRegular" flex={1}>
					{message}
				</Text>
			</Box>
		</MotiView>
	);
}
