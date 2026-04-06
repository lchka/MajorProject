import React from "react";
import { PanResponder, View, useWindowDimensions } from "react-native";
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
	SWITCH_PROFILE_IDS,
	SWITCH_PROFILE_MOTION,
} from "../../style/Animation";

type SwitchProfileItem = {
	id: string;
	name: string;
	avatarSource?: ImageSourcePropType;
};

type ProfileChoiceProps = {
	isOpen: boolean;
	isClosing: boolean;
	openCycle: number;
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

	// Use up to two initials so avatar fallbacks stay compact and readable.
	const nameParts = trimmed.split(/\s+/);
	if (nameParts.length === 1) {
		return nameParts[0].charAt(0).toUpperCase();
	}

	return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
}

export default function ProfileChoice({
	isOpen,
	isClosing,
	openCycle,
	onClose,
	profiles,
	activeProfileId,
	onSelectProfile,
	onAddProfile,
	title = "Change Profile",
}: ProfileChoiceProps) {
	const { width: screenWidth } = useWindowDimensions();
	const swipeStartYRef = React.useRef(0);
	const hasTriggeredSwipeCloseRef = React.useRef(false);

	const clamp = (value: number, min: number, max: number) =>
		Math.min(max, Math.max(min, value));

	const maxProfiles = 3;
	const modalMaxWidth = clamp(screenWidth - 24, 320, 560);
	const selectorPaddingHorizontal = Math.round(clamp(screenWidth * 0.04, 16, 28));
	const targetCircleSize = clamp(screenWidth * 0.28, 108, 148);
	const slotGap = 12;
	const selectorInnerWidth = modalMaxWidth - 2 * selectorPaddingHorizontal;
	const maxCircleSizeByContainer = (selectorInnerWidth - slotGap * (maxProfiles - 1)) / maxProfiles;
	const circleSize = Math.round(clamp(Math.min(targetCircleSize, maxCircleSizeByContainer), 84, 148));
	const circleRadius = Math.round(circleSize / 2);
	const selectorPaddingVertical = Math.round(clamp(circleSize * 0.14, 12, 20));
	const selectorMinHeight = circleSize + selectorPaddingVertical * 2 + 28;
	const initialsFontSize = Math.round(clamp(circleSize * 0.34, 30, 42));
	const nameFontSize = Math.round(clamp(circleSize * 0.19, 16, 20));
	const addLabelFontSize = Math.round(clamp(circleSize * 0.17, 14, 18));
	const visibleProfiles = profiles.slice(0, maxProfiles);
	const addSlotCount = Math.max(0, maxProfiles - visibleProfiles.length);
	const slotWidth = circleSize + 24;

	// Restrict gesture takeover to vertical-down movement so taps and horizontal drags still work.
	const handlePanResponder = React.useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponderCapture: (_, gestureState) => {
					return gestureState.dy > 2 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
				},
				onMoveShouldSetPanResponder: (_, gestureState) => {
					return gestureState.dy > 2 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
				},
				onPanResponderGrant: () => {
					swipeStartYRef.current = 0;
					hasTriggeredSwipeCloseRef.current = false;
				},
				onPanResponderMove: (_, gestureState) => {
					swipeStartYRef.current = gestureState.dy;

					// Close once per gesture after the drag passes the distance threshold.
					if (!hasTriggeredSwipeCloseRef.current && gestureState.dy > 48) {
						hasTriggeredSwipeCloseRef.current = true;
						onClose();
					}
				},
				onPanResponderRelease: (_, gestureState) => {
					if (hasTriggeredSwipeCloseRef.current) {
						hasTriggeredSwipeCloseRef.current = false;
						return;
					}

					const movedEnough = gestureState.dy > 36;
					const fastEnough = gestureState.vy > 0.75;

					// Accept either a long drag or a short fast flick.
					if (movedEnough || fastEnough) {
						hasTriggeredSwipeCloseRef.current = true;
						onClose();
					}

					hasTriggeredSwipeCloseRef.current = false;
				},
				onPanResponderTerminate: () => {
					swipeStartYRef.current = 0;
					hasTriggeredSwipeCloseRef.current = false;
				},
				onPanResponderTerminationRequest: () => true,
			}),
		[onClose],
	);

	return (
		<Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick>
			<ModalBackdrop />

			<MotiView
				// Re-keying per open cycle reliably replays enter animation each time.
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
					px="$4"
					pt="$2"
					pb="$4"
					w="$full"
					maxWidth={modalMaxWidth}
					shadowColor="#000000"
					shadowOpacity={0.05}
					shadowRadius={18}
					shadowOffset={{ width: 0, height: 8 }}
					elevation={12}
				>
					{/* Top swipe/close handle */}
					<View {...handlePanResponder.panHandlers}>
						<Pressable
							nativeID={SWITCH_PROFILE_IDS.handleButton}
							testID={SWITCH_PROFILE_IDS.handleButton}
							alignItems="center"
							py="$1"
							onPress={onClose}
						>
							<Box width={42} height={5} borderRadius={999} bg="#D7D7D7" />
						</Pressable>
					</View>

					{/* Header row: title + X close button */}
					<ModalHeader alignItems="center" justifyContent="space-between" px="$1" pt="$1" pb="$2">
						<Heading size="lg" color="#111111" fontWeight="$normal">
							{title}
						</Heading>
						<ModalCloseButton
							nativeID={SWITCH_PROFILE_IDS.closeButton}
							testID={SWITCH_PROFILE_IDS.closeButton}
							p="$1"
							borderRadius="$full"
							onPress={onClose}
						>
							<Icon as={CloseIcon} size="md" color="#111111" />
						</ModalCloseButton>
					</ModalHeader>

					<ModalBody p="$0">
						{/* Main selector box that contains profile circles */}
						<HStack
							alignItems="center"
							justifyContent="center"
							borderWidth={1}
							borderColor="#E5E5E5"
							borderRadius={18}
							style={{
								paddingHorizontal: selectorPaddingHorizontal,
								paddingVertical: selectorPaddingVertical,
								minHeight: selectorMinHeight,
								flexWrap: "wrap",
								columnGap: slotGap,
								rowGap: 14,
							}}
							bg="#FFFFFF"
							shadowColor="#000000"
							shadowOpacity={0.08}
							shadowRadius={8}
							shadowOffset={{ width: 0, height: 3 }}
							elevation={3}
						>
							{/* Existing profile circles */}
							{visibleProfiles.map((profile) => {
								const isActive = profile.id === activeProfileId;

								return (
									<Pressable
										key={profile.id}
										alignItems="center"
										style={{ width: slotWidth }}
										onPress={() => onSelectProfile?.(profile.id)}
									>
										<Box
											width={circleSize}
											height={circleSize}
											borderRadius={circleRadius}
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
													fontSize={initialsFontSize}
													lineHeight={initialsFontSize}
													color={isActive ? "#FFFFFF" : "#58CCED"}
													fontFamily="Roboto"
												>
													{getInitials(profile.name)}
												</Text>
											)}
										</Box>

										<Text
											mt="$2"
											fontSize={nameFontSize}
											lineHeight={nameFontSize + 2}
											color="#111111"
											fontFamily="Roboto"
											textAlign="center"
											numberOfLines={1}
										>
											{profile.name}
										</Text>
									</Pressable>
								);
							})}

							{/* Add profile circles to fill remaining slots up to maxProfiles */}
							{Array.from({ length: addSlotCount }).map((_, slotIndex) => (
								<Pressable
									key={`add-slot-${slotIndex}`}
									alignItems="center"
									style={{ width: slotWidth }}
									onPress={onAddProfile}
								>
									<Box
										width={circleSize}
										height={circleSize}
										borderRadius={circleRadius}
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
										fontSize={addLabelFontSize}
										lineHeight={addLabelFontSize + 2}
										color="#111111"
										fontFamily="Roboto"
										textAlign="center"
										numberOfLines={1}
									>
										Add Profile
									</Text>
								</Pressable>
							))}
						</HStack>
					</ModalBody>
				</ModalContent>
			</MotiView>
		</Modal>
	);
}
