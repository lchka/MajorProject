import React from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Path } from "react-native-svg";
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
import LoadingScreen from "../../components/loadingscreens/loadingScreen";
import SimpleLoadingScreen from "../../components/loadingscreens/SimpleLoadingScreen";
import ImagePreview from "../../components/evaluations/ImagePreview";
import { type EvaluationProfileItem } from "../../components/profile/EvaluationProfile";
import { type DifferentProfileItem } from "../../components/profile/DifferentProfile";
import {
evaluationContextService,
productService,
profileService,
saveEvaluation,
} from "../../services";
import { isGeminiSystemFailure, resolveMediaUrl } from "../../config/api";
import type { EvaluationContext } from "../../types/evaluationContext.type";
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

const [cameraLayout, setCameraLayout] = React.useState<{ width: number; height: number } | null>(null);

const [cameraPermission, requestCameraPermission] = useCameraPermissions();
const cameraRef = React.useRef<CameraView | null>(null);
const [isTorchEnabled, setIsTorchEnabled] = React.useState(false);

const [capturedUri, setCapturedUri] = React.useState<string | null>(null);
const [isCapturingPhoto, setIsCapturingPhoto] = React.useState(false);
const [isCameraReady, setIsCameraReady] = React.useState(false);
const [isFramingReady, setIsFramingReady] = React.useState(false);
const [showImagePreview, setShowImagePreview] = React.useState(false);
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

const hasExplicitSelection = Boolean(selectedProfileIds?.length);
const requestedProfileIds = hasExplicitSelection
? selectedProfileIds ?? []
: [defaultProfile.id];
const dedupedRequestedIds = Array.from(
new Set(requestedProfileIds.filter(Boolean)),
).slice(0, 3);

const selectedProfiles = dedupedRequestedIds
.map((profileId) => profiles.find((profile) => profile.id === profileId))
.filter((profile): profile is Profile => Boolean(profile));

if (hasExplicitSelection && selectedProfiles.length === 0) {
Alert.alert(
"Profiles unavailable",
"We could not find the selected profiles. Please re-open profile selection and try again.",
);
return;
}

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
setShowImagePreview(true);
setResolvedProduct(null);
setEvaluationContext(null);
setEvaluationVariants([]);
setActiveEvaluationProfileId(undefined);
} catch {
Alert.alert("Capture failed", "Could not capture this image. Please try again.");
} finally {
setIsCapturingPhoto(false);
}
}, [isCapturingPhoto, isProcessingEvaluation, isResolvingProduct]);

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
setShowImagePreview(true);
setResolvedProduct(null);
setEvaluationContext(null);
setEvaluationVariants([]);
setActiveEvaluationProfileId(undefined);
} catch {
Alert.alert("Upload failed", "Could not open your gallery right now. Please try again.");
}
}, [isProcessingEvaluation, isResolvingProduct]);

React.useEffect(() => {
if (!routeImageUri) {
return;
}

setCapturedUri(routeImageUri);
setShowImagePreview(true);
setResolvedProduct(null);
setEvaluationContext(null);
setEvaluationVariants([]);
setActiveEvaluationProfileId(undefined);
}, [routeImageUri]);

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

