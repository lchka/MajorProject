import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
	NavigationProp,
	RouteProp,
	useNavigation,
	useRoute,
} from "@react-navigation/native";
import {
	Box,
	HStack,
	Input,
	InputField,
	Pressable,
	ScrollView,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import { createProfileSchema } from "../../models/profile.schema";
import { useProfile } from "../../hooks/profile.hook";
import { AuthStackParamList } from "../../types/navigation";
import ProfileConditions from "../../components/conditions/ProfileConditions";
import ProfileAllergens from "../../components/allergens/ProfileAllergens";
import ProfilePreference from "../../components/preferences/ProfilePreference";
import CreateButton from "../../components/Buttons/CreateButton";
import { ProfileImageUploadFile } from "../../services/profileService";

export default function ProfileScreen() {
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
	const [conditionIds, setConditionIds] = useState<string[]>([]);
	const [allergenIds, setAllergenIds] = useState<string[]>([]);
	const [preferenceIds, setPreferenceIds] = useState<string[]>([]);

	const {
		conditions,
		allergens,
		preferences,
		fetchProfileOptions,
		updateProfile,
		loading,
		error,
		clearError,
	} = useProfile();

	useEffect(() => {
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
		if (step === 0) return "Complete your profile";
		if (step === 1) return "Your basic details";
		if (step === 2) return "Skin Conditions";
		if (step === 3) return "Allergens";
		if (step === 4) return "Cosmetic Preferences";
		return "Profile photo";
	}, [step]);

	const handleNext = () => {
		if (step === 1 && (!firstName.trim() || !lastName.trim())) {
			Alert.alert("Missing info", "Please enter first and last name.");
			return;
		}

		setStep((prev) => Math.min(prev + 1, 5));
	};

	const handleBack = () => {
		setStep((prev) => Math.max(prev - 1, 0));
	};

	const handleSubmitProfile = async () => {
		const payload = {
			first_name: firstName.trim(),
			last_name: lastName.trim(),
			age: age.trim() ? age.trim() : undefined,
			profile_image: profileImage,
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

		if (!profileId) {
			Alert.alert("Profile Error", "Missing profile id. Please sign in again.");
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

		const savedProfile = await updateProfile(profileId, completionPayload);

		if (!savedProfile) {
			return;
		}

		if (profileImage) {
			const savedImage = await updateProfile(profileId, {
				profile_image: profileImage,
			});

			if (!savedImage) {
				return;
			}
		}

		if (savedProfile) {
			Alert.alert("Success", "Profile completed successfully.", [
				{
					text: "Continue",
					onPress: () => navigation.navigate("LandingScreen"),
				},
			]);
		}
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
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			quality: 0.8,
		});

		if (picked.canceled || !picked.assets.length) {
			return;
		}

		const asset = picked.assets[0];
		const inferredName = asset.fileName ?? `profile-${Date.now()}.jpg`;
		const inferredType = asset.mimeType ?? "image/jpeg";

		setProfileImage({
			uri: asset.uri,
			name: inferredName,
			type: inferredType,
		});
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<Box w="$full" bg="#F2F8FF">
					<Box
						position="absolute"
						top={-90}
						right={-45}
						w={220}
						h={220}
						borderRadius={999}
						bg="#D8ECFF"
						opacity={0.9}
					/>

					<Box w="$full" px="$5" py="$2">
						<VStack space="xl">
						<VStack space="xs">
							<Text
								pl="$2"
								size="6xl"
								style={{ fontFamily: "DancingScript", color: "#204C78" }}
							>
								Lumière
							</Text>
						</VStack>

						<VStack>
							<Text size="xs" color="#7A8EA8" style={{ fontFamily: "RobotoMedium", marginBottom: 2 }}>
								Step {step + 1} of 6
							</Text>
							<Text size="3xl" style={{ fontFamily: "Roboto", color: "#261A10" }}>
								{stepTitle}
							</Text>
						</VStack>

						{step === 0 ? (
							<VStack space="xl">
								<Text size="sm" color="#466785">
									Let’s finish your profile so we can personalize your experience.
								</Text>
								<CreateButton label="Continue" onPress={handleNext} isPulsing={false} />

							</VStack>
						) : null}

						{step === 1 ? (
							<VStack space="xl">
								<VStack space="xs">
									<Text style={{ fontFamily: "RobotoMedium" }}>First Name</Text>
									<Input size="lg" borderRadius="$full">
										<InputField
											placeholder="Enter first name"
											value={firstName}
											onChangeText={setFirstName}
											autoCapitalize="words"
											editable={!loading}
										/>
									</Input>
								</VStack>

								<VStack space="xs">
									<Text style={{ fontFamily: "RobotoMedium" }}>Last Name</Text>
									<Input size="lg" borderRadius="$full">
										<InputField
											placeholder="Enter last name"
											value={lastName}
											onChangeText={setLastName}
											autoCapitalize="words"
											editable={!loading}
										/>
									</Input>
								</VStack>

								<VStack space="xs">
									<Text style={{ fontFamily: "RobotoMedium" }}>Age (optional)</Text>
									<Input size="lg" borderRadius="$full">
										<InputField
											placeholder="Enter age"
											value={age}
											onChangeText={setAge}
											keyboardType="number-pad"
											editable={!loading}
										/>
									</Input>
								</VStack>
							</VStack>
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
							<VStack space="md">
								<Text style={{ fontFamily: "RobotoMedium" }}>
									Choose your profile photo (optional)
								</Text>
								<Text size="sm" color="#466785">
									This is what your image will look like.
								</Text>

								<VStack space="xs" alignItems="center">
									{profileImage ? (
										<Image
											source={{ uri: profileImage.uri }}
											style={styles.profilePreview}
										/>
									) : (
										<Box style={styles.profilePreview} />
									)}

									<Text size="sm" color="#466785">
										{profileImage ? profileImage.name ?? "Selected image" : "No image selected yet"}
									</Text>
								</VStack>

								<CreateButton
									preset="outline"
									label={profileImage ? "Change Photo" : "Choose from Photos"}
									onPress={handlePickProfileImage}
									disabled={loading}
									isPulsing={false}
								/>
							</VStack>
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
										onPress={step === 5 ? handleSubmitProfile : handleNext}
										disabled={loading}
										isPulsing={false}
									/>
								</Box>
							</HStack>
						) : null}
					</VStack>
					</Box>
				</Box>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F2F8FF",
	},
	scrollContent: {
		flexGrow: 1,
		backgroundColor: "#F2F8FF",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 14,
	},
	profilePreview: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: "#E6F2FF",
	},
});
