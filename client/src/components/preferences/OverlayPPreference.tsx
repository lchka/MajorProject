import React from "react";
import { useWindowDimensions } from "react-native";
import { MotiView } from "moti";
import Feather from "@expo/vector-icons/Feather";
import {
	Box,
	CloseIcon,
	HStack,
	Icon,
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	Pressable,
	ScrollView,
	Text,
} from "@gluestack-ui/themed";
import SwipeHandleButton from "../Buttons/SwipeHandleButton";

type PreferenceOption = {
	id: string;
	name: string;
};

type OverlayPPreferenceProps = {
	isOpen: boolean;
	onClose: () => void;
	preferences: PreferenceOption[];
	selectedPreferenceIds: string[];
	onSave: (preferenceIds: string[]) => Promise<void> | void;
};

export default function OverlayPPreference({
	isOpen,
	onClose,
	preferences,
	selectedPreferenceIds,
	onSave,
}: OverlayPPreferenceProps) {
	const { width: screenWidth } = useWindowDimensions();
	const [draftSelectedIds, setDraftSelectedIds] = React.useState<string[]>(
		selectedPreferenceIds
	);
	const [isSaving, setIsSaving] = React.useState(false);
	const [isClosing, setIsClosing] = React.useState(false);
	const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	React.useEffect(() => {
		// Reset draft selection whenever the modal opens so edits start from saved state.
		if (isOpen) {
			setDraftSelectedIds(selectedPreferenceIds);
			setIsSaving(false);
			setIsClosing(false);
		}
	}, [isOpen, selectedPreferenceIds]);

	React.useEffect(() => {
		// Clear delayed close timer to avoid state updates after unmount.
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	const selectedPreferences = React.useMemo(
		() => preferences.filter((item) => draftSelectedIds.includes(item.id)),
		[preferences, draftSelectedIds]
	);

	const togglePreference = (preferenceId: string) => {
		// Toggle selection in local draft; parent state updates only on save.
		setDraftSelectedIds((previous) =>
			previous.includes(preferenceId)
				? previous.filter((item) => item !== preferenceId)
				: [...previous, preferenceId]
		);
	};

	const triggerClose = React.useCallback(() => {
		if (isClosing) {
			return;
		}

		// Delay close slightly so exit animation can finish smoothly.
		setIsClosing(true);
		closeTimeoutRef.current = setTimeout(() => {
			onClose();
		}, 190);
	}, [isClosing, onClose]);

	const handleSave = async () => {
		try {
			// Persist draft changes to parent and then close modal.
			setIsSaving(true);
			await onSave(draftSelectedIds);
			triggerClose();
		} finally {
			setIsSaving(false);
		}
	};

	const modalMaxWidth = Math.min(420, Math.max(300, screenWidth - 32));

	return (
		<Modal isOpen={isOpen} onClose={triggerClose} closeOnOverlayClick>
			<ModalBackdrop />
			<MotiView
				from={{ opacity: 0, translateY: 28 }}
				animate={isClosing ? { opacity: 0, translateY: 34 } : { opacity: 1, translateY: 0 }}
				transition={{ type: "timing", duration: 190 }}
				style={{ alignItems: "center" }}
			>
				<ModalContent
					bg="#FFFFFF"
					borderRadius={18}
					borderWidth={0}
					w="$full"
					px="$3"
					pt="$3"
					pb="$4"
					alignSelf="center"
					overflow="hidden"
					style={{ maxWidth: modalMaxWidth }}
				>
					<ModalHeader
						px="$0"
						pt="$0"
						pb="$2"
						alignItems="center"
						justifyContent="center"
					>
						<HStack alignItems="center" justifyContent="center" w="$full" position="relative">
							<SwipeHandleButton onPress={triggerClose} onSwipeDown={triggerClose} />
							<ModalCloseButton position="absolute" right={0} p="$1" borderRadius="$full" onPress={triggerClose}>
								<Icon as={CloseIcon} size="md" color="#111111" />
							</ModalCloseButton>
						</HStack>
					</ModalHeader>

					<ModalBody mx="$0" pb="$0">
						<Text fontSize={24} lineHeight={28} fontFamily="RobotoMedium" color="#151515" mb="$2">
							All Preferences
						</Text>

						<Text fontSize={16} lineHeight={20} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
							Current Preferences
						</Text>

						<Box flexDirection="row" flexWrap="wrap" gap={10} mb="$4">
							{selectedPreferences.length > 0 ? (
								selectedPreferences.map((item) => (
									<Box
										key={`selected-${item.id}`}
										borderWidth={1}
										borderColor="#BFDDFC"
										bg="#EAF4FF"
										px="$3"
										py="$2"
										borderRadius={999}
									>
										<HStack alignItems="center" space="xs">
											<Feather name="check-circle" size={14} color="#0EA5E9" />
											<Text fontSize={14} lineHeight={18} fontFamily="RobotoMedium" color="#0F4C81">
												{item.name}
											</Text>
										</HStack>
									</Box>
								))
							) : (
								<Text fontSize={14} lineHeight={18} fontFamily="Roboto" color="#6B7280">
									No preferences selected yet.
								</Text>
							)}
						</Box>

						<Text fontSize={16} lineHeight={20} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
							Add / Remove Preferences
						</Text>

						<ScrollView showsVerticalScrollIndicator={false} maxHeight={280}>
							<Box flexDirection="row" py="$4" flexWrap="wrap" gap={10} pb="$2" justifyContent="space-between">
								{preferences.map((item) => {
									const selected = draftSelectedIds.includes(item.id);
									return (
										<Pressable
											key={item.id}
											onPress={() => togglePreference(item.id)}
											borderWidth={1.5}
											borderColor={selected ? "#38BDF8" : "#D8E2EE"}
											bg={selected ? "#E0F2FE" : "#F8FAFC"}
											borderRadius={16}
											px="$3"
											py="$3"
											width="48%"
											minHeight={56}
											justifyContent="center"
											shadowColor={selected ? "#38BDF8" : "#94A3B8"}
											shadowOpacity={selected ? 0.22 : 0.06}
											shadowRadius={selected ? 8 : 4}
											shadowOffset={{ width: 0, height: 2 }}
											elevation={selected ? 6 : 0}
										>
											<HStack alignItems="center" justifyContent="space-between">
												<Text
													fontSize={14}
													lineHeight={18}
													fontFamily="RobotoMedium"
													color={selected ? "#0F4C81" : "#1F2937"}
													flexShrink={1}
												>
													{item.name}
												</Text>
												<Box
													w={22}
													h={22}
													borderRadius={999}
													alignItems="center"
													justifyContent="center"
													bg={selected ? "#0EA5E9" : "#E2E8F0"}
												>
													<Feather
														name={selected ? "check" : "plus"}
														size={12}
														color={selected ? "#FFFFFF" : "#64748B"}
													/>
												</Box>
											</HStack>
										</Pressable>
									);
								})}
							</Box>
						</ScrollView>

						<Pressable
							mt="$4"
							bg={isSaving ? "#94A3B8" : "#0EA5E9"}
							borderRadius={12}
							py="$3"
							alignItems="center"
							onPress={handleSave}
							disabled={isSaving}
						>
							<Text fontSize={16} lineHeight={20} fontFamily="RobotoMedium" color="#FFFFFF">
								{isSaving ? "Saving..." : "Save Preferences"}
							</Text>
						</Pressable>
					</ModalBody>
				</ModalContent>
			</MotiView>
		</Modal>
	);
}
