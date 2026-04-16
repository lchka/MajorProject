import React from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
NavigationProp,
RouteProp,
useNavigation,
useRoute,
} from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import { Box, Pressable, Text } from "@gluestack-ui/themed";
import CreateEvaluations from "./ShowEvaluation";
import ShowProduct from "./ShowProduct";
import LoadingScreen from "../../components/general/loadingScreen";
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
const routeImageUri = route.params?.imageUri;

const [cameraPermission, requestCameraPermission] = useCameraPermissions();
const cameraRef = React.useRef<CameraView | null>(null);

const [capturedUri, setCapturedUri] = React.useState<string | null>(null);
const [isCapturingPhoto, setIsCapturingPhoto] = React.useState(false);
const [isCameraReady, setIsCameraReady] = React.useState(false);
const [isFramingReady, setIsFramingReady] = React.useState(false);
const [isResolvingProduct, setIsResolvingProduct] = React.useState(false);
const [isProcessingEvaluation, setIsProcessingEvaluation] = React.useState(false);
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
// Keep scanned image when official lookup fails.
}

setResolvedProduct(displayProduct);
} catch (error) {
if (isGeminiSystemFailure(error)) {
navigation.navigate("LandingScreen");
return;
}

Alert.alert(
"Move closer to label",
"We could not read enough product details. Keep the product inside the green frame and try again.",
);
setCapturedUri(null);
} finally {
setIsResolvingProduct(false);
}
}, [loadActiveProfile, navigation]);

const runEvaluation = React.useCallback(async () => {
if (!resolvedProduct) {
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
}, [activeProfile, capturedUri, loadActiveProfile, navigation, resolvedProduct]);

const capturePhoto = React.useCallback(async () => {
if (!cameraRef.current || isCapturingPhoto || isResolvingProduct || isProcessingEvaluation) {
return;
}

try {
setIsCapturingPhoto(true);
const photo = await cameraRef.current.takePictureAsync({
quality: 0.9,
skipProcessing: true,
});

if (!photo?.uri) {
throw new Error("No photo URI");
}

setCapturedUri(photo.uri);
setResolvedProduct(null);
setEvaluationContext(null);
void resolveProductFromPhoto(photo.uri);
} catch {
Alert.alert("Capture failed", "Could not capture this image. Please try again.");
} finally {
setIsCapturingPhoto(false);
}
}, [isCapturingPhoto, isProcessingEvaluation, isResolvingProduct, resolveProductFromPhoto]);

const openGallery = React.useCallback(async () => {
if (isResolvingProduct || isProcessingEvaluation) {
return;
}

try {
const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
if (!permission.granted) {
Alert.alert("Permission required", "Gallery permission is needed to upload an image.");
return;
}

const picked = await ImagePicker.launchImageLibraryAsync({
mediaTypes: ImagePicker.MediaTypeOptions.Images,
allowsEditing: true,
aspect: [3, 4],
quality: 0.9,
});

if (picked.canceled || picked.assets.length === 0) {
return;
}

const imageUri = picked.assets[0].uri;
setCapturedUri(imageUri);
setResolvedProduct(null);
setEvaluationContext(null);
void resolveProductFromPhoto(imageUri);
} catch {
Alert.alert("Upload failed", "Could not open your gallery right now. Please try again.");
}
}, [isProcessingEvaluation, isResolvingProduct, resolveProductFromPhoto]);

React.useEffect(() => {
if (!routeImageUri) {
return;
}

setCapturedUri(routeImageUri);
setResolvedProduct(null);
setEvaluationContext(null);
void resolveProductFromPhoto(routeImageUri);
}, [resolveProductFromPhoto, routeImageUri]);

React.useEffect(() => {
if (!isCameraReady || capturedUri) {
setIsFramingReady(false);
return;
}

const timer = setTimeout(() => {
setIsFramingReady(true);
}, 900);

return () => {
clearTimeout(timer);
};
}, [capturedUri, isCameraReady]);

if (capturedUri && evaluationContext) {
if (isProcessingEvaluation) {
return <LoadingScreen staged />;
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
setEvaluationContext(null);
setResolvedProduct(null);
setActiveProfile(null);
}}
/>
);
}

if (capturedUri && (isResolvingProduct || isProcessingEvaluation)) {
return <LoadingScreen staged />;
}

