import React from "react";
import { Box, Icon, Image, Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader, Pressable, ScrollView, Text, CloseIcon } from "@gluestack-ui/themed";

type PreferenceOption = {
	id: string;
	name: string;
};
// Component for managing user preferences in a modal interface. It allows users to view their current preferences, add new ones from a list of available options, and save their changes. The component handles the state of selected preferences, provides visual feedback for selected items, and manages the saving process with loading states and error handling.
type AddPreferenceProps = {
	isOpen: boolean;
	onClose: () => void;
	availablePreferences: PreferenceOption[];
	selectedPreferenceIds: string[];
	onSave: (preferenceIds: string[]) => Promise<void> | void;
};

const preferenceImageByKey: Record<string, number> = {
	"alcohol free": require("../../../assets/preferences/alcohol-free.png"),
	"non comedogenic": require("../../../assets/preferences/comedogenic.png"),
	comedogenic: require("../../../assets/preferences/comedogenic.png"),
	"cruelty free": require("../../../assets/preferences/cruelty-free (1).png"),
	eco: require("../../../assets/preferences/eco.png"),
	"fragrance free": require("../../../assets/preferences/fragrance-free.png"),
	hypoallergenic: require("../../../assets/preferences/hypoallergenic.png"),
	hypoallergenice: require("../../../assets/preferences/hypoallergenic.png"),
	organic: require("../../../assets/preferences/organic.png"),
	"paraben free": require("../../../assets/preferences/paraben-free.png"),
	"sulfate free": require("../../../assets/preferences/sulfate-free.png"),
	"sulphate free": require("../../../assets/preferences/sulfate-free.png"),
	vegan: require("../../../assets/preferences/vegan (1).png"),
};

function normalizeName(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getPreferenceImageSource(name: string) {
	const key = normalizeName(name);
	return preferenceImageByKey[key] ?? require("../../../assets/preferences/eco.png");
}

export default function AddPreference({
	isOpen,
	onClose,
	availablePreferences,
	selectedPreferenceIds,
	onSave,
}: AddPreferenceProps) {
	const [draftSelectedIds, setDraftSelectedIds] = React.useState<string[]>(selectedPreferenceIds);
	const [isSaving, setIsSaving] = React.useState(false);

	React.useEffect(() => {
		if (isOpen) {
			setDraftSelectedIds(selectedPreferenceIds);
			setIsSaving(false);
		}
	}, [isOpen, selectedPreferenceIds]);

	const selectedPreferences = React.useMemo(
		() => availablePreferences.filter((item) => draftSelectedIds.includes(item.id)),
		[availablePreferences, draftSelectedIds],
	);

	const togglePreference = (preferenceId: string) => {
		setDraftSelectedIds((previous) =>
			previous.includes(preferenceId)
				? previous.filter((item) => item !== preferenceId)
				: [...previous, preferenceId],
		);
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			await onSave(draftSelectedIds);
			onClose();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick>
			<ModalBackdrop />
			<ModalContent
				bg="#FFFFFF"
				borderRadius={18}
				borderWidth={0}
				w="$full"
				maxWidth={390}
				px="$4"
				pt="$3"
				pb="$4"
			>
				<ModalHeader px="$0" pt="$0" pb="$2" alignItems="center" justifyContent="space-between">
					<Text fontSize={20} lineHeight={22} fontFamily="RobotoMedium" color="#151515">
						Manage Preferences
					</Text>
					<ModalCloseButton p="$1" borderRadius="$full" onPress={onClose}>
						<Icon as={CloseIcon} size="md" color="#111111" />
					</ModalCloseButton>
				</ModalHeader>

				<ModalBody px="$0" pb="$0">
					<Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
						Current Preferences
					</Text>

					<Box flexDirection="row" flexWrap="wrap" gap={8} mb="$4">
						{selectedPreferences.length > 0 ? (
							selectedPreferences.map((item) => (
								<Box key={`selected-${item.id}`} borderWidth={1} borderColor="#BFDBFE" bg="#EFF6FF" px="$3" py="$1.5" borderRadius={999}>
									<Text fontSize={12} lineHeight={14} fontFamily="RobotoMedium" color="#1D4ED8">
										{item.name}
									</Text>
								</Box>
							))
						) : (
							<Text fontSize={12} lineHeight={14} fontFamily="Roboto" color="#6B7280">
								No preferences selected yet.
							</Text>
						)}
					</Box>

					<Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
						Add / Remove Preferences
					</Text>

					<ScrollView showsVerticalScrollIndicator={false} maxHeight={280}>
						<Box flexDirection="row" flexWrap="wrap" gap={10} pb="$2">
							{availablePreferences.map((item) => {
								const selected = draftSelectedIds.includes(item.id);
								return (
									<Pressable
										key={item.id}
										onPress={() => togglePreference(item.id)}
										borderWidth={2}
										borderColor={selected ? "#38BDF8" : "#E5E7EB"}
										bg={selected ? "#E0F2FE" : "#FFFFFF"}
										borderRadius={14}
										p="$2"
										width={108}
										alignItems="center"
										shadowColor={selected ? "#38BDF8" : "transparent"}
										shadowOpacity={selected ? 0.45 : 0}
										shadowRadius={selected ? 10 : 0}
										shadowOffset={{ width: 0, height: 0 }}
										elevation={selected ? 6 : 0}
									>
										<Image
											source={getPreferenceImageSource(item.name)}
											alt={`${item.name} preference`}
											resizeMode="contain"
											style={{ width: 48, height: 48 }}
										/>
										<Text mt="$1.5" textAlign="center" fontSize={11} lineHeight={12} fontFamily="RobotoMedium" color="#111827">
											{item.name}
										</Text>
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
						<Text fontSize={14} lineHeight={16} fontFamily="RobotoMedium" color="#FFFFFF">
							{isSaving ? "Saving..." : "Save Preferences"}
						</Text>
					</Pressable>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
