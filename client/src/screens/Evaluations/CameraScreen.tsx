import React from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
	NavigationProp,
	RouteProp,
	useNavigation,
	useRoute,
} from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import { Box, Image, Pressable, Text } from "@gluestack-ui/themed";
import CreateEvaluations from "./ShowEvaluation";
import EvaluationLoading from "./EvaluationLoading";
import {
	evaluationContextService,
	productService,
	profileService,
	saveEvaluation,
} from "../../services";
import { isGeminiSystemFailure } from "../../config/api";
import type { EvaluationContext } from "../../services/evaluationContextService";
import type { Product } from "../../services/productService";
import type { Profile } from "../../services/profileService";
import type { AuthStackParamList } from "../../types/navigation";

export default function CameraScreen() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
	const route = useRoute<RouteProp<AuthStackParamList, "CameraScreen">>();
	const routeProfileId = route.params?.profileId;
	const [capturedUri, setCapturedUri] = React.useState<string | null>(null);
	const [isOpeningCamera, setIsOpeningCamera] = React.useState(false);
	const [isProcessingEvaluation, setIsProcessingEvaluation] = React.useState(false);
	const [activeProfile, setActiveProfile] = React.useState<Profile | null>(null);
	const [evaluatedProduct, setEvaluatedProduct] = React.useState<Product | null>(null);
	const [evaluationContext, setEvaluationContext] = React.useState<EvaluationContext | null>(null);

	const processCapturedPhoto = React.useCallback(async (uri: string) => {
		setIsProcessingEvaluation(true);

		try {
			const profiles = await profileService.getMyProfile();
			const selectedProfile =
				(routeProfileId
					? profiles.find((profile) => profile.id === routeProfileId)
					: null) ??
				profiles.find((profile) => profile.main_profile) ??
				profiles[0] ??
				null;

			if (!selectedProfile) {
				Alert.alert("Profile required", "Please create a profile before running evaluation.");
				return;
			}

			setActiveProfile(selectedProfile);

			const scannedProduct = await productService.scanProductImage({ uri });

			let displayProduct: Product = scannedProduct;
			try {
				const officialImagePayload = await productService.getOfficialImageByProductId(scannedProduct.id);
				if (officialImagePayload) {
					displayProduct = {
						...scannedProduct,
						product_image: officialImagePayload.product_image,
						product_image_user: officialImagePayload.product_image_user,
						product_image_official: officialImagePayload.product_image_official,
					};
				}
			} catch {
				// Keep the scanned image when official lookup fails.
			}

			setEvaluatedProduct(displayProduct);

			const evaluatedContext = await evaluationContextService.evaluateProduct({
				productId: scannedProduct.id,
				profileId: selectedProfile.id,
			});

			await saveEvaluation({
				evaluationContextId: evaluatedContext.id,
				profileId: evaluatedContext.profileId,
				productId: evaluatedContext.productId,
				promptId: evaluatedContext.promptId,
				resultJson: evaluatedContext.resultJson,
				productName: displayProduct.name,
				profileName: selectedProfile.first_name?.trim() || "Profile",
				imageUri: displayProduct.product_image ?? null,
				createdAt: evaluatedContext.createdAt,
			});

			setEvaluationContext(evaluatedContext);
		} catch (error) {
			if (isGeminiSystemFailure(error)) {
				navigation.navigate("LandingScreen");
				return;
			}

			Alert.alert("Evaluation failed", "Could not finish this scan. Please try again.");
		} finally {
			setIsProcessingEvaluation(false);
		}
	}, [navigation, routeProfileId]);

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
				const imageUri = result.assets[0].uri;
				setCapturedUri(imageUri);
				setEvaluatedProduct(null);
				setEvaluationContext(null);
				void processCapturedPhoto(imageUri);
			}
		} catch {
			Alert.alert("Camera unavailable", "Could not open camera right now. Please try again.");
		} finally {
			setIsOpeningCamera(false);
		}
	}, [isOpeningCamera, processCapturedPhoto]);

	if (capturedUri) {
		if (isProcessingEvaluation) {
			return <EvaluationLoading />;
		}

		return (
			<CreateEvaluations
				imageUri={evaluatedProduct?.product_image ?? capturedUri}
				productName={evaluatedProduct?.name ?? "Analyzing Product"}
				isProcessing={false}
				resultJson={evaluationContext?.resultJson}
				greetingName={activeProfile?.first_name?.trim() || "Lili"}
				profileImageUri={activeProfile?.profile_image}
				currentProfileAllergens={activeProfile?.allergens?.map((item) => item.name) ?? []}
				currentProfileConditions={activeProfile?.conditions?.map((item) => item.name) ?? []}
				currentProfilePreferences={activeProfile?.preferences?.map((item) => item.name) ?? []}
				onRetake={() => {
					setCapturedUri(null);
					setEvaluationContext(null);
					setEvaluatedProduct(null);
					setActiveProfile(null);
				}}
			/>
		);
	}

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
