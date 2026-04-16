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
import SimpleLoadingScreen from "../../components/general/SimpleLoadingScreen";
import { type EvaluationProfileItem } from "../../components/profile/EvaluationProfile";
import { type DifferentProfileItem } from "../../components/profile/DifferentProfile";
import {
evaluationContextService,
productService,
profileService,
saveEvaluation,
} from "../../services";
import { isGeminiSystemFailure, resolveMediaUrl } from "../../config/api";
import type { EvaluationContext } from "../../services/evaluationContextService";
import type { Product } from "../../services/productService";
import type { Profile } from "../../services/profileService";
import type { AuthStackParamList } from "../../types/navigation";

type EvaluationVariant = {
profile: Profile;
context: EvaluationContext;
};

export default function CameraScreen() {
const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
const route = useRoute<RouteProp<AuthStackParamList, "CameraScreen">>();
const routeProfileId = route.params?.profileId;
const routeImageUri = route.params?.imageUri;

const [cameraPermission, requestCameraPermission] = useCameraPermissions();
const cameraRef = React.useRef<CameraView | null>(null);
const [cameraFacing, setCameraFacing] = React.useState<"back" | "front">("back");

const [capturedUri, setCapturedUri] = React.useState<string | null>(null);
const [isCapturingPhoto, setIsCapturingPhoto] = React.useState(false);
const [isCameraReady, setIsCameraReady] = React.useState(false);
const [isFramingReady, setIsFramingReady] = React.useState(false);
const [isResolvingProduct, setIsResolvingProduct] = React.useState(false);
const [isProcessingEvaluation, setIsProcessingEvaluation] = React.useState(false);
const [activeProfile, setActiveProfile] = React.useState<Profile | null>(null);
const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]);
const [resolvedProduct, setResolvedProduct] = React.useState<Product | null>(null);
const [evaluationContext, setEvaluationContext] = React.useState<EvaluationContext | null>(null);
const [evaluationVariants, setEvaluationVariants] = React.useState<EvaluationVariant[]>([]);
const [activeEvaluationProfileId, setActiveEvaluationProfileId] = React.useState<string | undefined>(undefined);

const loadActiveProfile = React.useCallback(async (): Promise<Profile | null> => {
const profiles = await profileService.getMyProfile();
setAllProfiles(profiles);
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

const getProfileDisplayName = React.useCallback((profile: Profile) => {
const name = profile.first_name?.trim();
if (!name) {
return "Profile";
}

return name;
}, []);

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

const runEvaluation = React.useCallback(async (product: Product, selectedProfileIds?: string[]) => {
if (!product) {
return;
}

setIsProcessingEvaluation(true);

try {
const defaultProfile = activeProfile ?? (await loadActiveProfile());
if (!defaultProfile) {
return;
}

const profiles = allProfiles.length > 0 ? allProfiles : await profileService.getMyProfile();
if (allProfiles.length === 0) {
setAllProfiles(profiles);
}

const dedupedRequestedIds = Array.from(
new Set((selectedProfileIds?.length ? selectedProfileIds : [defaultProfile.id]).filter(Boolean)),
).slice(0, 3);

const selectedProfiles = dedupedRequestedIds
.map((profileId) => profiles.find((profile) => profile.id === profileId))
.filter((profile): profile is Profile => Boolean(profile));

const profilesToEvaluate = selectedProfiles.length > 0 ? selectedProfiles : [defaultProfile];

const evaluationJobs = profilesToEvaluate.map(async (profile) => {
const evaluatedContext = await evaluationContextService.evaluateProduct({
productId: product.id,
profileId: profile.id,
});

await saveEvaluation({
evaluationContextId: evaluatedContext.id,
profileId: evaluatedContext.profileId,
productId: evaluatedContext.productId,
promptId: evaluatedContext.promptId,
resultJson: evaluatedContext.resultJson,
productName: product.name,
profileName: getProfileDisplayName(profile),
imageUri: product.product_image ?? capturedUri ?? null,
createdAt: evaluatedContext.createdAt,
});

return {
profile,
context: evaluatedContext,
};
});

const settled = await Promise.allSettled(evaluationJobs);
const successful = settled
.filter(
(item): item is PromiseFulfilledResult<{ profile: Profile; context: EvaluationContext }> =>
item.status === "fulfilled",
)
.map((item) => item.value);

if (successful.length === 0) {
throw new Error("All evaluation requests failed.");
}

const primaryProfileId = profilesToEvaluate[0]?.id;
const primaryResult =
successful.find((item) => item.profile.id === primaryProfileId) ?? successful[0];

setEvaluationVariants(successful);
setActiveEvaluationProfileId(primaryResult.profile.id);
setActiveProfile(primaryResult.profile);
setEvaluationContext(primaryResult.context);
setResolvedProduct(product);

const failedCount = settled.length - successful.length;
if (failedCount > 0) {
Alert.alert(
"Partial success",
`Saved ${successful.length} evaluation${successful.length === 1 ? "" : "s"}. ${failedCount} failed.`,
);
}
} catch (error) {
if (isGeminiSystemFailure(error)) {
navigation.navigate("LandingScreen");
return;
}

Alert.alert("Evaluation failed", "Could not finish this evaluation. Please try again.");
} finally {
setIsProcessingEvaluation(false);
}
}, [activeProfile, allProfiles, capturedUri, getProfileDisplayName, loadActiveProfile, navigation]);

const capturePhoto = React.useCallback(async () => {
if (!cameraRef.current || isCapturingPhoto || isResolvingProduct || isProcessingEvaluation) {
return;
}

try {
setIsCapturingPhoto(true);
const photo = await cameraRef.current.takePictureAsync({
quality: 1,
skipProcessing: false,
});

if (!photo?.uri) {
throw new Error("No photo URI");
}

setCapturedUri(photo.uri);
setResolvedProduct(null);
setEvaluationContext(null);
setEvaluationVariants([]);
setActiveEvaluationProfileId(undefined);
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
allowsEditing: false,
quality: 1,
});

if (picked.canceled || picked.assets.length === 0) {
return;
}

const imageUri = picked.assets[0].uri;
setCapturedUri(imageUri);
setResolvedProduct(null);
setEvaluationContext(null);
setEvaluationVariants([]);
setActiveEvaluationProfileId(undefined);
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
setEvaluationVariants([]);
setActiveEvaluationProfileId(undefined);
void resolveProductFromPhoto(routeImageUri);
}, [resolveProductFromPhoto, routeImageUri]);

const evaluationProfileItems = React.useMemo<EvaluationProfileItem[]>(() => {
return allProfiles.map((profile) => ({
id: profile.id,
name: profile.first_name?.trim() || "Profile",
avatarSource: profile.profile_image ? { uri: profile.profile_image } : undefined,
isMain: profile.main_profile,
}));
}, [allProfiles]);

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
return <LoadingScreen />;
}

