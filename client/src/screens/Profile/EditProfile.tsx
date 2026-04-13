import React from "react";
import {
	NavigationProp,
	useNavigation,
} from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import {
	Box,
	Pressable,
	ScrollView,
	Text,
} from "@gluestack-ui/themed";
import BackButton from "../../components/Buttons/BackButton";
import { AuthStackParamList } from "../../types/navigation";

type EditSectionItem = {
	id: string;
	title: string;
	description: string;
};

const editSections: EditSectionItem[] = [
	{
		id: "image",
		title: "Edit Image",
		description: "Update profile photo",
	},
	{
		id: "name",
		title: "Edit Name",
		description: "Change first and last name",
	},
	{
		id: "details",
		title: "Edit Details",
		description: "Update age and profile basics",
	},
	{
		id: "conditions",
		title: "Edit Conditions",
		description: "Manage linked skin conditions",
	},
	{
		id: "allergens",
		title: "Edit Allergens",
		description: "Manage allergen selections",
	},
	{
		id: "preferences",
		title: "Edit Preferences",
		description: "Manage cosmetic preferences",
	},
];

export default function EditProfileScreen() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

	return (
		<Box flex={1} bg="#F2F8FF">
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

			<ScrollView
				contentContainerStyle={{
					paddingHorizontal: 18,
					paddingTop: 28,
					paddingBottom: 190,
				}}
				showsVerticalScrollIndicator={false}
			>
				<Box style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
					<BackButton />
					<Text fontSize={30} lineHeight={32} color="#111827" fontFamily="RobotoMedium">
						Edit Profile
					</Text>
					<Box style={{ width: 24 }} />
				</Box>

				<Text mb="$3" fontSize={13} lineHeight={16} color="#667085" fontFamily="Roboto">
					Choose what you want to edit.
				</Text>

				<Box
					style={{
						borderRadius: 18,
						backgroundColor: "#FFFFFF",
						paddingHorizontal: 10,
						paddingVertical: 6,
						borderWidth: 1,
						borderColor: "#DFE7EF",
					}}
				>
					{editSections.map((item, index) => (
						<Pressable
							key={item.id}
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: 8,
								paddingVertical: 14,
								borderBottomWidth: index === editSections.length - 1 ? 0 : 1,
								borderBottomColor: "#EEF2F6",
							}}
							onPress={() => {
								// Navigation targets can be connected as edit subsections are created.
							}}
						>
							<Box>
								<Text fontSize={19} lineHeight={22} color="#111827" fontFamily="RobotoMedium">
									{item.title}
								</Text>
								<Text mt="$0.5" fontSize={12} lineHeight={15} color="#667085" fontFamily="Roboto">
									{item.description}
								</Text>
							</Box>
							<Feather name="chevron-right" size={22} color="#7B8794" />
						</Pressable>
					))}
				</Box>
			</ScrollView>

			{/* Full-width bottom banners for account-level actions */}
			<Box position="absolute" left={0} right={0} bottom={0}>
				<Pressable
					onPress={() => {
						// Remove-profile flow can be connected to confirmation modal.
					}}
					style={{
						height: 58,
						backgroundColor: "#D64545",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text fontSize={17} lineHeight={19} color="#FFFFFF" fontFamily="RobotoMedium">
						Remove Profile
					</Text>
				</Pressable>

				<Pressable
					onPress={() => {
						navigation.navigate("LandingScreen");
					}}
					style={{
						height: 58,
						backgroundColor: "#5BAEDB",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text fontSize={17} lineHeight={19} color="#FFFFFF" fontFamily="RobotoMedium">
						User Account Settings
					</Text>
				</Pressable>
			</Box>
		</Box>
	);
}
