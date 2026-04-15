import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";
import type { DangerousIngredient } from "../../services/evaluationContextService";

type DangerousIngredientsProps = {
	items?: DangerousIngredient[];
	index?: number;
};

const getDangerColor = (level: number) => {
	if (level >= 7) return "#E54848"; // high
	if (level >= 4) return "#F59E0B"; // medium
	return "#38A169"; // low
};

const getRiskLabel = (level: number) => {
	if (level >= 7) return "High risk";
	if (level >= 4) return "Moderate risk";
	return "Low risk";
};

export default function DangerousIngredients({
	items,
	index = 2,
}: DangerousIngredientsProps) {
	if (!Array.isArray(items) || items.length === 0) {
		return null;
	}

	return (
		<MotiView
			from={{ opacity: 0, translateY: 8 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: "timing", duration: 260, delay: 70 + index * 50 }}
		>
			<Box
				mt="$3"
				borderWidth={1}
				borderColor="#E4E6EA"
				bg="#FFFFFF"
				borderRadius={14}
				p="$3"
			>
				{/* Header */}
				<Box flexDirection="row" alignItems="center" mb="$3" style={{ gap: 8 }}>
					<Ionicons name="warning-outline" size={20} color="#E54848" />
					<Text fontSize={20} fontWeight={600} lineHeight={20} color="#202A36" fontFamily="RobotoBold">
						Dangerous Ingredients
					</Text>
				</Box>

				{/* Items */}
				{items.map((item, itemIndex) => {
					const level = Math.max(0, Math.min(10, item.danger_level));
					const color = getDangerColor(level);

					return (
						<Box
							key={`${item.ingredient}-${itemIndex}`}
							mb={itemIndex === items.length - 1 ? 0 : 12}
							p="$3"
							borderRadius={12}
							bg="#F9FBFD"
							borderWidth={1}
							borderColor="#E6EDF3"
						>
							{/* Top row */}
							<Box flexDirection="row" justifyContent="space-between" alignItems="center">
								<Text
									fontSize={14}
									lineHeight={18}
									color="#1C2938"
									fontFamily="RobotoMedium"
									flex={1}
								>
									{item.ingredient}
								</Text>

								<Box
									px="$2"
									py="$1"
									borderRadius={10}
									bg={`${color}20`}
								>
									<Text fontSize={11} fontFamily="RobotoMedium" color={color}>
										{getRiskLabel(level)}
									</Text>
								</Box>
							</Box>

							{/* Progress bar */}
							<Box mt={6} h={6} bg="#E6ECF2" borderRadius={999} overflow="hidden">
								<Box
									h={6}
									borderRadius={999}
									bg={color}
									style={{ width: `${level * 10}%` }}
								/>
							</Box>

							{/* Level text */}
							<Text
								fontSize={11}
								lineHeight={14}
								color="#6B7A8C"
								fontFamily="Roboto"
								mt={4}
							>
								{`Danger level: ${level}/10`}
							</Text>

							{/* Reason */}
							{item.reason ? (
								<Text
									fontSize={12}
									lineHeight={17}
									color="#4A5A6B"
									fontFamily="Roboto"
									mt={6}
								>
									{item.reason}
								</Text>
							) : null}
						</Box>
					);
				})}
			</Box>
		</MotiView>
	);
}