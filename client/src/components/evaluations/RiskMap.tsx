import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";
import type { EvaluationStatus } from "../../services/evaluationContextService";

type RiskIngredient = {
	label: string;
	status: EvaluationStatus;
};

type RiskMapProps = {
	ingredients: RiskIngredient[];
	index?: number;
};

const statusColor: Record<RiskIngredient["status"], string> = {
	safe: "#3D9560",
	caution: "#313538",
	avoid: "#E34141",
};

export default function RiskMap({ ingredients, index = 1 }: RiskMapProps) {
	return (
		<MotiView
			from={{ opacity: 0, translateY: 8 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: "timing", duration: 260, delay: 70 + index * 50 }}
		>
			<Box mt="$3" borderWidth={1} borderColor="#E4E6EA" bg="#FFFFFF" borderRadius={14} p="$3">
				<Box flexDirection="row" alignItems="center" mb="$2" style={{ gap: 8 }}>
					<Ionicons name="flask-outline" size={16} color="#42586F" />
					<Text fontSize={14} lineHeight={18} color="#202A36" fontFamily="RobotoMedium">
						Ingredient Risk Map
					</Text>
				</Box>

				<Box borderWidth={1} borderStyle="dashed" borderColor="#BFD0E1" borderRadius={8} p="$2">
					{ingredients.map((ingredient, ingredientIndex) => (
						<Box
							key={`${ingredient.label}-${ingredientIndex}`}
							flexDirection="row"
							alignItems="center"
							mb={ingredientIndex === ingredients.length - 1 ? 0 : 8}
						>
							<Text
								minWidth={95}
								fontSize={13}
								lineHeight={17}
								color="#233142"
								fontFamily="Roboto"
								numberOfLines={1}
							>
								{`${ingredient.label}:`}
							</Text>
							<Box flex={1} h={5} bg="#E6ECF2" borderRadius={999} overflow="hidden">
								<Box
									h={5}
									borderRadius={999}
									bg={statusColor[ingredient.status]}
									style={{
										width:
											ingredient.status === "safe"
												? "100%"
												: ingredient.status === "caution"
													? "72%"
													: "86%",
									}}
								/>
							</Box>
						</Box>
					))}
				</Box>
			</Box>
		</MotiView>
	);
}
