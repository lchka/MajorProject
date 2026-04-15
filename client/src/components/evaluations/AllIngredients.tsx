import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";

type AllIngredientsProps = {
	items: string[];
	index?: number;
};

function ChipList({ items }: { items: string[] }) {
	if (!items.length) {
		return (
			<Text fontSize={12} lineHeight={16} color="#7A838D" fontFamily="Roboto">
				None
			</Text>
		);
	}

	return (
		<Box flexDirection="row" flexWrap="wrap" style={{ gap: 8 }}>
			{items.map((item, itemIndex) => (
				<Box key={`${item}-${itemIndex}`} px="$2" py="$1" bg="#F2F4F7" borderRadius={999}>
					<Text fontSize={12} lineHeight={16} color="#2F3A47" fontFamily="Roboto">
						{item}
					</Text>
				</Box>
			))}
		</Box>
	);
}

export default function AllIngredients({ items, index = 0 }: AllIngredientsProps) {
	return (
		<MotiView
			from={{ opacity: 0, translateY: 8 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: "timing", duration: 260, delay: 70 + index * 50 }}
		>
			<Box mt="$3"  borderWidth={1} borderColor="#E4E6EA" bg="#FFFFFF" borderRadius={14} p="$3">
				<Box flexDirection="row" alignItems="center" mb="$2" style={{ gap: 8 }}>
					<Ionicons name="list-outline" size={24} color="#42586F" />
					<Text fontSize={20} lineHeight={24} color="#202A36" fontFamily="RobotoMedium">
						All Ingredients
					</Text>
				</Box>

				<ChipList items={items} />
			</Box>
		</MotiView>
	);
}
