import React from "react";
import { NavigationProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Box, ScrollView, Text } from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import EditButton from "../components/Buttons/EditButton";
import NavBarBottom from "../components/general/NavBarBottom";
import NavBarTop from "../components/general/NavBarTop";
import SwitchProfile from "../components/profile/SwitchProfile";
import PastAnalysis from "../components/evaluations/PastAnalysis";
import PreferencesOverview from "../components/preferences/AllPreferences";
import profileService, { Profile } from "../services/profileService";
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
	const [profileDetails, setProfileDetails] = React.useState<Profile[]>([]);
	const [profiles, setProfiles] = React.useState<Array<{ id: string; name: string; avatarUri?: string; isMain: boolean }>>([]);

	const loadProfiles = React.useCallback(async () => {
		try {
			const fetchedProfiles = await profileService.getMyProfile();
			const fallbackProfile = fetchedProfiles.find((item) => item.main_profile) ?? fetchedProfiles[0];

			setProfileDetails(fetchedProfiles);
			setProfiles(
				fetchedProfiles.map((item) => ({
					id: item.id,
					name: item.first_name.trim(),
					avatarUri: item.profile_image || undefined,
					isMain: item.main_profile,
				})),
			);

			setProfileId((previousProfileId) => {
				if (previousProfileId && fetchedProfiles.some((profile) => profile.id === previousProfileId)) {
					return previousProfileId;
				}

				return fallbackProfile?.id ?? null;
			});
		} catch {
			setProfileDetails([]);
			setProfiles([]);
			setProfileId(null);
		}
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			void loadProfiles();
		}, [loadProfiles]),
	);

	// Clears local auth state and routes back to the login flow.
	const handleSignOut = async () => {
		await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
		navigation.navigate("LoginScreen");
	};

	const activeProfile = React.useMemo(
		() =>
			profileDetails.find((profile) => profile.id === profileId) ??
			profileDetails.find((profile) => profile.main_profile) ??
			profileDetails[0],
		[profileDetails, profileId],
	);

	const activeProfilePreferences = React.useMemo(() => {
		return activeProfile?.preferences?.map((item) => item.name) ?? [];
	}, [activeProfile]);

	return (
		<Box style={styles.screen}>
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
			<ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>
				<NavBarTop
					notificationCount={2}
					onPressAvatar={handleSignOut}
				/>
<Box mt="$4">
				<SwitchProfile
					profiles={profiles.map((profile) => ({
						id: profile.id,
						name: profile.name,
						avatarSource: profile.avatarUri ? { uri: profile.avatarUri } : undefined,
						isMain: profile.isMain,
					}))}
					activeProfileId={profileId ?? undefined}
					onSelectProfile={(selectedProfileId) => {
						setProfileId(selectedProfileId);
					}}
					onAddProfile={() => {
						navigation.navigate("ProfileScreen");
					}}
					onEditProfile={(selectedProfileId) => {
						const targetProfileId = selectedProfileId ?? profileId ?? undefined;
						const targetProfile = profileDetails.find((item) => item.id === targetProfileId) ?? activeProfile;
						const fullName = [targetProfile?.first_name?.trim(), targetProfile?.last_name?.trim()]
							.filter(Boolean)
							.join(" ");
						const targetProfileName =
							fullName ||
							profiles.find((item) => item.id === targetProfileId)?.name ||
							activeProfile?.first_name ||
							undefined;
						const targetProfilePreferenceNames = targetProfile?.preferences?.map((item) => item.name) ?? [];
						const targetProfileAge = targetProfile?.age?.toString()?.trim() || undefined;
						const targetProfileImageUri =
							profiles.find((item) => item.id === targetProfileId)?.avatarUri ??
							activeProfile?.profile_image ??
							undefined;

						navigation.navigate("EditProfileScreen", {
							profileId: targetProfileId,
							profileName: targetProfileName,
							profileImageUri: targetProfileImageUri,
							profilePreferenceNames: targetProfilePreferenceNames,
							profileAge: targetProfileAge,
						});
					}}
				/>
</Box>
				{/* Past analysis cards */}
				<Box my="$2"style={styles.sectionHeader}>
					<Text fontSize={22} pt="$2" lineHeight={22} fontFamily="RobotoMedium" color="#151515">Past Analysis</Text>
					<EntypoDots  />
				</Box>

				<PastAnalysis profileId={profileId} />

				<PreferencesOverview
					profilePreferenceNames={activeProfilePreferences}
					profileFirstName={activeProfile?.first_name}
					onAddPreference={() => navigation.navigate("PreferenceScreen", { profileId: profileId ?? undefined })}
				/>

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

			{/* Sticky bottom navigation */}
			<NavBarBottom
				activeTab="home"
				avatarSource={activeProfile?.profile_image ? { uri: activeProfile.profile_image } : undefined}
			/>
		</Box>
	);
}

function EntypoDots() {
	// Keeps section-header action icon usage consistent across sections.
	return <Feather name="more-horizontal" size={28} color="#111111" />;
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