const resolvedActiveVariant =
evaluationVariants.find((variant) => variant.profile.id === activeEvaluationProfileId) ??
evaluationVariants[0] ??
null;
const displayedProfile = resolvedActiveVariant?.profile ?? activeProfile;
const displayedContext = resolvedActiveVariant?.context ?? evaluationContext;
const differentProfiles = evaluationVariants.map<DifferentProfileItem>(({ profile }) => {
const avatarUri = resolveMediaUrl(profile.profile_image);
return {
id: profile.id,
name: profile.first_name?.trim() || "Profile",
avatarSource: avatarUri ? { uri: avatarUri } : undefined,
isMain: profile.main_profile,
};
});

return (
<CreateEvaluations
imageUri={resolvedProduct?.product_image ?? capturedUri}
productName={resolvedProduct?.name ?? "Analyzing Product"}
isProcessing={false}
resultJson={displayedContext?.resultJson}
greetingName={displayedProfile?.first_name?.trim() || "Lili"}
profileImageUri={displayedProfile?.profile_image}
differentProfiles={differentProfiles}
activeDifferentProfileId={displayedProfile?.id}
onSelectDifferentProfile={(selectedProfileId) => {
setActiveEvaluationProfileId(selectedProfileId);
const selectedVariant = evaluationVariants.find(
(variant) => variant.profile.id === selectedProfileId,
);
if (selectedVariant) {
setActiveProfile(selectedVariant.profile);
setEvaluationContext(selectedVariant.context);
}
}}
currentProfileAllergens={displayedProfile?.allergens?.map((item) => item.name) ?? []}
currentProfileConditions={displayedProfile?.conditions?.map((item) => item.name) ?? []}
currentProfilePreferences={displayedProfile?.preferences?.map((item) => item.name) ?? []}
onRetake={() => {
setCapturedUri(null);
setEvaluationContext(null);
setResolvedProduct(null);
setEvaluationVariants([]);
setActiveEvaluationProfileId(undefined);
setActiveProfile(null);
}}
/>
);
}

if (capturedUri && isResolvingProduct) {
return <SimpleLoadingScreen message="Extracting ingredients..." />;
}

