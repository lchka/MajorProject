import React from "react";
import type { ImageSourcePropType } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import {
	Box,
	Image,
	Pressable,
	Text,
} from "@gluestack-ui/themed";
import { SWITCH_PROFILE_CLOSE_DURATION_MS } from "../../style/Animation";
import { styles } from "../../style/LandingPageStyle";
import ProfileChoice from "./ChooseProfile";

type SwitchProfileItem = {
	id: string;
	name: string;
	avatarSource?: ImageSourcePropType;
	isMain?: boolean;
};

type SwitchProfileProps = {
	profiles: SwitchProfileItem[];
	activeProfileId?: string;
	onSelectProfile?: (profileId: string) => void;
	onAddProfile?: () => void;
	onEditProfile?: (profileId?: string) => void;
	title?: string;
	greetingLabel?: string;
	cardAvatarSource?: ImageSourcePropType;
};

// This formats the greeting name as the first name in caps.
function toGreetingFirstName(name: string) {
	const trimmed = name.trim();
	if (!trimmed) {
		return "";
	}

	const [firstName] = trimmed.split(/\s+/);
	return firstName.toUpperCase();
}

export default function SwitchProfile({
	profiles,
	activeProfileId,
	onSelectProfile,
	onAddProfile,
	onEditProfile,
	title = "Change Profile",
	greetingLabel,
	cardAvatarSource = require("../../../assets/icon.png"),
}: SwitchProfileProps) {
	// This is where the switch card colors are controlled in this file.
	const switchCardBackgroundColor = "#ebf5ff";
	const switchCardBorderColor = "#D1E2F0";

	// This picks the currently active profile so card info updates correctly.
	const activeProfile = React.useMemo(
		() => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0],
		[profiles, activeProfileId],
	);

	// This controls the image + greeting shown on the main switch card.
	const displayedCardAvatarSource = activeProfile?.avatarSource ?? cardAvatarSource;
	const shouldShowMainCrown = activeProfile ? activeProfile.isMain ?? true : false;
	const capitalizedName = activeProfile?.name ? toGreetingFirstName(activeProfile.name) : "THERE";
	const greetingText = greetingLabel ?? `HI, ${capitalizedName}!`;

	// This controls the open/close state for the profile choice overlay.
	const [isOpen, setIsOpen] = React.useState(false);
	const isClosingRef = React.useRef(false);
	const [isClosing, setIsClosing] = React.useState(false);
	const [openCycle, setOpenCycle] = React.useState(0);
	const closeFallbackRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	// This starts close animation and makes sure the modal always finishes closing.
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

	// This resets animation flags each time the modal opens.
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

	// This clears any timer when component unmounts.
	React.useEffect(() => {
		return () => {
			if (closeFallbackRef.current) {
				clearTimeout(closeFallbackRef.current);
			}
		};
	}, []);

	return (
		<>
			{/* This is the main switch profile card on landing */}
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
				{/* This is the active profile image on the card */}
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
				{/* This is the greeting + title text block */}
				<Box style={styles.switchCopy}>
					<Text fontSize={13} fontFamily="Roboto" fontWeight="bold" color="#9c9c9c">
						{greetingText}
					</Text>
					<Text pt="$2" fontSize={22} lineHeight={18} fontFamily="Roboto" fontWeight="semibold" color="#151515">
						Switch Profile
					</Text>
				</Box>
				{/* This is the arrow icon on the right side */}
				<AntDesign name="right" size={16} color="#111111" />
			</Pressable>

			{/* This is the profile choice overlay modal */}
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
				onAddProfile={() => {
					onAddProfile?.();
					requestClose();
				}}
				onEditProfile={onEditProfile}
				title={title}
			/>
		</>
	);
}
