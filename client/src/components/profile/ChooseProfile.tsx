import React from "react";
import { PanResponder, View, useWindowDimensions } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { MotiView } from "moti";
import Feather from "@expo/vector-icons/Feather";
import {
	Box,
	Heading,
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
	CloseIcon,
} from "@gluestack-ui/themed";
import {
	SWITCH_PROFILE_IDS,
	SWITCH_PROFILE_MOTION,
} from "../../style/Animation";
import EditButton from "../Buttons/EditButton";
import ProfileWarning from "../banners/ProfileWarning";
import { ProfileEditBadge } from "./ProfileEditBadge";

type SwitchProfileItem = {
	id: string;
	name: string;
	avatarSource?: ImageSourcePropType;
	isMain?: boolean;
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
	onEditProfile?: (profileId?: string) => void;
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
	onEditProfile,
	title = "Change Profile",
}: ProfileChoiceProps) {
	const { width: screenWidth } = useWindowDimensions();
	const swipeStartYRef = React.useRef(0);
	const hasTriggeredSwipeCloseRef = React.useRef(false);

	const clamp = (value: number, min: number, max: number) =>
		Math.min(max, Math.max(min, value));

	const maxProfiles = 3;
	const modalMaxWidth = clamp(screenWidth - 24, 320, 560);
	const activeCircleSize = Math.round(clamp(screenWidth * 0.35, 122, 164));
	const activeCircleRadius = Math.round(activeCircleSize / 2);
	const secondaryCircleSize = Math.round(clamp(screenWidth * 0.2, 72, 98));
	const secondaryCircleRadius = Math.round(secondaryCircleSize / 2);
	const initialsFontSize = Math.round(clamp(secondaryCircleSize * 0.34, 24, 34));
	const orderedProfiles = React.useMemo(() => {
		if (!activeProfileId) {
			return profiles;
		}

		const activeIndex = profiles.findIndex((profile) => profile.id === activeProfileId);
		if (activeIndex <= 0) {
			return profiles;
		}

		const activeProfile = profiles[activeIndex];
		return [activeProfile, ...profiles.slice(0, activeIndex), ...profiles.slice(activeIndex + 1)];
	}, [profiles, activeProfileId]);
	const visibleProfiles = orderedProfiles.slice(0, maxProfiles);
	const activeProfile = visibleProfiles[0];
	const secondaryProfiles = visibleProfiles.slice(1, 3);
	// Lock profile creation once the UI max is reached.
	const isAddDisabled = profiles.length >= maxProfiles;
	// Edit mode toggles pencil affordances over each profile avatar.
	const [isEditMode, setIsEditMode] = React.useState(false);
	const [showProfileLimitWarning, setShowProfileLimitWarning] = React.useState(false);
	const warningTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const toggleEditMode = React.useCallback(() => {
		setIsEditMode((previous) => !previous);
	}, []);

	const showLimitWarning = React.useCallback(() => {
		setShowProfileLimitWarning(true);
		if (warningTimerRef.current) {
			clearTimeout(warningTimerRef.current);
		}
		warningTimerRef.current = setTimeout(() => {
			setShowProfileLimitWarning(false);
			warningTimerRef.current = null;
		}, 2600);
	}, []);

	// Adds a profile when allowed; otherwise shows inline capacity feedback.
	const handleAddProfile = React.useCallback(() => {
		if (isAddDisabled) {
			showLimitWarning();
			return;
		}

		onAddProfile?.();
	}, [isAddDisabled, onAddProfile, showLimitWarning]);

	const handleProfilePress = React.useCallback(
		(profileId: string) => {
			if (isEditMode) {
				onEditProfile?.(profileId);
				onClose();
				return;
			}

			onSelectProfile?.(profileId);
		},
		[isEditMode, onEditProfile, onClose, onSelectProfile],
	);

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

	React.useEffect(() => {
		return () => {
			if (warningTimerRef.current) {
				clearTimeout(warningTimerRef.current);
			}
		};
	}, []);

	React.useEffect(() => {
		if (!isOpen) {
			// Reset transient edit state each time modal closes.
			setIsEditMode(false);
		}
	}, [isOpen]);

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
					<View {...handlePanResponder.panHandlers} style={{ position: "relative" }}>
						<Pressable
							nativeID={SWITCH_PROFILE_IDS.handleButton}
							testID={SWITCH_PROFILE_IDS.handleButton}
							alignItems="center"
							py="$1"
							onPress={onClose}
						>
							<Box width={42} height={5} borderRadius={999} bg="#D7D7D7" />
						</Pressable>
						<ModalCloseButton
							nativeID={SWITCH_PROFILE_IDS.closeButton}
							testID={SWITCH_PROFILE_IDS.closeButton}
							p="$1"
							borderRadius="$full"
							onPress={onClose}
							style={{ position: "absolute", right: 0, top: 0 }}
						>
							<Icon as={CloseIcon} size="md" color="#111111" />
						</ModalCloseButton>
					</View>

					{/* Floating warning toast layered above modal content. */}
					<Box
						style={{
							position: "absolute",
							top: 54,
							left: 14,
							right: 14,
							zIndex: 40,
							elevation: 20,
						}}
					>
						<ProfileWarning
							visible={showProfileLimitWarning}
							message="You can only have up to 3 profiles."
						/>
					</Box>

					{/* Header row: title + X close button */}
					<ModalHeader alignItems="center" justifyContent="space-between" px="$1" py="$1">
						<Heading size="lg" color="#111111" fontWeight="$normal">
							{title}
						</Heading>
						<Box style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
							{/* Edit toggles visual edit affordances on profile avatars. */}
							<EditButton
								onPress={toggleEditMode}
								label={isEditMode ? "Done" : "Edit"}
								width={72}
								borderColor="#79C6EE"
								textColor="#2E96CB"
								style={{ height: 28, backgroundColor: "transparent", borderWidth: 2 }}
								textStyle={{ fontSize: 14, lineHeight: 16, fontFamily: "Roboto", textTransform: "none"}}
							/>
						</Box>
					</ModalHeader>

					<ModalBody p="$0" style={{ position: "relative" }}>

						<Box
							borderWidth={1}
							borderColor="#E6E9EE"
							borderRadius={20}
							bg="#FFFFFF"
							style={{
								paddingHorizontal: 14,
								paddingTop: 12,
								paddingBottom: 10,
							}}
							shadowColor="#000000"
							shadowOpacity={0.08}
							shadowRadius={10}
							shadowOffset={{ width: 0, height: 4 }}
							elevation={3}
						>
							{activeProfile ? (
								<Pressable alignItems="center" onPress={() => handleProfilePress(activeProfile.id)}>
									<Box style={{ position: "relative" }}>
										<Box
											width={activeCircleSize}
											height={activeCircleSize}
											borderRadius={activeCircleRadius}
											borderWidth={3}
											borderColor="#7ED2F4"
											overflow="hidden"
											bg="#F4FBFF"
										>
											{activeProfile.avatarSource ? (
												<Image
													source={activeProfile.avatarSource}
													alt={`${activeProfile.name} avatar`}
													style={{ width: "100%", height: "100%" }}
													resizeMode="cover"
												/>
											) : (
												<Box flex={1} alignItems="center" justifyContent="center">
													<Text fontSize={36} lineHeight={36} color="#58CCED" fontFamily="Roboto">
														{getInitials(activeProfile.name)}
													</Text>
												</Box>
											)}
										</Box>

										{/* Crown marks whichever profile is currently treated as main. */}
										{activeProfile.isMain ? (
											<Image
												source={require("../../../assets/crown.png")}
												style={{
													position: "absolute",
													top: -16,
													right: 10,
													width: 42,
													height: 42,
													transform: [{ rotate: "25deg" }],
													zIndex: 3,
												}}
												alt="Main profile crown"
											/>
										) : null}

										{/* Pencil badge appears only in edit mode. */}
										{isEditMode ? (
											<ProfileEditBadge sizePreset="large" style={{ position: "absolute", bottom: 8, right: 8 }} />
										) : null}

										{!isEditMode ? (
											<Box
												style={{
													position: "absolute",
													bottom: -8,
													alignSelf: "center",
													minWidth: 94,
													backgroundColor: "#E5F6FF",
													borderRadius: 999,
													paddingVertical: 4,
													paddingHorizontal: 12,
													flexDirection: "row",
													alignItems: "center",
													justifyContent: "center",
													gap: 4,
												}}
											>
												<Feather name="check" size={14} color="#1788BD" />
												<Text fontSize={11} lineHeight={12} fontFamily="RobotoMedium" color="#1788BD" numberOfLines={1}>
													Active
												</Text>
											</Box>
										) : null}
									</Box>

									<Text mt="$4" fontSize={40 > 24 ? 24 : 24} lineHeight={30} color="#1A1A1A" fontFamily="RobotoMedium">
										{activeProfile.name}
									</Text>
									<Text mt="$0.5" fontSize={20 > 15 ? 15 : 15} lineHeight={20} color="#3B95C8" fontFamily="Roboto">
										Active
									</Text>
								</Pressable>
							) : null}

							<Box mt="$5" style={{ paddingTop: 12 }}>
								<Box style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-around" }}>
									{[secondaryProfiles[0], secondaryProfiles[1]].map((profile, index) => (
										<Box key={profile?.id ?? `empty-${index}`} alignItems="center" style={{ width: "44%" }}>
											{profile ? (
												<Pressable alignItems="center" onPress={() => handleProfilePress(profile.id)}>
																	{profile.isMain ? (
																		<Image
																			source={require("../../../assets/crown.png")}
																			style={{
																				position: "absolute",
																				top: -14,
																				right: 6,
																				width: 28,
																				height: 28,
																				transform: [{ rotate: "22deg" }],
																				zIndex: 3,
																			}}
																			alt="Main profile crown"
																		/>
																	) : null}
													<Box
														width={secondaryCircleSize}
														height={secondaryCircleSize}
														borderRadius={secondaryCircleRadius}
														borderWidth={2}
														borderColor="#C4D3DF"
														overflow="hidden"
														bg="#F8FBFF"
													>
														{profile.avatarSource ? (
															<Image
																source={profile.avatarSource}
																alt={`${profile.name} avatar`}
																style={{ width: "100%", height: "100%" }}
																resizeMode="cover"
															/>
														) : (
															<Box flex={1} alignItems="center" justifyContent="center">
																<Text fontSize={initialsFontSize} lineHeight={initialsFontSize} color="#58CCED" fontFamily="Roboto">
																	{getInitials(profile.name)}
																</Text>
															</Box>
														)}
													</Box>
													{/* Secondary cards show the same edit affordance for consistency. */}
													{isEditMode ? (
														<ProfileEditBadge sizePreset="small" style={{ position: "absolute", bottom: 20, right: -5 }} />
													) : null}
													<Text mt="$2" fontSize={17} lineHeight={19} color="#1A1A1A" fontFamily="Roboto">
														{profile.name}
													</Text>
												</Pressable>
											) : (
												<Box
													width={secondaryCircleSize}
													height={secondaryCircleSize}
													borderRadius={secondaryCircleRadius}
													borderWidth={2}
													borderColor="#D7E1EA"
													bg="#F8FBFF"
													alignItems="center"
													justifyContent="center"
												>
													<Feather name="plus" size={24} color="#9DB6C8" />
												</Box>
											)}
										</Box>
									))}
								</Box>
							</Box>

							<Box mt="$3.5" style={{ paddingTop: 10 }}>
								<Box style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
									{/* Add action remains tappable to trigger warning when disabled. */}
									<Pressable
										onPress={handleAddProfile}
										style={{
											width: "100%",
											height: 56,
											borderRadius: 20,
											backgroundColor: isAddDisabled ? "#E5E7EB" : "#F1F3F7",
											flexDirection: "row",
											alignItems: "center",
											justifyContent: "center",
											gap: 8,
											opacity: isAddDisabled ? 0.85 : 1,
										}}
									>
										<Box
											style={{
												width: 28,
												height: 28,
												borderRadius: 14,
												backgroundColor: isAddDisabled ? "#B9BEC8" : "#7EC6EF",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<Feather name="plus" size={16} color="#FFFFFF" />
										</Box>
										<Text fontSize={17} lineHeight={19} color={isAddDisabled ? "#6B7280" : "#1A1A1A"} fontFamily="RobotoMedium" numberOfLines={1}>
											Add Profile
										</Text>
									</Pressable>
								</Box>
							</Box>
						</Box>
					</ModalBody>
				</ModalContent>
			</MotiView>
		</Modal>
	);
}
