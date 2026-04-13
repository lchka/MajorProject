import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { Box, Pressable, Text } from "@gluestack-ui/themed";
import EditButton from "../Buttons/EditButton";

type AllConditionsProps = {
	conditionNames?: string[];
	onPressEdit?: () => void;
	onPressCondition?: (conditionName: string) => void;
};

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
	onPressEdit,
	onPressCondition,
}: AllConditionsProps) {
	const conditions = conditionNames ?? [];

	return (
		<Box
			my="$5"
			style={{
				backgroundColor: "#F1F4F8",
				borderWidth: 1,
				borderColor: "#DFE5EC",
				borderRadius: 22,
				padding: 16,
				shadowColor: "#0B2033",
				shadowOpacity: 0.08,
				shadowRadius: 14,
				shadowOffset: { width: 0, height: 8 },
				elevation: 4,
			}}
		>
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

			<Box
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 14,
				}}
			>
				<Box>
					<Text fontSize={21} lineHeight={24} fontFamily="RobotoMedium" color="#151515">
						Conditions Overview
					</Text>
					<Text mt="$1" fontSize={12} lineHeight={14} color="#748191" fontFamily="Roboto">
						Track your skin condition profile
					</Text>
				</Box>

				<Box style={{ marginTop: -4 }}>
					<EditButton
						onPress={onPressEdit}
						width={72}
						label="Edit"
						borderColor="#CFD6E0"
						textColor="#5B5BE6"
						style={{ backgroundColor: "transparent", borderWidth: 0, height: 28 }}
						textStyle={{ fontSize: 18, lineHeight: 20, fontFamily: "Roboto", textTransform: "none" }}
					/>
				</Box>
			</Box>

			{conditions.length ? (
				<Box style={{ gap: 12 }}>
					{conditions.map((conditionName) => {
						const accent = conditionAccent(conditionName);

						return (
							<Pressable
								key={conditionName}
								onPress={() => onPressCondition?.(conditionName)}
								style={{
									borderRadius: 18,
									backgroundColor: accent.surfaceBg,
									borderWidth: 1,
									borderColor: "#E7ECF2",
									overflow: "hidden",
								}}
							>
								<Box style={{ flexDirection: "row", alignItems: "center", minHeight: 82 }}>
									<Box style={{ width: 7, alignSelf: "stretch", backgroundColor: accent.stripBg }} />

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
										color="#1A1A1A"
										fontFamily="RobotoMedium"
										style={{ marginLeft: 14, flex: 1 }}
									>
										{conditionName}
									</Text>

									<Box style={{ marginRight: 14 }}>
										<Feather name="chevron-right" size={24} color="#7D8896" />
									</Box>
								</Box>
							</Pressable>
						);
					})}
				</Box>
			) : (
				<Box
					style={{
						backgroundColor: "#FFFFFF",
						borderRadius: 14,
						paddingVertical: 18,
						paddingHorizontal: 14,
						borderWidth: 1,
						borderColor: "#E9EEF4",
					}}
				>
					<Text fontSize={15} lineHeight={18} color="#667085" fontFamily="Roboto">
						No conditions added yet.
					</Text>
				</Box>
			)}
		</Box>
	);
}
