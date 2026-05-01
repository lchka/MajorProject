import React from "react";
import type { ImageSourcePropType } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import {
	Box,
	Button,
	ButtonText,
	Heading,
	Image,
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
	ModalHeader,
	Pressable,
	Text,
} from "@gluestack-ui/themed";
// Component for managing the selection of profiles for evaluation in a modal interface. The component allows users to select between 1 and 3 profiles from a provided list, with an optional default profile pre-selected. It provides visual feedback on the selected profiles and includes buttons for submitting the selection or canceling the action. The component is designed to be flexible and can be used in various contexts where profile selection is needed for evaluation purposes.
export type EvaluationProfileItem = {
	id: string;
	name: string;
	avatarSource?: ImageSourcePropType;
	isMain?: boolean;
};

type EvaluationProfileProps = {
	isOpen: boolean;
	onClose: () => void;
	profiles: EvaluationProfileItem[];
	defaultProfileId?: string;
	onSubmit: (profileIds: string[]) => void;
	title?: string;
};

function getInitials(name: string) {
	const trimmed = name.trim();
	if (!trimmed) {
		return "?";
	}

	const [first, second] = trimmed.split(/\s+/);
	if (!second) {
		return first.charAt(0).toUpperCase();
	}

	return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}

export default function EvaluationProfile({
	isOpen,
	onClose,
	profiles,
	defaultProfileId,
	onSubmit,
	title = "Profiles for Evaluation",
}: EvaluationProfileProps) {
	const resolvedDefaultProfileId = React.useMemo(() => {
		if (defaultProfileId && profiles.some((profile) => profile.id === defaultProfileId)) {
			return defaultProfileId;
		}

		return profiles[0]?.id;
	}, [defaultProfileId, profiles]);

	const [selectedProfileIds, setSelectedProfileIds] = React.useState<string[]>([]);
	const maxEvaluationProfiles = 3;

	React.useEffect(() => {
		if (!isOpen) {
			return;
		}

		setSelectedProfileIds(resolvedDefaultProfileId ? [resolvedDefaultProfileId] : []);
	}, [isOpen, resolvedDefaultProfileId]);

	const toggleProfile = React.useCallback(
		(profileId: string) => {
			setSelectedProfileIds((previous) => {
				const currentlySelected = previous.includes(profileId);
				if (currentlySelected) {
					if (previous.length === 1) {
						return previous;
					}

					return previous.filter((id) => id !== profileId);
				}

				if (previous.length >= maxEvaluationProfiles) {
					return previous;
				}

				return [...previous, profileId];
			});
		},
		[maxEvaluationProfiles],
	);

	return (
		<Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick>
			<ModalBackdrop />
			<ModalContent
				borderRadius={18}
				borderWidth={0}
				bg="#FFFFFF"
				px="$4"
				pt="$3"
				pb="$4"
				w="$full"
				maxWidth={560}
				shadowColor="#000000"
				shadowOpacity={0.08}
				shadowRadius={18}
				shadowOffset={{ width: 0, height: 8 }}
				elevation={12}
			>
				<Box alignItems="center" pb="$2">
					<Box width={42} height={5} borderRadius={999} bg="#D7D7D7" />
				</Box>

				<ModalHeader px="$1" pt="$1" pb="$2">
					<Box>
						<Heading size="lg" color="#111111" fontWeight="$normal">
							{title}
						</Heading>
						<Text mt="$1" fontSize={13} lineHeight={18} color="#6B7280">
							Select between 1 and 3 profiles for this evaluation.
						</Text>
					</Box>
				</ModalHeader>

				<ModalBody p="$0">
					<Box
						borderWidth={1}
						borderColor="#E6E9EE"
						borderRadius={20}
						bg="#FFFFFF"
						px="$3"
						py="$3"
						shadowColor="#000000"
						shadowOpacity={0.06}
						shadowRadius={10}
						shadowOffset={{ width: 0, height: 4 }}
						elevation={2}
					>
						{profiles.map((profile) => {
							const isDefault = profile.id === resolvedDefaultProfileId;
							const isSelected = selectedProfileIds.includes(profile.id);

							return (
								<Pressable
									key={profile.id}
									onPress={() => {
										toggleProfile(profile.id);
									}}
									mb="$2"
									px="$3"
									py="$2"
									borderRadius={14}
									borderWidth={1.5}
									borderColor={isSelected ? "#7EC6EF" : "#D7E1EA"}
									bg={isSelected ? "#F2FAFF" : "#FFFFFF"}
									flexDirection="row"
									alignItems="center"
									justifyContent="space-between"
								>
									<Box flexDirection="row" alignItems="center">
										<Box
											width={44}
											height={44}
											borderRadius={22}
											overflow="hidden"
											bg="#F4FBFF"
											borderWidth={1.5}
											borderColor="#CDE7F6"
											alignItems="center"
											justifyContent="center"
										>
											{profile.avatarSource ? (
												<Image
													source={profile.avatarSource}
													alt={`${profile.name} avatar`}
													style={{ width: "100%", height: "100%" }}
													resizeMode="cover"
												/>
											) : (
												<Text fontSize={17} lineHeight={17} color="#58CCED" fontFamily="RobotoMedium">
													{getInitials(profile.name)}
												</Text>
											)}
										</Box>

										<Box ml="$3">
											<Text fontSize={16} lineHeight={20} color="#1A1A1A" fontFamily="RobotoMedium">
												{profile.name}
											</Text>
											{isDefault ? (
												<Text mt="$0.5" fontSize={12} lineHeight={16} color="#3B95C8" fontFamily="Roboto">
													Default for this scan
												</Text>
											) : null}
										</Box>
									</Box>

									<Box
										width={24}
										height={24}
										borderRadius={12}
										borderWidth={1.5}
										borderColor={isSelected ? "#2E96CB" : "#B8C6D2"}
										bg={isSelected ? "#2E96CB" : "#FFFFFF"}
										alignItems="center"
										justifyContent="center"
									>
										{isSelected ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
									</Box>
								</Pressable>
							);
						})}
					</Box>

					<Box mt="$4" flexDirection="row" justifyContent="space-between" alignItems="center">
						<Button
							variant="outline"
							borderColor="#C8D7E4"
							borderWidth={1.5}
							borderRadius={14}
							bg="#FFFFFF"
							px="$5"
							h={46}
							onPress={onClose}
						>
							<ButtonText color="#445669" fontFamily="RobotoMedium">
								Cancel
							</ButtonText>
						</Button>

						<Button
							bg="#47A6E0"
							borderRadius={14}
							px="$5"
							h={46}
							disabled={selectedProfileIds.length === 0}
							opacity={selectedProfileIds.length === 0 ? 0.55 : 1}
							onPress={() => {
								if (selectedProfileIds.length > 0) {
									onSubmit(selectedProfileIds);
								}
							}}
						>
							<ButtonText color="#FFFFFF" fontFamily="RobotoMedium">
								{selectedProfileIds.length > 1 ? `Send ${selectedProfileIds.length} Evaluations` : "Send Evaluation"}
							</ButtonText>
						</Button>
					</Box>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
