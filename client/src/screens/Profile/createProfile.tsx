import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import * as ImagePicker from "expo-image-picker";
import type { MediaType } from "expo-image-picker";
import { Asset } from "expo-asset";
import {
	NavigationProp,
	RouteProp,
	useNavigation,
	useRoute,
} from "@react-navigation/native";
import {
	Box,
	HStack,
	ScrollView,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import { createProfileSchema } from "../../models/profile.schema";
import { useProfile } from "../../hooks/profile.hook";
import { AuthStackParamList } from "../../types/navigation";
import ProfileConditions from "../../components/conditions/profileConditions";
import ProfileAllergens from "../../components/allergens/ProfileAllergens";
import ProfilePreference from "../../components/preferences/ProfilePreference";
import CreateButton from "../../components/Buttons/CreateButton";
import {
	ProfileImageUploadFile,
	setPendingProfileBanner,
} from "../../services/profileService";
import NavBarTop from "../../components/general/NavBarTop";
import ProfileNameAgeSection from "../../components/profile/ProfileNameAgeSection";
import ProfileImageSection from "../../components/profile/ProfileImageSection";
import AvatarPickerModal, { AvatarOption } from "../../components/profile/AvatarPickerModal";

const AVATAR_OPTIONS: AvatarOption[] = [
	{ id: "avatar-base", source: require("../../../assets/avatars/avatar.png") },
	{ id: "avatar-girl", source: require("../../../assets/avatars/girl.png") },
	{ id: "avatar-muslim", source: require("../../../assets/avatars/muslim.png") },
	{ id: "avatar-teacher", source: require("../../../assets/avatars/teacher.png") },
	{ id: "avatar-tourist", source: require("../../../assets/avatars/tourist.png") },
	{ id: "avatar-woman", source: require("../../../assets/avatars/woman.png") },
	{ id: "avatar-1", source: require("../../../assets/avatars/avatar (1).png") },
	{ id: "avatar-15", source: require("../../../assets/avatars/avatar (1.5).png") },
	{ id: "avatar-2", source: require("../../../assets/avatars/avatar (2).png") },
	{ id: "avatar-3", source: require("../../../assets/avatars/avatar (3).png") },
	{ id: "avatar-4", source: require("../../../assets/avatars/avatar (4).png") },
	{ id: "avatar-5", source: require("../../../assets/avatars/avatar (5).png") },
	{ id: "avatar-6", source: require("../../../assets/avatars/avatar (6).png") },
	{ id: "avatar-7", source: require("../../../assets/avatars/avatar (7).png") },
	{ id: "avatar-8", source: require("../../../assets/avatars/avatar (8).png") },
];
// CreateProfile component is responsible for guiding the user through the process of creating or completing a profile, which includes entering basic details, selecting skin conditions, allergens, cosmetic preferences, and optionally adding a profile image. The component manages multiple steps of the profile creation process, handles form validation, interacts with the profile hook for data fetching and submission, and provides a user-friendly interface with navigation and feedback.
export default function CreateProfile() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
	const route = useRoute<RouteProp<AuthStackParamList, "ProfileScreen">>();
	const prefilledFirstName = route.params?.firstName?.trim() ?? "";
	const prefilledLastName = route.params?.lastName?.trim() ?? "";
	const profileId = route.params?.profileId;
	const [step, setStep] = useState(0);
	const [hasLoadedOptions, setHasLoadedOptions] = useState(false);

	const [firstName, setFirstName] = useState(prefilledFirstName);
	const [lastName, setLastName] = useState(prefilledLastName);
	const [age, setAge] = useState("");
	const [profileImage, setProfileImage] = useState<ProfileImageUploadFile | undefined>(undefined);
	const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
	const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
	const [conditionIds, setConditionIds] = useState<string[]>([]);
	const [allergenIds, setAllergenIds] = useState<string[]>([]);
	const [preferenceIds, setPreferenceIds] = useState<string[]>([]);

	const {
		conditions,
		allergens,
		preferences,
		fetchProfileOptions,
		createProfile,
		updateProfile,
		loading,
		error,
		clearError,
	} = useProfile();

	useEffect(() => {
		// Load conditions/allergens/preferences only when reaching selection steps.
		if (step >= 2 && !hasLoadedOptions) {
			setHasLoadedOptions(true);
			fetchProfileOptions();
		}
	}, [step, hasLoadedOptions, fetchProfileOptions]);

	useEffect(() => {
		if (error) {
			Alert.alert("Profile Error", error);
			clearError();
		}
	}, [error, clearError]);

	const stepTitle = useMemo(() => {
		if (step === 0) return "Complete this profile";
		if (step === 1) return "Basic details";
		if (step === 2) return "Skin Conditions";
		if (step === 3) return "Allergens";
		if (step === 4) return "Cosmetic Preferences";
		return "Profile photo";
	}, [step]);

	const stepDescription = useMemo(() => {
		if (step === 0) {
			return "This information helps personalize product insights, ingredient safety, and recommendations.";
		}
		if (step === 1) {
			return "Add a name and optional age so this profile is complete and easier to manage.";
		}
		if (step === 2) {
			return "Select any skin conditions for this profile so product compatibility can be evaluated more accurately.";
		}
		if (step === 3) {
			return "Choose known allergens to help flag ingredients that may not be suitable for this profile.";
		}
		if (step === 4) {
			return "Add cosmetic preferences to improve relevance and recommendation quality.";
		}
		return "Add an optional profile photo to make this profile easier to recognize.";
	}, [step]);

	const handleNext = () => {
		if (step === 1 && !firstName.trim()) {
			Alert.alert("Missing info", "Please enter first name.");
			return;
		}

		setStep((prev) => Math.min(prev + 1, 5));
	};

	const handleBack = () => {
		setStep((prev) => Math.max(prev - 1, 0));
	};

	const handleSubmitProfile = async () => {
		// Shared payload used for either updating the initial profile or creating an additional one.
		const payload = {
			first_name: firstName.trim(),
			last_name: lastName.trim() ? lastName.trim() : undefined,
			age: age.trim() ? age.trim() : undefined,
			profile_image: profileImage,
			...(profileId ? {} : { main_profile: true }),
			conditionIds,
			allergenIds,
			preferenceIds,
		};

		const result = createProfileSchema.safeParse(payload);
		if (!result.success) {
			Alert.alert(
				"Validation Error",
				result.error.issues.map((issue) => issue.message).join("\n"),
			);
			return;
		}

		const completionPayload = {
			first_name: payload.first_name,
			last_name: payload.last_name,
			age: payload.age,
			conditionIds: payload.conditionIds,
			allergenIds: payload.allergenIds,
			preferenceIds: payload.preferenceIds,
			isComplete: true,
			main_profile: true,
		};

		// If a profileId exists, complete that profile; otherwise create a new profile for the logged-in user.
		const savedProfile = profileId
			? await updateProfile(profileId, completionPayload)
			: await createProfile(payload);

		if (!savedProfile) {
			return;
		}

		if (!profileId) {
			// Newly created additional profiles should be marked complete but not as main profile.
			const completedAdditionalProfile = await updateProfile(savedProfile.id, {
				first_name: payload.first_name,
				...(payload.last_name !== undefined
					? { last_name: payload.last_name }
					: {}),
				...(payload.age !== undefined ? { age: payload.age } : {}),
				main_profile: true,
				isComplete: true,
			});

			if (!completedAdditionalProfile) {
				return;
			}
		}

		if (profileImage) {
			// New profiles already send the image during createProfile, so only patch
			// the image separately when completing an existing profile.
			if (!profileId) {
				setPendingProfileBanner({
					type: "success",
					message: "Profile created successfully.",
				});
				navigation.navigate("LandingScreen");
				return;
			}

			const savedImage = await updateProfile(profileId, {
				profile_image: profileImage,
			});

			if (!savedImage) {
				return;
			}
		}

		if (savedProfile) {
			setPendingProfileBanner({
				type: "success",
				message: "Profile created successfully.",
			});
			navigation.navigate("LandingScreen");
		}
	};

	const handlePrimarySavePress = () => {
		if (!profileImage) {
			setIsAvatarPickerOpen(true);
			return;
		}

		void handleSubmitProfile();
	};

	const handlePickProfileImage = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert(
				"Permission needed",
				"Please allow photo library access to select a profile image.",
			);
			return;
		}

		const picked = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"] as MediaType[],
			allowsEditing: true,
			quality: 0.8,
		});

		if (picked.canceled || !picked.assets.length) {
			return;
		}

		const asset = picked.assets[0];
		const inferredName = asset.fileName ?? `profile-${Date.now()}.jpg`;
		const inferredType = asset.mimeType ?? "image/jpeg";
		setSelectedAvatarId(null);

		setProfileImage({
			uri: asset.uri,
			name: inferredName,
			type: inferredType,
		});
	};

	const handleChooseAvatar = async (avatar: AvatarOption) => {
		const avatarAsset = Asset.fromModule(avatar.source);
		await avatarAsset.downloadAsync();

		setProfileImage({
			uri: avatarAsset.localUri ?? avatarAsset.uri,
			name: "Selected avatar",
			type: "image/png",
		});
		setSelectedAvatarId(avatar.id);
		setIsAvatarPickerOpen(false);
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: "#F2F8FF" }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: "flex-start",
					paddingHorizontal: 20,
					paddingVertical: 30,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Box
					position="absolute"
					top={-60}
					right={-30}
					w={180}
					h={180}
					borderRadius={999}
					bg="#D8ECFF"
					opacity={0.5}
				/>
				<Box
					position="absolute"
					bottom={-40}
					left={-20}
					w={140}
					h={140}
					borderRadius={999}
					bg="#BFDFFF"
					opacity={0.25}
				/>

				<NavBarTop
					isFirstProfileSetup
					showAvatar={false}
					showDivider
				/>

				<VStack pt="$8" space="lg">
					<VStack>
						<Text
							size="xs"
							color="#64748B"
							style={{ fontFamily: "RobotoMedium", marginBottom: 2 }}
						>
							Step {step + 1} of 6
						</Text>
						<Text
							size="3xl"
							style={{ fontFamily: "Roboto", color: "#1E293B" }}
						>
							{stepTitle}
						</Text>
						<Text size="sm" color="#64748B" style={{ marginTop: 4 }}>
							{stepDescription}
						</Text>
					</VStack>

					{step === 0 ? (
							<VStack  space="xl">
								<CreateButton label="Continue" onPress={handleNext} isPulsing={false} />
								<Box mt="$8">
									<LottieView
										source={require("../../../assets/animations/create.json")}
										autoPlay
										loop
										style={{ width: "100%", height: 300 }}
									/>
								</Box>

							</VStack>
						) : null}

					{step === 1 ? (
							<ProfileNameAgeSection
								firstName={firstName}
								lastName={lastName}
								age={age}
								onFirstNameChange={setFirstName}
								onLastNameChange={setLastName}
								onAgeChange={setAge}
								isDisabled={loading}
							/>
						) : null}

					{step === 2 ? (
							<ProfileConditions
								conditions={conditions}
								selectedConditionIds={conditionIds}
								onChangeSelectedConditionIds={setConditionIds}
								isDisabled={loading}
							/>
						) : null}

					{step === 3 ? (
							<ProfileAllergens
								allergens={allergens}
								selectedAllergenIds={allergenIds}
								onChangeSelectedAllergenIds={setAllergenIds}
								isDisabled={loading}
							/>
						) : null}

					{step === 4 ? (
							<ProfilePreference
								preferences={preferences}
								selectedPreferenceIds={preferenceIds}
								onChangeSelectedPreferenceIds={setPreferenceIds}
								isDisabled={loading}
							/>
						) : null}

					{step === 5 ? (
							<ProfileImageSection
								profileImage={profileImage}
								onPickImage={handlePickProfileImage}
								onPickAvatar={() => {
									setIsAvatarPickerOpen(true);
								}}
								isDisabled={loading}
							/>
						) : null}

					{step > 0 ? (
							<HStack space="md" mt="$2">
								<Box flex={1}>
									<CreateButton
										preset="outline"
										label="Back"
										onPress={handleBack}
										disabled={loading}
										isPulsing={false}
									/>
								</Box>

								<Box flex={1}>
									<CreateButton
										label={loading ? "Saving..." : step === 5 ? "Save Profile" : "Next"}
										onPress={step === 5 ? handlePrimarySavePress : handleNext}
										disabled={loading}
										isPulsing={false}
									/>
								</Box>
							</HStack>
					) : null}
				</VStack>
			</ScrollView>

			<AvatarPickerModal
				isOpen={isAvatarPickerOpen}
				onClose={() => {
					setIsAvatarPickerOpen(false);
				}}
				avatarOptions={AVATAR_OPTIONS}
				selectedAvatarId={selectedAvatarId}
				onSelectAvatar={(avatar) => {
					void handleChooseAvatar(avatar);
				}}
				onContinueWithoutImage={() => {
					setIsAvatarPickerOpen(false);
					void handleSubmitProfile();
				}}
				loading={loading}
			/>
		</KeyboardAvoidingView>
	);
}
