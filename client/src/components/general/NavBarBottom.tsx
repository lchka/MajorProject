import React from "react";
import type { ImageSourcePropType } from "react-native";
import { MotiView } from "moti";
import { CommonActions, NavigationProp, useNavigation } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Box, Image, Pressable, Text } from "@gluestack-ui/themed";
import ScanButton from "../Buttons/ScanButton";
import { styles } from "../../style/LandingPageStyle";
import { AuthStackParamList } from "../../types/navigation";

type BottomTab = "home" | "upload" | "history" | "profile";

type NavBarBottomProps = {
	homeIconColor?: string;
	avatarSource?: ImageSourcePropType;
	activeTab?: BottomTab;
	onPressHome?: () => void;
	onPressUpload?: () => void;
	onPressHistory?: () => void;
	onPressMore?: () => void;
	onPressProfile?: () => void;
};

export default function NavBarBottom({
	homeIconColor = "#66707A",
	avatarSource = require("../../../assets/icon.png"),
	activeTab = "home",
	onPressHome,
	onPressUpload,
	onPressHistory,
	onPressProfile,
}: NavBarBottomProps) {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

	const handleHomePress = React.useCallback(() => {
		if (onPressHome) {
			onPressHome();
			return;
		}

		navigation.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [{ name: "LandingScreen" }],
			}),
		);
	}, [navigation, onPressHome]);

	const handleUploadPress = React.useCallback(() => {
		if (onPressUpload) {
			onPressUpload();
			return;
		}

		navigation.navigate("CameraScreen");
	}, [navigation, onPressUpload]);

	const handleHistoryPress = React.useCallback(() => {
		if (onPressHistory) {
			onPressHistory();
			return;
		}

		navigation.navigate("HistoryScreen");
	}, [navigation, onPressHistory]);

	const handleProfilePress = React.useCallback(() => {
		if (onPressProfile) {
			onPressProfile();
			return;
		}

		navigation.navigate("EditProfileScreen", {});
	}, [navigation, onPressProfile]);

	return (
		<Box style={styles.bottomNav}>
			<BottomIcon
				label="HOME"
				isActive={activeTab === "home"}
				onPress={handleHomePress}
				icon={
					<Feather
						name="home"
						size={32}
						color={activeTab === "home" ? "#374151" : homeIconColor}
					/>
				}
			/>
			<BottomIcon
				label="UPLOAD"
				isActive={activeTab === "upload"}
				onPress={handleUploadPress}
				icon={<Feather name="upload-cloud" size={32} color="#66707A" />}
			/>
			<ScanButton onPress={handleUploadPress} />
			<BottomIcon
				label="MY HISTORY"
				isActive={activeTab === "history"}
				onPress={handleHistoryPress}
				icon={<Ionicons name="bookmark-outline" size={32} color="#66707A" />}
			/>
			<BottomIcon
				label="PROFILE"
				isActive={activeTab === "profile"}
				onPress={handleProfilePress}
				icon={
					<Image
						source={avatarSource}
						style={{ width: 32, height: 32, borderRadius: 20, opacity: 0.95 }}
						resizeMode="cover"
						alt="Profile avatar"
					/>
				}
			/>
		</Box>
	);
}

function BottomIcon({
	label,
	icon,
	isActive = false,
	onPress,
}: {
	label: string;
	icon: React.ReactNode;
	isActive?: boolean;
	onPress?: () => void;
}) {
	return (
		<Pressable style={styles.bottomItem} onPress={onPress} hitSlop={10}>
			<Box style={{ alignItems: "center" }}>
				{icon}
				{isActive ? (
					<MotiView
						from={{ width: 0, opacity: 0 }}
						animate={{ width: 18, opacity: 1 }}
						transition={{ type: "timing", duration: 220 }}
						style={{
							height: 2,
							borderRadius: 999,
							backgroundColor: "#4B9CE2",
							marginTop: 4,
						}}
					/>
				) : (
					<Box style={{ height: 2, marginTop: 4 }} />
				)}
			</Box>
			<Text fontSize={12} fontFamily="RobotoMedium" color="#66707A">
				{label}
			</Text>
		</Pressable>
	);
}
