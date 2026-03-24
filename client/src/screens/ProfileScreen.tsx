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
	Button,
	ButtonText,
	Divider,
	HStack,
	Input,
	InputField,
	Pressable,
	ScrollView,
	Spinner,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import { createProfileSchema } from "../models/profile.schema";
import { useProfile } from "../hooks/profile.hook";
import { AuthStackParamList } from "../types/navigation";
import SocialAuth from "../components/actions/SocialAuth";
import { ProfileImageUploadFile } from "../services/profileService";

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
		if (step === 2) return "Health conditions";
		if (step === 3) return "Allergens";
		if (step === 4) return "Food preferences";
		return "Profile photo";
	}, [step]);

	const toggleId = (
		value: string,
		current: string[],
		setter: React.Dispatch<React.SetStateAction<string[]>>,
	) => {
		setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
	};

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
					onPress: () => navigation.navigate("AnalyseScreen"),
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
				<Box w="$full" px="$5" py="$8" bg="$backgroundLight0">
					<VStack space="xl">
						<VStack space="xs">
							<HStack justifyContent="space-between" alignItems="center">
								<Text pl="$2" size="6xl" style={{ fontFamily: "DancingScript" }}>
									Lumière
								</Text>

								<Box w="$8" h="$8" alignItems="center" justifyContent="center" mt="$4">
									<AntDesign name="info-circle" size={28} color="gray" />
								</Box>
							</HStack>
							<Divider mt={-8} />
						</VStack>

						<VStack>
							<Text size="3xl" style={{ fontFamily: "Roboto" }}>
								{stepTitle}
							</Text>
							<Text size="sm" color="$textLight500">
								Step {step + 1} of 6
							</Text>
						</VStack>

						{step === 0 ? (
							<VStack space="xl">
								<Text size="sm" color="$textLight500">
									Let’s finish your profile so we can personalize your experience.
								</Text>

								<Button
									size="lg"
									onPress={handleNext}
									bg="$black"
									borderRadius="$lg"
									w="$full"
								>
									<ButtonText color="$white">Continue</ButtonText>
								</Button>

								<SocialAuth />
							</VStack>
						) : null}

						{step === 1 ? (
							<VStack space="xl">
								<VStack space="xs">
									<Text style={{ fontFamily: "RobotoMedium" }}>First Name</Text>
									<Input size="lg" borderRadius="$lg">
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
									<Input size="lg" borderRadius="$lg">
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
									<Input size="lg" borderRadius="$lg">
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
							<VStack space="md">
								<Text style={{ fontFamily: "RobotoMedium" }}>Select conditions (optional)</Text>
								<HStack flexWrap="wrap" space="sm">
									{conditions.map((item) => {
										const selected = conditionIds.includes(item.id);
										return (
											<Pressable
												key={item.id}
												onPress={() => toggleId(item.id, conditionIds, setConditionIds)}
												borderWidth={1}
												borderColor={selected ? "$black" : "$borderLight300"}
												bg={selected ? "$black" : "transparent"}
												borderRadius="$full"
												px="$3"
												py="$2"
											>
												<Text color={selected ? "$white" : "$textLight700"}>{item.name}</Text>
											</Pressable>
										);
									})}
								</HStack>
							</VStack>
						) : null}

						{step === 3 ? (
							<VStack space="md">
								<Text style={{ fontFamily: "RobotoMedium" }}>Select allergens (optional)</Text>
								<HStack flexWrap="wrap" space="sm">
									{allergens.map((item) => {
										const selected = allergenIds.includes(item.id);
										return (
											<Pressable
												key={item.id}
												onPress={() => toggleId(item.id, allergenIds, setAllergenIds)}
												borderWidth={1}
												borderColor={selected ? "$black" : "$borderLight300"}
												bg={selected ? "$black" : "transparent"}
												borderRadius="$full"
												px="$3"
												py="$2"
											>
												<Text color={selected ? "$white" : "$textLight700"}>{item.name}</Text>
											</Pressable>
										);
									})}
								</HStack>
							</VStack>
						) : null}

						{step === 4 ? (
							<VStack space="md">
								<Text style={{ fontFamily: "RobotoMedium" }}>Select preferences (optional)</Text>
								<HStack flexWrap="wrap" space="sm">
									{preferences.map((item) => {
										const selected = preferenceIds.includes(item.id);
										return (
											<Pressable
												key={item.id}
												onPress={() => toggleId(item.id, preferenceIds, setPreferenceIds)}
												borderWidth={1}
												borderColor={selected ? "$black" : "$borderLight300"}
												bg={selected ? "$black" : "transparent"}
												borderRadius="$full"
												px="$3"
												py="$2"
											>
												<Text color={selected ? "$white" : "$textLight700"}>{item.name}</Text>
											</Pressable>
										);
									})}
								</HStack>
							</VStack>
						) : null}

						{step === 5 ? (
							<VStack space="md">
								<Text style={{ fontFamily: "RobotoMedium" }}>
									Choose your profile photo (optional)
								</Text>
								<Text size="sm" color="$textLight500">
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

									<Text size="sm" color="$textLight500">
										{profileImage ? profileImage.name ?? "Selected image" : "No image selected yet"}
									</Text>
								</VStack>

								<Button
									size="md"
									variant="outline"
									onPress={handlePickProfileImage}
									isDisabled={loading}
									borderRadius="$lg"
								>
									<ButtonText>
										{profileImage ? "Change Photo" : "Choose from Photos"}
									</ButtonText>
								</Button>
							</VStack>
						) : null}

						<HStack space="md" mt="$2">
							{step > 0 ? (
								<Button
									flex={1}
									variant="outline"
									borderRadius="$lg"
									onPress={handleBack}
									isDisabled={loading}
								>
									<ButtonText>Back</ButtonText>
								</Button>
							) : null}

							<Button
								flex={1}
								size="lg"
								onPress={step === 5 ? handleSubmitProfile : handleNext}
								isDisabled={loading}
								bg="$black"
								borderRadius="$lg"
							>
								{loading ? (
									<Spinner color="$white" />
								) : (
									<ButtonText color="$white">
										{step === 5 ? "Save Profile" : "Next"}
									</ButtonText>
								)}
							</Button>
						</HStack>
					</VStack>
				</Box>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	scrollContent: {
		flexGrow: 1,
		backgroundColor: "#ffffff",
	},
	profilePreview: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: "#f3f4f6",
	},
});
