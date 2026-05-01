import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box, Image } from "@gluestack-ui/themed";
// Component for displaying an image associated with a product evaluation, such as a photo of the product packaging or a scanned image. The component accepts an optional imageUri prop that specifies the URI of the image to display. If the imageUri is provided, it renders the image in a styled format; if not, it shows a placeholder icon indicating that no image is available. The component uses Moti for smooth fade-in and scale animations when rendered, and it centers the content within a box with defined dimensions and styling.
type ImageEvaluationProps = {
	imageUri?: string | null;
};

export default function ImageEvaluation({
	imageUri,
}: ImageEvaluationProps) {
	return (
		<MotiView
			from={{ opacity: 0, scale: 0.97 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ type: "timing", duration: 280 }}
		>
			<Box mt="$3" alignItems="center">
				{imageUri ? (
					<Image
						source={{ uri: imageUri }}
						alt="Scanned product image"
						resizeMode="contain"
						style={{ width: 280, height: 280, borderRadius: 80 }}
					/>
				) : (
					<Box w={350} h={350} alignItems="center" justifyContent="center">
						<Feather name="image" size={24} color="#9CA8B4" />
					</Box>
				)}
			</Box>
		</MotiView>
	);
}