if (capturedUri && isProcessingEvaluation) {
return <LoadingScreen />;
}

if (capturedUri && resolvedProduct) {
return (
<>
<ShowProduct
product={resolvedProduct}
capturedUri={capturedUri}
isProcessing={isProcessingEvaluation}
evaluationProfiles={evaluationProfileItems}
defaultProfileId={activeProfile?.id}
onContinue={(ingredients, selectedProfileIds) => {
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
void runEvaluation(productForEvaluation, selectedProfileIds);
})();
}}
onRetake={() => {
setCapturedUri(null);
setResolvedProduct(null);
setEvaluationContext(null);
setEvaluationVariants([]);
setActiveEvaluationProfileId(undefined);
}}
/>
</>
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
facing={cameraFacing}
autofocus="on"
style={{ flex: 1 }}
onCameraReady={() => {
setIsCameraReady(true);
}}
/>

<Box
position="absolute"
top={0}
left={0}
right={0}
height="14%"
bg="rgba(0,0,0,0.92)"
/>

<Box
position="absolute"
left={0}
right={0}
bottom={0}
height="19%"
bg="rgba(0,0,0,0.94)"
/>

<Box position="absolute" top={50} left={16} right={16}>
<Box
flexDirection="row"
alignItems="center"
justifyContent="space-between"
bg="rgba(7,12,18,0.45)"
borderRadius="$full"
px="$3"
py="$2"
>
<Pressable
onPress={() => {
navigation.goBack();
}}
p="$2"
borderRadius="$full"
>
<Feather name="x" size={20} color="#FFFFFF" />
</Pressable>

<Text color="#FFFFFF" fontFamily="RobotoMedium" fontSize={16}>
PHOTO
</Text>

<Box width={36} alignItems="flex-end">
<Feather name="aperture" size={18} color="#FFFFFF" />
</Box>
</Box>

<Text mt="$3" fontSize={15} lineHeight={20} color="#FFFFFF" fontFamily="RobotoMedium" textAlign="center">
Center the product name and ingredients in the guide.
</Text>
</Box>

<Box
position="absolute"
top="11%"
left="5%"
right="5%"
bottom="10%"
borderWidth={2}
borderColor="rgba(255,255,255,0.2)"
borderRadius={18}
/>

<Box
position="absolute"
top="19%"
left="12%"
right="12%"
height="58%"
borderWidth={6}
borderColor={isFramingReady ? "#56D32F" : "#E76767"}
borderRadius={16}
/>

<Box position="absolute" left={0} right={0} bottom={26} px="$5">
<Box alignItems="center" mb="$3">
<Box
px="$3"
py="$2"
borderRadius="$full"
bg={isFramingReady ? "rgba(39,132,64,0.82)" : "rgba(151,54,54,0.82)"}
>
<Text fontSize={15} lineHeight={20} color="#FFFFFF" fontFamily="RobotoMedium">
{isFramingReady ? "Ready" : "Move product into frame"}
</Text>
</Box>
</Box>

<Box
flexDirection="row"
alignItems="center"
justifyContent="space-between"
bg="rgba(6,11,16,0.42)"
borderRadius={30}
px="$4"
py="$3"
>
<Pressable
onPress={() => {
void openGallery();
}}
width={50}
height={50}
borderRadius={12}
bg="rgba(255,255,255,0.18)"
borderWidth={1}
borderColor="rgba(255,255,255,0.28)"
alignItems="center"
justifyContent="center"
>
<Feather name="image" size={20} color="#FFFFFF" />
</Pressable>

<Pressable
onPress={() => {
void capturePhoto();
}}
disabled={isCapturingPhoto || isResolvingProduct || isProcessingEvaluation}
alignSelf="center"
width={88}
height={88}
borderRadius={44}
borderWidth={5}
borderColor="#FFFFFF"
bg="rgba(255,255,255,0.1)"
alignItems="center"
justifyContent="center"
>
<Box
width={68}
height={68}
borderRadius={34}
bg={isCapturingPhoto || isResolvingProduct ? "#D5DAE2" : "#FFFFFF"}
/>
</Pressable>

<Pressable
onPress={() => {
setCameraFacing((currentFacing) => (currentFacing === "back" ? "front" : "back"));
}}
width={50}
height={50}
borderRadius={12}
bg="rgba(255,255,255,0.18)"
borderWidth={1}
borderColor="rgba(255,255,255,0.28)"
alignItems="center"
justifyContent="center"
>
<Feather name="refresh-ccw" size={20} color="#FFFFFF" />
</Pressable>
</Box>
</Box>
</Box>
);
}
