import React from "react";
import { Image, StyleSheet } from "react-native";
import { Box, Text, VStack } from "@gluestack-ui/themed";
import CreateButton from "../Buttons/CreateButton";
import { ProfileImageUploadFile } from "../../services/profileService";

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
