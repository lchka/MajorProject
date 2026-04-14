import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";

type ProfileWarningProps = {
	message: string;
	visible?: boolean;
};

export default function ProfileWarning({ message, visible = false }: ProfileWarningProps) {
	return (
		<MotiView
			animate={{
				opacity: visible ? 1 : 0,
				translateY: 0,
				scale: visible ? 1 : 0.94,
			}}
			transition={{
				type: "timing",
				duration: 200,
			}}
			style={{ zIndex: 20 }}
			pointerEvents="none"
		>
			<Box
				style={{
					width: "100%",
					flexDirection: "row",
					alignItems: "center",
					gap: 8,
					paddingHorizontal: 16,
					paddingVertical: 9,
					borderRadius: 12,
					backgroundColor: "#fee9ec",
					borderWidth: 1,
					borderColor: "#FFD7B5",
				}}
			>
				<Feather name="alert-triangle" size={16} color="#C95D1A" />
				<Text fontSize={13} lineHeight={16} color="#FF5D73" fontFamily="RobotoMedium" flex={1}>
					{message}
				</Text>
			</Box>
		</MotiView>
	);
}
