import React from "react";
import { Box, Image, Pressable, Text } from "@gluestack-ui/themed";
import type { Product } from "../../services/productService";

type ShowProductProps = {
	product: Product;
	capturedUri: string;
	isProcessing: boolean;
	onContinue: () => void;
	onRetake: () => void;
};

export default function ShowProduct({
	product,
	capturedUri,
	isProcessing,
	onContinue,
	onRetake,
}: ShowProductProps) {
	return (
		<Box flex={1} bg="#F2F6FA" px="$5" pt="$8" pb="$6">
			<Text fontSize={28} lineHeight={32} color="#0F172A" fontFamily="RobotoMedium" mb="$3">
				Product Found
			</Text>
			<Text fontSize={14} lineHeight={20} color="#475569" fontFamily="Roboto" mb="$4">
				Check this product. If correct, continue to evaluation.
			</Text>

			<Box
				style={{
					borderRadius: 18,
					borderWidth: 1,
					borderColor: "#DDE6EF",
					backgroundColor: "#FFFFFF",
					overflow: "hidden",
				}}
			>
				<Image
					source={{ uri: product.product_image ?? capturedUri }}
					alt={product.name}
					style={{ width: "100%", height: 260 }}
					resizeMode="cover"
				/>
				<Box px="$4" py="$4" style={{ gap: 8 }}>
					<Text fontSize={22} lineHeight={26} color="#0F172A" fontFamily="RobotoMedium">
						{product.name}
					</Text>
					{product.brand ? (
						<Text fontSize={14} lineHeight={18} color="#334155" fontFamily="Roboto">
							Brand: {product.brand}
						</Text>
					) : null}
					{product.category ? (
						<Text fontSize={14} lineHeight={18} color="#334155" fontFamily="Roboto">
							Category: {product.category}
						</Text>
					) : null}
				</Box>
			</Box>

			<Box mt="$5" style={{ gap: 10 }}>
				<Pressable
					onPress={onContinue}
					disabled={isProcessing}
					style={{
						height: 52,
						borderRadius: 14,
						backgroundColor: "#4D9FD8",
						alignItems: "center",
						justifyContent: "center",
						opacity: isProcessing ? 0.7 : 1,
					}}
				>
					<Text fontSize={16} lineHeight={18} color="#FFFFFF" fontFamily="RobotoMedium">
						Continue To Evaluation
					</Text>
				</Pressable>

				<Pressable
					onPress={onRetake}
					style={{
						height: 48,
						borderRadius: 14,
						borderWidth: 1,
						borderColor: "#D6E2ED",
						backgroundColor: "#FFFFFF",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text fontSize={15} lineHeight={17} color="#3B4A5A" fontFamily="RobotoMedium">
						Retake Photo
					</Text>
				</Pressable>
			</Box>
		</Box>
	);
}