if (capturedUri && showImagePreview) {
return (
<ImagePreview
imageUri={capturedUri}
onApprove={() => {
setShowImagePreview(false);
void resolveProductFromPhoto(capturedUri);
}}
onRetake={() => {
setCapturedUri(null);
setShowImagePreview(false);
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
product={resolvedProduct!}
capturedUri={capturedUri!}
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

if (!cameraPermission?.granted) {
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
<Box
flex={1}
bg="#000000"
onLayout={(event) => {
const { width, height } = event.nativeEvent.layout;
if (width > 0 && height > 0) {
setCameraLayout({ width, height });
}
}}
>
<CameraView
ref={cameraRef}
facing="back"
autofocus="on"
enableTorch={isTorchEnabled}
style={{ flex: 1 }}
onCameraReady={() => {
setIsCameraReady(true);
}}
/>

{/* Blur everything outside the scanning frame while keeping the center clear. */}
{cameraLayout ? (
<MaskedView
pointerEvents="none"
style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
maskElement={(() => {
const layout = cameraLayout!;
const frameTop = layout.height * 0.12;
const frameBottom = layout.height * 0.16;
const frameLeft = layout.width * 0.105;
const frameRight = layout.width * 0.105;
const frameWidth = layout.width - frameLeft - frameRight;
const frameHeight = layout.height - frameTop - frameBottom;
const cornerRadius = 34;
const safeRadius = Math.max(0, Math.min(cornerRadius, frameWidth / 2, frameHeight / 2));

const roundedRectPath = (x: number, y: number, width: number, height: number, radius: number) => {
const r = Math.max(0, Math.min(radius, width / 2, height / 2));
const right = x + width;
const bottom = y + height;
return [
`M ${x + r} ${y}`,
`H ${right - r}`,
`A ${r} ${r} 0 0 1 ${right} ${y + r}`,
`V ${bottom - r}`,
`A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
`H ${x + r}`,
`A ${r} ${r} 0 0 1 ${x} ${bottom - r}`,
`V ${y + r}`,
`A ${r} ${r} 0 0 1 ${x + r} ${y}`,
`Z`,
].join(" ");
};

const outerPath = `M 0 0 H ${layout.width} V ${layout.height} H 0 Z`;
const innerPath = roundedRectPath(frameLeft, frameTop, frameWidth, frameHeight, safeRadius);
const path = `${outerPath} ${innerPath}`;

return (
<Svg width={layout.width} height={layout.height}>
<Path d={path} fill="black" fillRule="evenodd" />
</Svg>
);
})()}
>
<BlurView intensity={46} tint="default" style={{ flex: 1 }} />
</MaskedView>
) : (
/* Fallback blur before we know exact layout dimensions. */
<Box pointerEvents="none" position="absolute" top={0} left={0} right={0} bottom={0}>
<BlurView intensity={46} tint="default" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "12%" }} />
<BlurView intensity={46} tint="default" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "16%" }} />
<BlurView intensity={46} tint="default" style={{ position: "absolute", top: "12%", bottom: "16%", left: 0, width: "10.5%" }} />
<BlurView intensity={46} tint="default" style={{ position: "absolute", top: "12%", bottom: "16%", right: 0, width: "10.5%" }} />
</Box>
)}

<LinearGradient
colors={["rgba(8, 12, 24, 0.28)", "rgba(8, 12, 24, 0.06)", "rgba(8, 12, 24, 0.00)"]}
start={{ x: 0.5, y: 0 }}
end={{ x: 0.5, y: 1 }}
style={{ position: "absolute", top: 0, left: 0, right: 0, height: 196 }}
/>

<LinearGradient
colors={["rgba(8, 12, 24, 0.00)", "rgba(8, 12, 24, 0.08)", "rgba(8, 12, 24, 0.34)"]}
start={{ x: 0.5, y: 0 }}
end={{ x: 0.5, y: 1 }}
style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260 }}
/>

<Box
position="absolute"
top="12%"
left="10.5%"
right="10.5%"
bottom="16%"
borderRadius={34}
borderWidth={1}
borderColor={isFramingReady ? "rgba(34,197,94,0.40)" : "rgba(255,255,255,0.08)"}
/>

{/* Corner markers communicate where to place the product label for detection. */}
<Box position="absolute" top="12%" left="10.5%" right="10.5%" bottom="16%" borderRadius={34}>
<Box position="absolute" top={10} left={10} w={34} h={34} borderTopWidth={3} borderLeftWidth={3} borderColor={isFramingReady ? "rgba(34,197,94,0.95)" : "rgba(255,255,255,0.76)"} borderTopLeftRadius={18} />
<Box position="absolute" top={10} right={10} w={34} h={34} borderTopWidth={3} borderRightWidth={3} borderColor={isFramingReady ? "rgba(34,197,94,0.95)" : "rgba(255,255,255,0.76)"} borderTopRightRadius={18} />
<Box position="absolute" bottom={10} left={10} w={34} h={34} borderBottomWidth={3} borderLeftWidth={3} borderColor={isFramingReady ? "rgba(34,197,94,0.95)" : "rgba(255,255,255,0.76)"} borderBottomLeftRadius={18} />
<Box position="absolute" bottom={10} right={10} w={34} h={34} borderBottomWidth={3} borderRightWidth={3} borderColor={isFramingReady ? "rgba(34,197,94,0.95)" : "rgba(255,255,255,0.76)"} borderBottomRightRadius={18} />
</Box>

<Box position="absolute" left={0} right={0} bottom={16} px="$5">
<Box alignItems="center" mb="$5">
<Box
px="$3"
py="$2"
borderRadius="$full"
bg={isFramingReady ? "rgba(255,255,255,0.18)" : "rgba(14,24,34,0.34)"}
borderWidth={1}
borderColor="rgba(255,255,255,0.18)"
>
<Text fontSize={13} lineHeight={17} color="#FFFFFF" fontFamily="RobotoMedium">
{isFramingReady ? "Ready to scan" : "Align product in frame"}
</Text>
</Box>
</Box>

<Box
flexDirection="row"
alignItems="flex-end"
justifyContent="space-between"
px="$1"
>
{/* Back, shutter, and torch controls keep the detection flow in one place. */}
<Pressable
onPress={() => {
navigation.goBack();
}}
width={56}
height={56}
borderRadius={28}
bg="rgba(255,255,255,0.92)"
alignItems="center"
justifyContent="center"
>
<Feather name="arrow-left" size={22} color="#374151" />
</Pressable>

<Pressable
onPress={() => {
void capturePhoto();
}}
disabled={isCapturingPhoto || isResolvingProduct || isProcessingEvaluation}
width={86}
height={86}
borderRadius={43}
borderWidth={4}
borderColor="rgba(255,255,255,0.95)"
bg="rgba(255,255,255,0.14)"
alignItems="center"
justifyContent="center"
>
<Box
width={64}
height={64}
borderRadius={32}
bg={isCapturingPhoto || isResolvingProduct ? "#D5DAE2" : "#FFFFFF"}
/>
</Pressable>

<Pressable
onPress={() => {
setIsTorchEnabled((currentValue) => !currentValue);
}}
width={56}
height={56}
borderRadius={28}
bg="rgba(255,255,255,0.92)"
alignItems="center"
justifyContent="center"
>
<Feather name={isTorchEnabled ? "sun" : "sunrise"} size={20} color="#374151" />
</Pressable>
</Box>

<Pressable
onPress={() => {
void openGallery();
}}
alignSelf="center"
mt="$4"
px="$4"
py="$2"
borderRadius="$full"
bg="rgba(255,255,255,0.14)"
borderWidth={1}
borderColor="rgba(255,255,255,0.18)"
>
<Text color="#FFFFFF" fontSize={13} lineHeight={16} fontFamily="RobotoMedium">
Upload from gallery
</Text>
</Pressable>
</Box>
</Box>
);
}
