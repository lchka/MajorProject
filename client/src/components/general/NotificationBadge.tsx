import React from "react";
import { Box, Text } from "@gluestack-ui/themed";

type NotificationBadgeProps = {
	count?: number;
	top?: number;
	right?: number;
};

export default function NotificationBadge({
	count = 0,
	top = -7,
	right = -8,
}: NotificationBadgeProps) {
	if (count <= 0) {
		return null;
	}

	return (
		<Box
			style={{
				position: "absolute",
				top,
				right,
				width: 22,
				height: 22,
				borderRadius: 12,
				backgroundColor: "#C60000",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Text fontSize={11} lineHeight={10} fontWeight="$bold" color="#FFFFFF">
				{count > 9 ? "9+" : String(count)}
			</Text>
		</Box>
	);
}
