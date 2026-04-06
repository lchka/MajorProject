import React from "react";
import type { ImageSourcePropType } from "react-native";
import { MotiView } from "moti";
import {
	Box,
	Heading,
	HStack,
	Icon,
	Image,
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	Pressable,
	Text,
	AddIcon,
	CloseIcon,
} from "@gluestack-ui/themed";
import {
	SWITCH_PROFILE_CLOSE_DURATION_MS,
	SWITCH_PROFILE_IDS,
	SWITCH_PROFILE_MOTION,
} from "../../style/Animation";

type SwitchProfileItem = {
	id: string;
	name: string;
	avatarSource?: ImageSourcePropType;
};

type SwitchProfileProps = {
	isOpen: boolean;
	onClose: () => void;
	profiles: SwitchProfileItem[];
	activeProfileId?: string;
	onSelectProfile?: (profileId: string) => void;
	onAddProfile?: () => void;
	title?: string;
};

function getInitials(name: string) {
	const trimmed = name.trim();
	if (!trimmed) {
		return "?";
	}

	const nameParts = trimmed.split(/\s+/);
	if (nameParts.length === 1) {
		return nameParts[0].charAt(0).toUpperCase();
	}

	return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
}

export default function SwitchProfile({
	isOpen,
	onClose,
	profiles,
	activeProfileId,
	onSelectProfile,
	onAddProfile,
	title = "Change Profile",
}: SwitchProfileProps) {
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
			onClose();
		};

		// Close after Moti exit animation duration.
		closeFallbackRef.current = setTimeout(finishClose, SWITCH_PROFILE_CLOSE_DURATION_MS + 30);
	}, [onClose]);

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
		<Modal isOpen={isOpen} onClose={requestClose} closeOnOverlayClick>
			<ModalBackdrop />

			<MotiView
				key={`switch-profile-motion-${openCycle}`}
				nativeID={SWITCH_PROFILE_IDS.overlayMotion}
				testID={SWITCH_PROFILE_IDS.overlayMotion}
				from={SWITCH_PROFILE_MOTION.from}
				animate={isClosing ? SWITCH_PROFILE_MOTION.exit : SWITCH_PROFILE_MOTION.enter}
				transition={SWITCH_PROFILE_MOTION.transition}
			>
				<ModalContent
					borderRadius={18}
					borderWidth={0}
					bg="#FFFFFF"
					px="$3"
					pt="$1"
					pb="$3"
					w="$full"
					maxWidth={370}
				>
					<Pressable
						nativeID={SWITCH_PROFILE_IDS.handleButton}
						testID={SWITCH_PROFILE_IDS.handleButton}
						alignItems="center"
						py="$1"
						onPress={requestClose}
					>
						<Box
							width={42}
							height={5}
							borderRadius={999}
							bg="#D7D7D7"
						/>
					</Pressable>

					<ModalHeader alignItems="center" justifyContent="space-between" px="$1" pt="$1" pb="$2">
						<Heading size="sm" color="#111111" fontWeight="$normal">
							{title}
						</Heading>
						<ModalCloseButton
							nativeID={SWITCH_PROFILE_IDS.closeButton}
							testID={SWITCH_PROFILE_IDS.closeButton}
							p="$1"
							borderRadius="$full"
							onPress={requestClose}
						>
							<Icon as={CloseIcon} size="md" color="#111111" />
						</ModalCloseButton>
					</ModalHeader>

					<ModalBody p="$0">
						<HStack
							alignItems="flex-start"
							justifyContent="space-between"
							borderWidth={1}
							borderColor="#E5E5E5"
							borderRadius={14}
							px="$4"
							py="$3"
						>
							{profiles.map((profile) => {
								const isActive = profile.id === activeProfileId;

								return (
									<Pressable
										key={profile.id}
										alignItems="center"
										onPress={() => onSelectProfile?.(profile.id)}
									>
										<Box
											width={78}
											height={78}
											borderRadius={39}
											alignItems="center"
											justifyContent="center"
											overflow="hidden"
											borderWidth={2}
											borderColor="#58CCED"
											bg={isActive ? "#58CCED" : "#FFFFFF"}
										>
											{profile.avatarSource ? (
												<Image
													source={profile.avatarSource}
													alt={`${profile.name} avatar`}
													style={{ width: "100%", height: "100%" }}
													resizeMode="cover"
												/>
											) : (
												<Text
													fontSize={34}
													lineHeight={34}
													color={isActive ? "#FFFFFF" : "#58CCED"}
													fontFamily="Roboto"
												>
													{getInitials(profile.name)}
												</Text>
											)}
										</Box>

										<Text
											mt="$2"
											fontSize={18}
											lineHeight={20}
											color="#111111"
											fontFamily="Roboto"
										>
											{profile.name}
										</Text>
									</Pressable>
								);
							})}

							<Pressable alignItems="center" onPress={onAddProfile}>
								<Box
									width={66}
									height={65}
									borderRadius={39}
									alignItems="center"
									justifyContent="center"
									borderWidth={2}
									borderColor="#58CCED"
									bg="#FFFFFF"
								>
									<Icon as={AddIcon} size="xl" color="#58CCED" />
								</Box>

								<Text
									mt="$2"
									fontSize={16}
									lineHeight={20}
									color="#111111"
									fontFamily="Roboto"
								>
									Add Profile
								</Text>
							</Pressable>
						</HStack>
					</ModalBody>
				</ModalContent>
			</MotiView>
		</Modal>
	);
}
