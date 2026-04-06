import React from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Box, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import EditButton from "../components/Buttons/EditButton";
import SwitchProfile from "../components/overlays/SwitchProfile";
import PastAnalysis from "../components/general/pastAnalysis";
import PreferencesOverview from "../components/general/preferences";
import profileService from "../services/profileService";
import { AuthStackParamList } from "../types/navigation";
import { styles } from "../style/LandingPageStyle";

const AUTH_TOKEN_KEY = "authToken";

const conditionCards = [
	{ title: "Dermatitis", level: "MODERATE" },
	{ title: "Eczema", level: "SEVERE" },
];

export default function LandingScreen() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
	const [profileId, setProfileId] = React.useState<string | null>(null);
	const [profiles, setProfiles] = React.useState<Array<{ id: string; name: string; avatarUri?: string }>>([]);
	const [isSwitchProfileOpen, setIsSwitchProfileOpen] = React.useState(false);

	React.useEffect(() => {
		let isMounted = true;

		const loadProfileId = async () => {
			try {
				const fetchedProfiles = await profileService.getMyProfile();
				const activeProfile = fetchedProfiles.find((item) => item.main_profile) ?? fetchedProfiles[0];
				if (isMounted) {
					setProfiles(
						fetchedProfiles.map((item) => ({
							id: item.id,
							name: `${item.first_name} ${item.last_name}`.trim(),
							avatarUri: item.profile_image || undefined,
						})),
					);
					setProfileId(activeProfile?.id ?? null);
				}
			} catch {
				if (isMounted) {
					setProfiles([]);
					setProfileId(null);
				}
			}
		};

		void loadProfileId();

		return () => {
			isMounted = false;
		};
	}, []);

	// Clears local auth state and routes back to the login flow.
	const handleSignOut = async () => {
		await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
		navigation.navigate("LoginScreen");
	};

	return (
		<Box style={styles.screen} mt="$3.5">
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{/* Top brand and utility icons */}
				<Box py="$3.5" mb="$0" style={styles.headerRow}>
					<Box style={styles.brandWrap}>
						
						<Text pl="$1" fontSize={34} lineHeight={34} fontFamily="DancingScript" color="#4E4E4E">
							Lumière
						</Text>
					</Box>

					<Box  style={styles.headerActions}>
						{/* search icon */}
						<Box px="$1" >
						<Feather  name="search" size={28} color="#111111" />
						</Box>
						
						<Box mx="$2" style={styles.bellWrap}>
							 <Feather name="bell" size={28} color="#111111" />
							<Box style={styles.badge}>
								<Text fontSize={10} lineHeight={10} fontWeight="$bold" color="#FFFFFF">2</Text>
							</Box>
						</Box>
						<Pressable onPress={handleSignOut}>
							<Image
								source={require("../../assets/icon.png")}
								style={styles.avatar}
								resizeMode="cover"
								alt="User avatar"
							/>
						</Pressable>
					</Box>
				</Box>

				<Box style={styles.divider} />

				{/* Profile quick switch card */}
				<Pressable my="$2" style={styles.switchProfileCard} onPress={() => setIsSwitchProfileOpen(true)}>
					<Image
						source={require("../../assets/icon.png")}
						style={styles.switchAvatar}
						alt="Profile avatar"
					/>
					<Box style={styles.switchCopy}>
						<Text fontSize={13} fontFamily="Roboto" color="#6D7073">HI, ICHKA!</Text>
						<Text pt="$2"fontSize={22} lineHeight={18} fontFamily="Roboto" fontWeight="semibold" color="#151515">Switch Profile</Text>
					</Box>
					<AntDesign name="right" size={16} color="#111111" />
				</Pressable>

				{/* Past analysis cards */}
				<Box my="$2"style={styles.sectionHeader}>
					<Text fontSize={22} pt="$2" lineHeight={22} fontFamily="RobotoMedium" color="#151515">Past Analysis</Text>
					<EntypoDots  />
				</Box>

				<PastAnalysis profileId={profileId} />

				<PreferencesOverview />

				{/* Conditions summary cards */}
				<Box style={styles.sectionHeader}>
					<Text fontSize={17} lineHeight={22} fontFamily="RobotoMedium" color="#151515">Conditions Overview</Text>
					<EditButton width={100} textStyle={styles.editText} style={styles.editButton} />
				</Box>

				{/* Conditions share a compact card layout for consistent scanning. */}
				<Box style={styles.conditionsRow}>
					{conditionCards.map((item) => (
						<Box key={item.title} style={styles.conditionCard}>
							<Text fontSize={11} fontFamily="RobotoMedium" color="#111111" mb="$0.5">{item.title}</Text>
							<Text fontSize={8} fontFamily="RobotoMedium" color="#222222">{item.level}</Text>
							<Text mt="$0.5" fontSize={7} fontFamily="Roboto" color="#666666">DATED ADDED: 30.3.2026</Text>
						</Box>
					))}
				</Box>
			</ScrollView>

			<SwitchProfile
				isOpen={isSwitchProfileOpen}
				onClose={() => setIsSwitchProfileOpen(false)}
				profiles={profiles.map((profile) => ({
					id: profile.id,
					name: profile.name,
					avatarSource: profile.avatarUri ? { uri: profile.avatarUri } : undefined,
				}))}
				activeProfileId={profileId ?? undefined}
				onSelectProfile={(selectedProfileId) => {
					setProfileId(selectedProfileId);
					setIsSwitchProfileOpen(false);
				}}
				onAddProfile={() => {
					setIsSwitchProfileOpen(false);
					navigation.navigate("ProfileScreen");
				}}
			/>

			{/* Sticky bottom navigation */}
			<Box style={styles.bottomNav}>
				<BottomIcon label="HOME" icon={<Feather name="home" size={22} color="#66707A" />} />
				<BottomIcon label="UPLOAD" icon={<Feather name="upload-cloud" size={22} color="#66707A" />} />
				<Box style={styles.scanWrap}>
					<Box style={styles.scanButton}>
						<MaterialCommunityIcons name="scan-helper" size={32} color="#4A5562" />
					</Box>
				</Box>
				<BottomIcon label="MY HISTORY" icon={<Ionicons name="bookmark-outline" size={22} color="#66707A" />} />
				<BottomIcon label="MORE" icon={<Feather name="menu" size={24} color="#66707A" />} />
			</Box>
		</Box>
	);
}

function EntypoDots() {
	// Keeps section-header action icon usage consistent across sections.
	return <AntDesign name="ellipsis" size={28} color="#111111" />;
}

function PageDots({ total, activeIndex }: { total: number; activeIndex: number }) {
	return (
		<Box style={styles.pageDotsRow}>
			{Array.from({ length: total }).map((_, index) => (
				<Box
					key={`page-dot-${index}`}
					style={[styles.pageDot, index === activeIndex ? styles.pageDotActive : null]}
				/>
			))}
		</Box>
	);
}

function BottomIcon({ label, icon }: { label: string; icon: React.ReactNode }) {
	// Single nav item primitive so icon/label spacing stays uniform.
	return (
		<Box style={styles.bottomItem}>
			{icon}
			<Text fontSize={10} fontFamily="RobotoMedium" color="#66707A">{label}</Text>
		</Box>
	);
}
