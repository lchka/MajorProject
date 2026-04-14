import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";

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
