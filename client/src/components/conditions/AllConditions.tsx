import React from "react";
import { ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { Box, HStack, Pressable, Text } from "@gluestack-ui/themed";
import EditButton from "../Buttons/EditButton";
import CurrentProfile from "../general/CurrentProfileName";
//
type ResolvedConditionItem = {
	label: string;
	runtimeId: string;
};

type AllConditionsProps = {
	conditionNames?: string[];
	conditions?: { id?: string; name: string }[];
	profileFirstName?: string;
	onPressEdit?: () => void;
	onPressCondition?: (conditionName: string) => void;
	variant?: "visual" | "chips";
};
// Component for displaying a list of conditions associated with a user's profile, such as skin conditions or allergies. The component can render in two variants: a "visual" variant that displays condition cards with icons and colors for quick scanning, and a "chips" variant that shows conditions as small labeled chips. The component accepts props for the list of condition names or objects, the user's first name for personalization, and callbacks for editing conditions or pressing individual condition cards. The layout adapts to the number of conditions, switching to a horizontal scrollable format if there are more than two conditions to display.
function normalizeConditionName(value: string) {
	return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function resolveConditionItems(
	conditionNames?: string[],
	sourceConditions?: { id?: string; name: string }[],
) {
	const resolved: ResolvedConditionItem[] = [];
	const seen = new Set<string>();

	const input =
		sourceConditions && sourceConditions.length > 0
			? sourceConditions.map((item) => ({
					key: item.id ?? item.name,
					name: item.name,
				}))
			: conditionNames?.map((name) => ({
					key: name,
					name,
				})) ?? [];

	input.forEach((item) => {
		const normalized = normalizeConditionName(item.name);
		if (!normalized || seen.has(normalized)) {
			return;
		}

		seen.add(normalized);
		resolved.push({
			label: item.name.trim(),
			runtimeId: String(item.key),
		});
	});

	return resolved;
}

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
	conditions,
	profileFirstName,
	onPressEdit,
	onPressCondition,
	variant = "visual",
}: AllConditionsProps) {
	const [conditionViewportWidth, setConditionViewportWidth] = React.useState(0);
	const [conditionPage, setConditionPage] = React.useState(0);
	const resolvedConditions = React.useMemo(
		() => resolveConditionItems(conditionNames, conditions),
		[conditionNames, conditions],
	);
	const conditionLabels = React.useMemo(
		() => resolvedConditions.map((item) => item.label),
		[resolvedConditions],
	);
	const horizontalColumnWidth = 330;
	// Switch to horizontal paging once cards exceed two visible stacked rows.
	const useHorizontalScroller = conditionLabels.length > 2;
	// Build two-card columns for the horizontal layout.
	const conditionColumns = React.useMemo(() => {
		if (!useHorizontalScroller) {
			return [] as string[][];
		}

		// Group cards in pairs so each horizontal column renders up to two stacked items.
		const columns: string[][] = [];
		for (let index = 0; index < conditionLabels.length; index += 2) {
			columns.push(conditionLabels.slice(index, index + 2));
		}

		return columns;
	}, [conditionLabels, useHorizontalScroller]);

	const pagedColumnWidth = conditionViewportWidth > 0
		? Math.max(240, conditionViewportWidth - 10)
		: horizontalColumnWidth;

	const showConditionDots = useHorizontalScroller && conditionColumns.length > 1;

	React.useEffect(() => {
		setConditionPage(0);
	}, [conditionLabels.length, useHorizontalScroller]);

	const handleConditionHorizontalScroll = React.useCallback(
		(offsetX: number) => {
			if (!conditionViewportWidth) {
				return;
			}

			const pageIndex = Math.round(offsetX / conditionViewportWidth);
			setConditionPage((previous) => (previous === pageIndex ? previous : pageIndex));
		},
		[conditionViewportWidth],
	);

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

	const renderChips = React.useCallback(() => {
		if (!resolvedConditions.length) {
			return (
				<Text fontSize={12} lineHeight={16} color="#7A838D" fontFamily="Roboto">
					None
				</Text>
			);
		}

		return (
			<Box flexDirection="row" flexWrap="wrap" style={{ gap: 8 }}>
				{resolvedConditions.map((condition) => (
					<Box
						key={condition.runtimeId}
						flexDirection="row"
						alignItems="center"
						px="$3"
						py="$1"
						borderRadius={20}
						bg="#EEF6FF"
						borderWidth={1}
						borderColor="#D6E8FF"
						style={{ gap: 6 }}
					>
						<Ionicons name="checkmark" size={12} color="#3B82F6" />
						<Text fontSize={12} fontFamily="RobotoMedium" color="#2A3642">
							{condition.label}
						</Text>
					</Box>
				))}
			</Box>
		);
	}, [resolvedConditions]);

	return (
		<Box my={variant === "chips" ? "$0" : "$6"}
			style={{
				marginHorizontal: variant === "chips" ? 0 : -4,
				borderRadius: variant === "chips" ? 0 : 22,
				padding: variant === "chips" ? 0 : 16,
				backgroundColor: "transparent",
			}}
		>
			{variant === "visual" ? (
				<>
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
								<CurrentProfile firstName={profileFirstName} fontSize={20} lineHeight={24} color="#1dd2d8" />
								<Text fontSize={20} lineHeight={20} fontFamily="RobotoMedium" color="$black">
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
				</>
			) : null}

			{conditionLabels.length ? (
				variant === "chips" ? (
					renderChips()
				) : useHorizontalScroller ? (
					<Box
						onLayout={(event) => {
							setConditionViewportWidth(event.nativeEvent.layout.width);
						}}
					>
						{/* Long lists become swipeable pages with dots, matching past-analysis paging affordance. */}
						<ScrollView
							horizontal
							pagingEnabled
							scrollEventThrottle={16}
							onScroll={(event) => {
								handleConditionHorizontalScroll(event.nativeEvent.contentOffset.x);
							}}
							onMomentumScrollEnd={(event) => {
								handleConditionHorizontalScroll(event.nativeEvent.contentOffset.x);
							}}
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ paddingRight: 6 }}
						>
							<Box style={{ flexDirection: "row", gap: 12 }}>
								{conditionColumns.map((column, columnIndex) => (
									<Box key={`condition-column-${columnIndex}`} style={{ width: pagedColumnWidth, gap: 12 }}>
										{column.map((conditionName) => renderConditionCard(conditionName))}
									</Box>
								))}
							</Box>
						</ScrollView>

						{showConditionDots ? (
							<Box style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 8 }}>
								{conditionColumns.map((_, index) => (
									<Box
										key={`condition-page-dot-${index}`}
										style={{
											width: index === conditionPage ? 14 : 6,
											height: 6,
											borderRadius: 999,
											backgroundColor: index === conditionPage ? "#556575" : "#B8C3CC",
											opacity: index === conditionPage ? 1 : 0.7,
										}}
									/>
								))}
							</Box>
						) : null}
					</Box>
				) : (
					<Box style={{ gap: 12 }}>
						{conditionLabels.map((conditionName) => renderConditionCard(conditionName))}
					</Box>
				)
			) : (
				<Box
					bg={variant === "chips" ? "#F8FAFC" : "$white"}
					borderColor={variant === "chips" ? "#E4EDF6" : "$borderLight300"}
					style={{
						borderRadius: variant === "chips" ? 12 : 14,
						paddingVertical: variant === "chips" ? 8 : 18,
						paddingHorizontal: variant === "chips" ? 12 : 14,
						borderWidth: 1,
					}}
				>
					<Text
						fontSize={variant === "chips" ? 12 : 15}
						lineHeight={variant === "chips" ? 16 : 18}
						color={variant === "chips" ? "#7A838D" : "$textLight500"}
						fontFamily="Roboto"
					>
						{variant === "chips" ? "None" : "No conditions added yet."}
					</Text>
				</Box>
			)}
		</Box>
	);
}
