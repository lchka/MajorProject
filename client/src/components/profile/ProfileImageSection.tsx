import React from "react";
import { Image, StyleSheet } from "react-native";
import { Box, Text, VStack } from "@gluestack-ui/themed";
import CreateButton from "../Buttons/CreateButton";
import { ProfileImageUploadFile } from "../../services/profileService";
// Component for managing the profile image selection process in a user profile setup or edit screen. The component displays the current profile image if one is selected, along with options to choose a new image from the user's photo library or select from a set of predefined avatars. It accepts props for the current profile image, callback functions for handling image selection and avatar selection, and a disabled state to prevent interactions when necessary. The component provides a user-friendly interface for customizing the user's profile with an image, including visual feedback on the selected image and clear calls to action for changing or selecting an avatar.
type ProfileImageSectionProps = {
	profileImage?: ProfileImageUploadFile;
	onPickImage: () => void;
	onPickAvatar?: () => void;
	isDisabled?: boolean;
};

export default function ProfileImageSection({
	profileImage,
	onPickImage,
	onPickAvatar,
	isDisabled = false,
}: ProfileImageSectionProps) {
	return (
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
 {/* The "Choose from Photos" button allows users to select an image from their device's photo library, while the optional "Choose from Avatars" button provides an alternative for users who prefer to select from a set of predefined avatar images. Both buttons are disabled when the isDisabled prop is true, preventing user interaction during loading states or when certain conditions are not met. */}
			<CreateButton
				preset="outline"
				label={profileImage ? "Change Photo" : "Choose from Photos"}
				onPress={onPickImage}
				disabled={isDisabled}
				isPulsing={false}
			/>

			{onPickAvatar ? (
				<CreateButton
					preset="outline"
					label="Choose from Avatars"
					onPress={onPickAvatar}
					disabled={isDisabled}
					isPulsing={false}
				/>
			) : null}
		</VStack>
	);
}

const styles = StyleSheet.create({
	profilePreview: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: "#E6F2FF",
	},
});
