import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box } from "@gluestack-ui/themed";

type ProfileEditBadgeProps = {
	sizePreset: "large" | "small";
	style?: StyleProp<ViewStyle>;
};

const presetBySize = {
	large: {
		width: 40,
		height: 40,
		borderRadius: 25,
		iconSize: 22,
	},
	small: {
		width: 30,
		height: 30,
		borderRadius: 18,
		iconSize: 18,
	},
} as const;

export function ProfileEditBadge({ sizePreset, style }: ProfileEditBadgeProps) {
	const preset = presetBySize[sizePreset];

	return (
		<MotiView
			style={style}
			from={{ transform: [{ rotate: "-8deg" }] }}
			animate={{ transform: [{ rotate: "8deg" }] }}
			transition={{
				type: "timing",
				duration: 180,
				loop: true,
				repeatReverse: true,
			}}
		>
			<Box
				style={{
					width: preset.width,
					height: preset.height,
					borderRadius: preset.borderRadius,
					backgroundColor: "#EAF7FF",
					alignItems: "center",
					justifyContent: "center",
					borderWidth: 1,
					borderColor: "#79C6EE",
					zIndex: 4,
				}}
			>
				<Feather name="edit-2" size={preset.iconSize} color="#2E96CB" />
			</Box>
		</MotiView>
	);
}

export default ProfileEditBadge;
