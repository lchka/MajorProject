import React from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import { Box, Image, Pressable, Text } from "@gluestack-ui/themed";

export default function CameraScreen() {
	const [capturedUri, setCapturedUri] = React.useState<string | null>(null);
	const [isOpeningCamera, setIsOpeningCamera] = React.useState(false);

	const handleSnapPhoto = React.useCallback(async () => {
		if (isOpeningCamera) {
			return;
		}

		try {
			setIsOpeningCamera(true);

			const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
			if (!permissionResult.granted) {
				Alert.alert("Permission required", "Camera permission is needed to take a photo.");
				return;
			}

			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [3, 4],
				quality: 0.9,
			});

			if (!result.canceled && result.assets.length > 0) {
				setCapturedUri(result.assets[0].uri);
			}
		} catch {
			Alert.alert("Camera unavailable", "Could not open camera right now. Please try again.");
		} finally {
			setIsOpeningCamera(false);
		}
	}, [isOpeningCamera]);

	return (
		<Box flex={1} bg="#F2F6FA" alignItems="center" justifyContent="center" px="$5">
			<Text fontSize={28} lineHeight={32} color="#0F172A" fontFamily="RobotoMedium" mb="$4">
				Camera
			</Text>

			<Box
				style={{
					width: "100%",
					maxWidth: 360,
					aspectRatio: 3 / 4,
					borderRadius: 22,
					borderWidth: 1,
					borderColor: "#DDE6EF",
					backgroundColor: "#EAF1F8",
					overflow: "hidden",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{capturedUri ? (
					<Image
						source={{ uri: capturedUri }}
						alt="Captured photo"
						style={{ width: "100%", height: "100%" }}
						resizeMode="cover"
					/>
				) : (
					<Box alignItems="center" justifyContent="center">
						<Feather name="camera" size={42} color="#6B7E91" />
						<Text mt="$2" fontSize={14} lineHeight={18} color="#6B7E91" fontFamily="Roboto">
							No photo captured yet
						</Text>
					</Box>
				)}
			</Box>

			<Box width="$full" maxWidth={360} mt="$5" style={{ gap: 10 }}>
				<Pressable
					onPress={handleSnapPhoto}
					disabled={isOpeningCamera}
					style={{
						height: 52,
						borderRadius: 14,
						backgroundColor: "#4D9FD8",
						alignItems: "center",
						justifyContent: "center",
						opacity: isOpeningCamera ? 0.7 : 1,
					}}
				>
					<Text fontSize={16} lineHeight={18} color="#FFFFFF" fontFamily="RobotoMedium">
						{capturedUri ? "Retake Photo" : isOpeningCamera ? "Opening Camera..." : "Snap Picture"}
					</Text>
				</Pressable>

				{capturedUri ? (
					<Pressable
						onPress={() => setCapturedUri(null)}
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
							Clear Photo
						</Text>
					</Pressable>
				) : null}
			</Box>
		</Box>
	);
}
