import React from "react";
import { Box, Text } from "@gluestack-ui/themed";
//	Component for displaying a notification badge with a count of unread notifications or messages. The component accepts props for the count of notifications, as well as optional positioning values for the top and right offsets. If the count is zero or negative, the component returns null and does not render anything. If the count is greater than zero, it renders a red circular badge with the count displayed in white text, positioned according to the provided top and right values. The badge also handles counts greater than 9 by displaying "9+" to indicate that there are more than nine notifications.
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
