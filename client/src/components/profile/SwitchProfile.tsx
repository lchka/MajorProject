import React from "react";
import type { ImageSourcePropType, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
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
	hasScrolled?: boolean;
	hasBackButton?: boolean;
	style?: ViewStyle;
};

function toGreetingFirstName(name: string) {
	const trimmed = name.trim();
	if (!trimmed) return "";
	const [firstName] = trimmed.split(/\s+/);
	return firstName;
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
	hasScrolled = false,
	hasBackButton = false,
	style,
}: SwitchProfileProps) {
	const switchCardBackgroundColor = "#ebf5ff";
	const switchCardBorderColor = "#D1E2F0";

	const activeProfile =
  profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];

	const displayedCardAvatarSource = activeProfile?.avatarSource ?? cardAvatarSource;
	const shouldShowMainCrown = activeProfile ? activeProfile.isMain ?? true : false;
	const capitalizedName = activeProfile?.name ? toGreetingFirstName(activeProfile.name) : "there";
	const greetingText = greetingLabel ?? `Hi, ${capitalizedName}!`;

	const [isOpen, setIsOpen] = React.useState(false);
	const isClosingRef = React.useRef(false);
	const [isClosing, setIsClosing] = React.useState(false);
	const [openCycle, setOpenCycle] = React.useState(0);
	const closeFallbackRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const requestClose = React.useCallback(() => {
		if (isClosingRef.current) return;
		isClosingRef.current = true;
		setIsClosing(true);

		const finishClose = () => {
			if (closeFallbackRef.current) {
				clearTimeout(closeFallbackRef.current);
				closeFallbackRef.current = null;
			}
			if (!isClosingRef.current) return;
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

	const baseMargin = hasBackButton ? 0 : 20;
	const scrolledMargin = hasBackButton ? 10 : 52;

	return (
		<>
			<MotiView
				from={{ marginTop: baseMargin }}
				animate={{ marginTop: hasScrolled ? scrolledMargin : baseMargin }}
				transition={{ type: "timing", duration: 300 }}
				style={style}
			>
				<Box>
					<Pressable
						mx="$4"
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
							<Text fontSize={22} fontFamily="Roboto" fontWeight="bold" color="#343434">
								{greetingText}
							</Text>
							{/* <Text pt="$2" fontSize={22} lineHeight={18} fontFamily="Roboto" fontWeight="semibold" color="#151515">
								Switch Profile
							</Text> */}
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
				</Box>
			</MotiView>

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