if (capturedUri && resolvedProduct) {
return (
<ShowProduct
product={resolvedProduct}
capturedUri={capturedUri}
isProcessing={isProcessingEvaluation}
onContinue={(ingredients) => {
void (async () => {
if (!resolvedProduct) {
return;
}

const trimmedIngredients = ingredients
.map((item) => item.trim())
.filter((item) => item.length > 0);

let productForEvaluation = resolvedProduct;
try {
const currentIngredients = Array.isArray(resolvedProduct.ingredients)
? resolvedProduct.ingredients.filter(
(item): item is string => typeof item === "string" && item.trim().length > 0,
)
: [];

const hasChanged =
trimmedIngredients.length !== currentIngredients.length ||
trimmedIngredients.some((value, index) => value !== currentIngredients[index]);

if (hasChanged && trimmedIngredients.length > 0) {
const updated = await productService.updateProduct(resolvedProduct.id, {
ingredients: trimmedIngredients,
});
productForEvaluation = updated;
setResolvedProduct(updated);
}
} catch {
Alert.alert(
"Could not save ingredients",
"We will continue with the currently detected ingredients.",
);
}

setResolvedProduct(productForEvaluation);
void runEvaluation();
})();
}}
onRetake={() => {
setCapturedUri(null);
setResolvedProduct(null);
setEvaluationContext(null);
}}
/>
);
}

if (!cameraPermission) {
return <LoadingScreen staged={false} message="Preparing camera..." />;
}

if (!cameraPermission.granted) {
return (
<Box flex={1} bg="#071018" alignItems="center" justifyContent="center" px="$6">
<Feather name="camera-off" size={42} color="#E6F0FF" />
<Text mt="$3" fontSize={18} lineHeight={22} color="#E6F0FF" fontFamily="RobotoMedium" textAlign="center">
Camera access needed
</Text>
<Text mt="$2" fontSize={13} lineHeight={18} color="#B5C6DA" textAlign="center">
Allow camera permission so we can detect product name and details.
</Text>
<Pressable
onPress={() => {
void requestCameraPermission();
}}
mt="$5"
px="$4"
py="$2"
borderRadius="$full"
bg="#4D9FD8"
>
<Text color="#FFFFFF" fontFamily="RobotoMedium">
Grant Permission
</Text>
</Pressable>
</Box>
);
}

return (
<Box flex={1} bg="#000000">
<CameraView
ref={cameraRef}
facing="back"
style={{ flex: 1 }}
onCameraReady={() => {
setIsCameraReady(true);
}}
/>

<Box position="absolute" top={56} left={16} right={16}>
<Pressable
onPress={() => {
navigation.goBack();
}}
alignSelf="flex-start"
p="$2"
borderRadius="$full"
bg="rgba(9,15,20,0.55)"
>
<Feather name="x" size={22} color="#FFFFFF" />
</Pressable>

<Text mt="$4" fontSize={18} lineHeight={22} color="#FFFFFF" fontFamily="RobotoMedium">
Align the product label
</Text>
<Text mt="$1" fontSize={12} lineHeight={18} color="#D5E3F2">
Keep brand and product name inside the green frame for best detail extraction.
</Text>
</Box>

<Box
position="absolute"
top="11%"
left="5%"
right="5%"
bottom="10%"
borderWidth={4}
borderColor="rgba(255,102,102,0.42)"
borderRadius={18}
/>

<Box
position="absolute"
top="26%"
left="22%"
right="22%"
height="46%"
borderWidth={6}
borderColor={isFramingReady ? "#56D32F" : "#E76767"}
borderRadius={16}
/>

<Box position="absolute" left={0} right={0} bottom={30} px="$6">
<Box flexDirection="row" alignItems="center" justifyContent="space-between" mb="$3">
<Pressable
onPress={() => {
void openGallery();
}}
px="$3"
py="$2"
borderRadius="$full"
bg="rgba(16,30,42,0.62)"
>
<Text fontSize={12} color="#E8F1FB" fontFamily="RobotoMedium">
Gallery
</Text>
</Pressable>

<Box
px="$3"
py="$2"
borderRadius="$full"
bg={isFramingReady ? "rgba(35,126,55,0.74)" : "rgba(138,37,37,0.74)"}
>
<Text fontSize={12} color="#FFFFFF" fontFamily="RobotoMedium">
{isFramingReady ? "In range" : "Move product into frame"}
</Text>
</Box>
</Box>

<Pressable
onPress={() => {
void capturePhoto();
}}
disabled={isCapturingPhoto || isResolvingProduct || isProcessingEvaluation}
alignSelf="center"
width={84}
height={84}
borderRadius={42}
borderWidth={4}
borderColor="#FFFFFF"
bg={isCapturingPhoto || isResolvingProduct ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.22)"}
alignItems="center"
justifyContent="center"
>
<Box width={58} height={58} borderRadius={29} bg="#FFFFFF" />
</Pressable>
</Box>
</Box>
);
}
