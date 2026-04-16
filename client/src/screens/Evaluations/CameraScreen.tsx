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
import ShowProduct from "./ShowProduct";
import EvaluationLoading from "../loading/EvaluationLoading";
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
	const [didAutoOpenCamera, setDidAutoOpenCamera] = React.useState(false);
	const [isResolvingProduct, setIsResolvingProduct] = React.useState(false);
	const [isProcessingEvaluation, setIsProcessingEvaluation] = React.useState(false);
	const [hasConfirmedProduct, setHasConfirmedProduct] = React.useState(false);
	const [activeProfile, setActiveProfile] = React.useState<Profile | null>(null);
	const [resolvedProduct, setResolvedProduct] = React.useState<Product | null>(null);
	const [evaluationContext, setEvaluationContext] = React.useState<EvaluationContext | null>(null);

	const loadActiveProfile = React.useCallback(async (): Promise<Profile | null> => {
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
			return null;
		}

		setActiveProfile(selectedProfile);
		return selectedProfile;
	}, [routeProfileId]);

	const resolveProductFromPhoto = React.useCallback(async (uri: string) => {
		setIsResolvingProduct(true);

		try {
			const selectedProfile = await loadActiveProfile();
			if (!selectedProfile) {
				return;
			}

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

			setResolvedProduct(displayProduct);
		} catch (error) {
			if (isGeminiSystemFailure(error)) {
				navigation.navigate("LandingScreen");
				return;
			}

			Alert.alert("Scan failed", "Could not identify this product. Please try again.");
		} finally {
			setIsResolvingProduct(false);
		}
	}, [loadActiveProfile, navigation]);

	const runEvaluation = React.useCallback(async () => {
		if (!resolvedProduct || !hasConfirmedProduct) {
			return;
		}

		setIsProcessingEvaluation(true);

		try {
			const selectedProfile = activeProfile ?? (await loadActiveProfile());
			if (!selectedProfile) {
				return;
			}

			const evaluatedContext = await evaluationContextService.evaluateProduct({
				productId: resolvedProduct.id,
				profileId: selectedProfile.id,
			});

			await saveEvaluation({
				evaluationContextId: evaluatedContext.id,
				profileId: evaluatedContext.profileId,
				productId: evaluatedContext.productId,
				promptId: evaluatedContext.promptId,
				resultJson: evaluatedContext.resultJson,
				productName: resolvedProduct.name,
				profileName: selectedProfile.first_name?.trim() || "Profile",
				imageUri: resolvedProduct.product_image ?? capturedUri ?? null,
				createdAt: evaluatedContext.createdAt,
			});

			setEvaluationContext(evaluatedContext);
		} catch (error) {
			if (isGeminiSystemFailure(error)) {
				navigation.navigate("LandingScreen");
				return;
			}

			Alert.alert("Evaluation failed", "Could not finish this evaluation. Please try again.");
		} finally {
			setIsProcessingEvaluation(false);
		}
	}, [activeProfile, capturedUri, hasConfirmedProduct, loadActiveProfile, navigation, resolvedProduct]);

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

			if (result.canceled) {
				navigation.goBack();
				return;
			}

			if (result.assets.length > 0) {
				const imageUri = result.assets[0].uri;
				setCapturedUri(imageUri);
				setHasConfirmedProduct(false);
				setResolvedProduct(null);
				setEvaluationContext(null);
				void resolveProductFromPhoto(imageUri);
			}
		} catch {
			Alert.alert("Camera unavailable", "Could not open camera right now. Please try again.");
		} finally {
			setIsOpeningCamera(false);
		}
	}, [isOpeningCamera, resolveProductFromPhoto]);

	React.useEffect(() => {
		if (didAutoOpenCamera) {
			return;
		}

		setDidAutoOpenCamera(true);
		void handleSnapPhoto();
	}, [didAutoOpenCamera, handleSnapPhoto]);

	if (capturedUri && evaluationContext) {
		if (isProcessingEvaluation) {
			return <EvaluationLoading />;
		}

		return (
			<CreateEvaluations
				imageUri={resolvedProduct?.product_image ?? capturedUri}
				productName={resolvedProduct?.name ?? "Analyzing Product"}
				isProcessing={false}
				resultJson={evaluationContext?.resultJson}
				greetingName={activeProfile?.first_name?.trim() || "Lili"}
				profileImageUri={activeProfile?.profile_image}
				currentProfileAllergens={activeProfile?.allergens?.map((item) => item.name) ?? []}
				currentProfileConditions={activeProfile?.conditions?.map((item) => item.name) ?? []}
				currentProfilePreferences={activeProfile?.preferences?.map((item) => item.name) ?? []}
				onRetake={() => {
					setCapturedUri(null);
					setHasConfirmedProduct(false);
					setEvaluationContext(null);
					setResolvedProduct(null);
					setActiveProfile(null);
					void handleSnapPhoto();
				}}
			/>
		);
	}

	if (capturedUri && (isResolvingProduct || isProcessingEvaluation)) {
		return <EvaluationLoading />;
	}

	if (capturedUri && resolvedProduct) {
		return (
			<ShowProduct
				product={resolvedProduct}
				capturedUri={capturedUri}
				isProcessing={isProcessingEvaluation}
				onContinue={() => {
					setHasConfirmedProduct(true);
					void runEvaluation();
				}}
				onRetake={() => {
					setCapturedUri(null);
					setHasConfirmedProduct(false);
					setResolvedProduct(null);
					setEvaluationContext(null);
					void handleSnapPhoto();
				}}
			/>
		);
	}

	if (isOpeningCamera || !didAutoOpenCamera) {
		return (
			<Box flex={1} bg="#000000" alignItems="center" justifyContent="center" px="$6">
				<Feather name="camera" size={42} color="#FFFFFF" />
				<Text mt="$3" fontSize={17} lineHeight={20} color="#FFFFFF" fontFamily="RobotoMedium">
					Opening Camera
				</Text>
			</Box>
		);
	}

	return null;
}
