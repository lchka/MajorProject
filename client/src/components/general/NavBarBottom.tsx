import React from "react";
import type { ImageSourcePropType } from "react-native";
import { MotiView } from "moti";
import { NavigationProp, StackActions, useNavigation } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Box, Image, Pressable, Text } from "@gluestack-ui/themed";
import ScanButton from "../Buttons/ScanButton";
import { styles } from "../../style/LandingPageStyle";
import { AuthStackParamList } from "../../types/navigation";

/**
 * Defines the available tabs in the bottom navigation
 */
type BottomTab = "home" | "upload" | "history" | "profile";

/**
 * Props for NavBarBottom component
 * Allows external control of navigation + active state
 */
type NavBarBottomProps = {
	homeIconColor?: string;
	avatarSource?: ImageSourcePropType;
	activeTab?: BottomTab;

	// Optional profile IDs for contextual navigation
	historyProfileId?: string;
	cameraProfileId?: string;

	// Optional override handlers (useful for custom behaviour)
	onPressHome?: () => void;
	onPressUpload?: () => void;
	onPressHistory?: () => void;
	onPressMore?: () => void;
	onPressProfile?: () => void;
};

/**
 * Bottom navigation bar component
 * Handles navigation between main app screens
 */
export default function NavBarBottom({
	homeIconColor = "#66707A",
	avatarSource = require("../../../assets/icon.png"),
	activeTab = "home",
	historyProfileId,
	cameraProfileId,
	onPressHome,
	onPressUpload,
	onPressHistory,
	onPressProfile,
}: NavBarBottomProps) {
	// React Navigation hook for screen navigation
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

	/**
	 * Navigate to home screen
	 * - Uses override if provided
	 * - Otherwise pops to root if possible
	 * - Falls back to LandingScreen
	 */
	const handleHomePress = React.useCallback(() => {
		if (onPressHome) {
			onPressHome();
			return;
		}

		if (navigation.canGoBack()) {
			navigation.dispatch(StackActions.popToTop());
			return;
		}

		navigation.navigate("LandingScreen");
	}, [navigation, onPressHome]);

	/**
	 * Navigate to camera/upload screen
	 * Passes profileId if available
	 */
	const handleUploadPress = React.useCallback(() => {
		if (onPressUpload) {
			onPressUpload();
			return;
		}

		navigation.navigate(
			"CameraScreen",
			cameraProfileId ? { profileId: cameraProfileId } : undefined,
		);
	}, [cameraProfileId, navigation, onPressUpload]);

	/**
	 * Navigate to history screen
	 * Passes profileId for filtering history
	 */
	const handleHistoryPress = React.useCallback(() => {
		if (onPressHistory) {
			onPressHistory();
			return;
		}

		navigation.navigate(
			"HistoryScreen",
			historyProfileId ? { profileId: historyProfileId } : undefined,
		);
	}, [navigation, onPressHistory, historyProfileId]);

	/**
	 * Navigate to profile edit screen
	 */
	const handleProfilePress = React.useCallback(() => {
		if (onPressProfile) {
			onPressProfile();
			return;
		}

		navigation.navigate("EditProfileScreen", {});
	}, [navigation, onPressProfile]);

	return (
		// Outer container for bottom navigation
		<Box style={styles.bottomNav}>
			{/* Inner layout rail for icons */}
			<Box style={styles.bottomNavRail}>
				
				{/* HOME TAB */}
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

				{/* GALLERY / UPLOAD TAB */}
				<BottomIcon
					label="GALLERY"
					isActive={activeTab === "upload"}
					onPress={handleUploadPress}
					icon={<Feather name="upload-cloud" size={32} color="#66707A" />}
				/>

				{/* CENTRAL SCAN BUTTON (primary action) */}
				<ScanButton onPress={handleUploadPress} />

				{/* HISTORY TAB */}
				<BottomIcon
					label="HISTORY"
					isActive={activeTab === "history"}
					onPress={handleHistoryPress}
					icon={
						<Ionicons
							name="bookmark-outline"
							size={32}
							color={activeTab === "history" ? "#374151" : "#66707A"}
						/>
					}
				/>

				{/* PROFILE TAB (uses avatar image) */}
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
		</Box>
	);
}

/**
 * Reusable component for each bottom navigation item
 * Handles icon + label + active indicator animation
 */
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

				{/* Animated underline indicator when active */}
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

			{/* Label under icon */}
			<Text fontSize={12} fontFamily="RobotoMedium" color="#66707A">
				{label}
			</Text>
		</Pressable>
	);
}