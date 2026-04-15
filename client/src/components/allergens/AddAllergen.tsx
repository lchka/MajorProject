import React from "react";
import { useWindowDimensions } from "react-native";
import { MotiView } from "moti";
import {
	Box,
	CloseIcon,
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
	ScrollView,
	Text,
} from "@gluestack-ui/themed";
import SwipeHandleButton from "../Buttons/SwipeHandleButton";

type AllergenOption = {
	id: string;
	name: string;
};

type AddAllergenProps = {
	isOpen: boolean;
	onClose: () => void;
	availableAllergens: AllergenOption[];
	selectedAllergenIds: string[];
	onSave: (allergenIds: string[]) => Promise<void> | void;
};

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

const allergenImageByKey: Record<string, number> = {
	balsam: require("../../../assets/allergens/balsam.png"),
	cocamidopropylbetaine: require("../../../assets/allergens/Cocamidopropyl-Betaine.png"),
	formaldehyde: require("../../../assets/allergens/formaldehyde.png"),
	fragrance: require("../../../assets/allergens/fragrance.png"),
	lanolin: require("../../../assets/allergens/lanolin.png"),
	nickel: require("../../../assets/allergens/nickel.png"),
	paraben: require("../../../assets/allergens/paraben.png"),
	ppd: require("../../../assets/allergens/ppd.png"),
	phenylenediamine: require("../../../assets/allergens/ppd.png"),
	preservative: require("../../../assets/allergens/preservative.png"),
	mcimi: require("../../../assets/allergens/preservative.png"),
	propyleneglycol: require("../../../assets/allergens/Propylene Glycol.png"),
};

function normalizeName(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function getAllergenImageSource(name: string) {
	const key = normalizeName(name);

	for (const [token, source] of Object.entries(allergenImageByKey)) {
		if (key.includes(token)) {
			return source;
		}
	}

	return require("../../../assets/allergens/fragrance.png");
}

export default function AddAllergen({
	isOpen,
	onClose,
	availableAllergens,
	selectedAllergenIds,
	onSave,
}: AddAllergenProps) {
	const { width: screenWidth } = useWindowDimensions();
	const [draftSelectedIds, setDraftSelectedIds] = React.useState<string[]>(() => uniqueIds(selectedAllergenIds));
	const [isSaving, setIsSaving] = React.useState(false);
	const [isClosing, setIsClosing] = React.useState(false);
	const [hasSubmitted, setHasSubmitted] = React.useState(false);
	const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	React.useEffect(() => {
		if (isOpen) {
			setDraftSelectedIds(uniqueIds(selectedAllergenIds));
			setIsSaving(false);
			setIsClosing(false);
			setHasSubmitted(false);
		}
	}, [isOpen, selectedAllergenIds]);

	React.useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	const selectedAllergens = React.useMemo(
		() => availableAllergens.filter((item) => draftSelectedIds.includes(item.id)),
		[availableAllergens, draftSelectedIds],
	);

	const toggleAllergen = (allergenId: string) => {
		setDraftSelectedIds((previous) =>
			previous.includes(allergenId)
				? previous.filter((item) => item !== allergenId)
				: uniqueIds([...previous, allergenId]),
		);
	};

	const handleSave = async () => {
		if (isSaving || isClosing || hasSubmitted) {
			return;
		}

		const dedupedIds = uniqueIds(draftSelectedIds);

		try {
			setIsSaving(true);
			setHasSubmitted(true);
			await onSave(dedupedIds);
			triggerClose();
		} catch {
			setHasSubmitted(false);
		} finally {
			setIsSaving(false);
		}
	};

	const triggerClose = React.useCallback(() => {
		if (isClosing) {
			return;
		}

		setIsClosing(true);
		closeTimeoutRef.current = setTimeout(() => {
			onClose();
		}, 190);
	}, [isClosing, onClose]);

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
				<ModalContent bg="#FFFFFF" borderRadius={18} borderWidth={0} w="$full" px="$4" pt="$3" pb="$4" style={{ maxWidth: modalMaxWidth }}>
					<ModalHeader px="$0" pt="$0" pb="$2" alignItems="center" justifyContent="center">
						<HStack alignItems="center" justifyContent="center" w="$full" position="relative">
							<SwipeHandleButton onPress={triggerClose} onSwipeDown={triggerClose} />
							<ModalCloseButton position="absolute" right={0} p="$1" borderRadius="$full" onPress={triggerClose}>
								<Icon as={CloseIcon} size="md" color="#111111" />
							</ModalCloseButton>
						</HStack>
					</ModalHeader>

					<ModalBody px="$0" pb="$0">
						<Text fontSize={20} lineHeight={22} fontFamily="RobotoMedium" color="#151515" mb="$2">
							Manage Allergens
						</Text>
					<Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
						Current Allergens
					</Text>

					<Box flexDirection="row" flexWrap="wrap" gap={8} mb="$4">
						{selectedAllergens.length > 0 ? (
							selectedAllergens.map((item) => (
								<Box key={`selected-${item.id}`} borderWidth={1} borderColor="#BFDBFE" bg="#EFF6FF" px="$3" py="$1.5" borderRadius={999}>
									<Text fontSize={12} lineHeight={14} fontFamily="RobotoMedium" color="#1D4ED8">
										{item.name}
									</Text>
								</Box>
							))
						) : (
							<Text fontSize={12} lineHeight={14} fontFamily="Roboto" color="#6B7280">
								No allergens selected yet.
							</Text>
						)}
					</Box>

					<Text fontSize={13} lineHeight={16} fontFamily="RobotoMedium" color="#4B5563" mb="$2">
						Add / Remove Allergens
					</Text>

					<ScrollView showsVerticalScrollIndicator={false} maxHeight={280}>
						<Box flexDirection="row" flexWrap="wrap" gap={10} pb="$2">
							{availableAllergens.map((item) => {
								const selected = draftSelectedIds.includes(item.id);
								return (
									<Pressable
										key={item.id}
										onPress={() => toggleAllergen(item.id)}
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
											source={getAllergenImageSource(item.name)}
											alt={`${item.name} allergen`}
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

					<Pressable mt="$4" bg={isSaving || isClosing || hasSubmitted ? "#94A3B8" : "#0EA5E9"} borderRadius={12} py="$3" alignItems="center" onPress={handleSave} disabled={isSaving || isClosing || hasSubmitted}>
						<Text fontSize={14} lineHeight={16} fontFamily="RobotoMedium" color="#FFFFFF">
							{isSaving || isClosing || hasSubmitted ? "Saving..." : "Save Allergens"}
						</Text>
					</Pressable>
					</ModalBody>
				</ModalContent>
			</MotiView>
		</Modal>
	);
}
