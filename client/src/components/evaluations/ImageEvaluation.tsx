import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box, Image, Text } from "@gluestack-ui/themed";

type ImageEvaluationProps = {
	imageUri?: string | null;
	productName: string;
	statusText: string;
};

export default function ImageEvaluation({
	imageUri,
	productName,
	statusText,
}: ImageEvaluationProps) {
	return (
		<MotiView
			from={{ opacity: 0, scale: 0.97 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ type: "timing", duration: 280 }}
		>
			<Box mt="$4" alignItems="center">
				{imageUri ? (
					<Image
						source={{ uri: imageUri }}
						alt={productName}
						resizeMode="contain"
						style={{ width: 320, height: 320, borderRadius: 26 }}
					/>
				) : (
					<Box w={350} h={350} alignItems="center" justifyContent="center">
						<Feather name="image" size={24} color="#9CA8B4" />
					</Box>
				)}

				<Text
					mt="$3"
					fontSize={20}
					lineHeight={24}
					color="#152433"
					fontFamily="RobotoMedium"
					textAlign="center"
				>
					{productName}
				</Text>

				<Text
					mt="$1"
					fontSize={12}
					lineHeight={16}
					color="#637384"
					fontFamily="Roboto"
					textAlign="center"
				>
					{statusText}
				</Text>
			</Box>
		</MotiView>
	);
}
