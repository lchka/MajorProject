import React from "react";
import type { ImageSourcePropType } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Box, Image, Pressable, Text } from "@gluestack-ui/themed";
import { SWITCH_PROFILE_CLOSE_DURATION_MS } from "../../style/Animation";
import { styles } from "../../style/LandingPageStyle";
import ProfileChoice from "./ChooseProfile";

export type DifferentProfileItem = {
	id: string;
	name: string;
	avatarSource?: ImageSourcePropType;
	isMain?: boolean;
};

type DifferentProfileProps = {
	profiles: DifferentProfileItem[];
	activeProfileId?: string;
	onSelectProfile?: (profileId: string) => void;
	onAddProfile?: () => void;
	onEditProfile?: (profileId?: string) => void;
	title?: string;
	greetingLabel?: string;
	cardTitle?: string;
	cardAvatarSource?: ImageSourcePropType;
};

function toGreetingFirstName(name: string) {
	const trimmed = name.trim();
	if (!trimmed) {
		return "";
	}

	const [firstName] = trimmed.split(/\s+/);
	return firstName.toUpperCase();
}

export default function DifferentProfile({
	profiles,
	activeProfileId,
	onSelectProfile,
	onAddProfile,
	onEditProfile,
	title = "Profiles Used",
	greetingLabel,
	cardTitle = "Switch Profile",
	cardAvatarSource = require("../../../assets/icon.png"),
}: DifferentProfileProps) {
	const switchCardBackgroundColor = "#ebf5ff";
	const switchCardBorderColor = "#D1E2F0";

	const activeProfile = React.useMemo(
		() => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0],
		[profiles, activeProfileId],
	);

	const displayedCardAvatarSource = activeProfile?.avatarSource ?? cardAvatarSource;
	const shouldShowMainCrown = activeProfile ? activeProfile.isMain ?? true : false;
	const capitalizedName = activeProfile?.name ? toGreetingFirstName(activeProfile.name) : "THERE";
	const greetingText = greetingLabel ?? `HI, ${capitalizedName}!`;

	const [isOpen, setIsOpen] = React.useState(false);
	const isClosingRef = React.useRef(false);
	const [isClosing, setIsClosing] = React.useState(false);
	const [openCycle, setOpenCycle] = React.useState(0);
	const closeFallbackRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const requestClose = React.useCallback(() => {
		if (isClosingRef.current) {
			return;
		}

		isClosingRef.current = true;
		setIsClosing(true);

		const finishClose = () => {
			if (closeFallbackRef.current) {
				clearTimeout(closeFallbackRef.current);
				closeFallbackRef.current = null;
			}

			if (!isClosingRef.current) {
				return;
			}

			isClosingRef.current = false;
			setIsOpen(false);
		};

		closeFallbackRef.current = setTimeout(finishClose, SWITCH_PROFILE_CLOSE_DURATION_MS + 30);
	}, []);

	React.useEffect(() => {
		if (isOpen) {
			isClosingRef.current = false;
			setIsClosing(false);
			setOpenCycle((value) => value + 1);
			if (closeFallbackRef.current) {
				clearTimeout(closeFallbackRef.current);
				closeFallbackRef.current = null;
			}
		}
	}, [isOpen]);

	React.useEffect(() => {
		return () => {
			if (closeFallbackRef.current) {
				clearTimeout(closeFallbackRef.current);
			}
		};
	}, []);

	return (
		<>
			<Pressable
				my="$2"
				mx="$2"
				style={[
					styles.switchProfileCard,
					{
						backgroundColor: switchCardBackgroundColor,
						borderColor: switchCardBorderColor,
					},
				]}
				shadowColor="#000000"
				shadowOpacity={0.14}
				shadowRadius={10}
				shadowOffset={{ width: 0, height: 4 }}
				elevation={5}
				onPress={() => setIsOpen(true)}
			>
				<Box style={{ position: "relative" }}>
					<Image source={displayedCardAvatarSource} style={styles.switchAvatar} alt="Profile avatar" />
					{shouldShowMainCrown ? (
						<Image
							source={require("../../../assets/crown.png")}
							style={{
								position: "absolute",
								top: -6,
								right: 0,
								width: 16,
								height: 16,
								zIndex: 2,
								transform: [{ rotate: "35deg" }],
							}}
							alt="Main profile crown"
						/>
					) : null}
				</Box>

				<Box style={styles.switchCopy}>
					<Text fontSize={13} fontFamily="Roboto" fontWeight="bold" color="#9c9c9c">
						{greetingText}
					</Text>
					<Text pt="$2" fontSize={22} lineHeight={18} fontFamily="Roboto" fontWeight="semibold" color="#151515">
						{cardTitle}
					</Text>
				</Box>

				<Box
					w={40}
					h={40}
					borderRadius={20}
					bg="#6FA5DA"
					alignItems="center"
					justifyContent="center"
				>
					<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
				</Box>
			</Pressable>

			<ProfileChoice
				isOpen={isOpen}
				isClosing={isClosing}
				openCycle={openCycle}
				onClose={requestClose}
				profiles={profiles}
				activeProfileId={activeProfileId}
				onSelectProfile={(selectedProfileId) => {
					onSelectProfile?.(selectedProfileId);
					requestClose();
				}}
				title={title}
				showProfileManagementActions={false}
			/>
		</>
	);
}
