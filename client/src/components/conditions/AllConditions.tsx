import React from "react";
import { ScrollView } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Box, HStack, Pressable, Text } from "@gluestack-ui/themed";
import EditButton from "../Buttons/EditButton";
import CurrentProfile from "../general/CurrentProfileName";

type AllConditionsProps = {
	conditionNames?: string[];
	profileFirstName?: string;
	onPressEdit?: () => void;
	onPressCondition?: (conditionName: string) => void;
};

// Maps condition names to quick visual accents so cards are easy to scan.
function conditionAccent(name: string) {
	const normalized = name.trim().toLowerCase();

	if (normalized.includes("eczema")) {
		return {
			iconBg: "#FF6B63",
			stripBg: "#FFD8D4",
			surfaceBg: "#FFF7F6",
			icon: "droplet" as const,
		};
	}

	if (normalized.includes("dermatitis")) {
		return {
			iconBg: "#FFAA4C",
			stripBg: "#FFE4C8",
			surfaceBg: "#FFFAF3",
			icon: "activity" as const,
		};
	}

	return {
		iconBg: "#66B9E8",
		stripBg: "#D7EEFA",
		surfaceBg: "#F6FBFF",
		icon: "shield" as const,
	};
}

export default function AllConditions({
	conditionNames,
	profileFirstName,
	onPressEdit,
	onPressCondition,
}: AllConditionsProps) {
	const conditions = React.useMemo(() => conditionNames ?? [], [conditionNames]);
	const horizontalColumnWidth = 330;
	// Switch to horizontal paging once cards exceed two visible stacked rows.
	const useHorizontalScroller = conditions.length > 2;
	// Build two-card columns for the horizontal layout.
	const conditionColumns = React.useMemo(() => {
		if (!useHorizontalScroller) {
			return [] as string[][];
		}

		// Group cards in pairs so each horizontal column renders up to two stacked items.
		const columns: string[][] = [];
		for (let index = 0; index < conditions.length; index += 2) {
			columns.push(conditions.slice(index, index + 2));
		}

		return columns;
	}, [conditions, useHorizontalScroller]);

	const renderConditionCard = React.useCallback(
		(conditionName: string) => {
			// Accent colors/icons are derived from condition names for quick visual scanning.
			const accent = conditionAccent(conditionName);

			return (
				<Pressable
					key={conditionName}
					onPress={() => onPressCondition?.(conditionName)}
					borderColor="$borderLight300"
					style={{
						borderRadius: 18,
						backgroundColor: accent.surfaceBg,
						overflow: "hidden",
					}}
				>
					<Box style={{ flexDirection: "row", alignItems: "center", minHeight: 82 }}>
						<Box style={{ width: 10, alignSelf: "stretch", backgroundColor: accent.stripBg }} />

						<Box 
							style={{
								width: 52,
								height: 52,
								borderRadius: 26,
								backgroundColor: accent.iconBg,
								alignItems: "center",
								justifyContent: "center",
								marginLeft: 14,
							}}
						>
							<Feather name={accent.icon} size={22} color="#FFFFFF" />
						</Box>

						<Text
							fontSize={22}
							lineHeight={25}
							color="$black"
							fontFamily="RobotoMedium"
							style={{ marginLeft: 14, flex: 1 }}
						>
							{conditionName}
						</Text>

						<Box  style={{ marginRight: 14 }}>
							<Feather name="chevron-right" size={24} color="#7D8896" />
						</Box>
					</Box>
				</Pressable>
			);
		},
		[onPressCondition],
	);

	return (
		<Box my="$6"
			style={{
				marginHorizontal: -4,
				borderRadius: 22,
					padding: 16,
					backgroundColor: "transparent",
			}}
		>
			{/* Subtle top highlight used across landing sections for visual consistency. */}
			<Box
				style={{
					position: "absolute",
					top: 8,
					left: 16,
					right: 16,
					height: 2,
					borderRadius: 999,
					backgroundColor: "rgba(255,255,255,0.65)",
				}}
			/>

			{/* Section header with profile badge and shared edit control style. */}
			<Box
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 14,
				}}
			>
				<Box>
					<HStack alignItems="center" pl="$1" gap={6}>
						<CurrentProfile firstName={profileFirstName} fontSize={24} lineHeight={24} color="#1dd2d8" />
						<Text fontSize={24} lineHeight={24} fontFamily="RobotoMedium" color="$black">
							Conditions
						</Text>
					</HStack>
					
				</Box>

				<Box style={{ marginTop: -4 }}>
					<EditButton
						onPress={onPressEdit}
						width={72}
						label="Edit"
						borderColor="#9ed5f2"
						textColor="#499bc7"
						style={{ height: 28, backgroundColor: "transparent", borderWidth: 2 }}
						textStyle={{ fontSize: 14, lineHeight: 16, fontFamily: "Roboto", textTransform: "none" }}
					/>
				</Box>
			</Box>

			{conditions.length ? (
				useHorizontalScroller ? (
					// Long lists become swipeable columns to avoid overly tall cards stack.
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 6 }}>
						<Box style={{ flexDirection: "row", gap: 12 }}>
							{conditionColumns.map((column, columnIndex) => (
								<Box key={`condition-column-${columnIndex}`} style={{ width: horizontalColumnWidth, gap: 12 }}>
									{column.map((conditionName) => renderConditionCard(conditionName))}
								</Box>
							))}
						</Box>
					</ScrollView>
				) : (
					<Box style={{ gap: 12 }}>
						{conditions.map((conditionName) => renderConditionCard(conditionName))}
					</Box>
				)
			) : (
				<Box
					bg="$white"
					borderColor="$borderLight300"
					style={{
						borderRadius: 14,
						paddingVertical: 18,
						paddingHorizontal: 14,
						borderWidth: 1,
					}}
				>
					<Text fontSize={15} lineHeight={18} color="$textLight500" fontFamily="Roboto">
						No conditions added yet.
					</Text>
				</Box>
			)}
		</Box>
	);
}
