import React from "react";
import { MotiView } from "moti";
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
  ScrollView,
  Text,
} from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { conditionIngredientData, IngredientInfo } from "./conditionIngredientData";
import SwipeHandleButton from "../Buttons/SwipeHandleButton";

type SingleConditionProps = {
	isOpen: boolean;
	conditionName?: string;
	conditionDescription?: string;
	onClose: () => void;
};

export default function SingleCondition({
	isOpen,
	conditionName,
	conditionDescription,
	onClose,
}: SingleConditionProps) {
	const [isClosing, setIsClosing] = React.useState(false);
	const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	React.useEffect(() => {
		if (isOpen) {
			setIsClosing(false);
		}
	}, [isOpen]);

	React.useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	const triggerClose = React.useCallback(() => {
		if (isClosing) {
			return;
		}

		setIsClosing(true);
		closeTimeoutRef.current = setTimeout(() => {
			onClose();
		}, 190);
	}, [isClosing, onClose]);

	const title = conditionName?.trim() || "Condition";
	const description =
		conditionDescription?.trim() ||
		"No description is available for this condition yet.";

	// Get soothing and warning ingredients for this condition
	// Use as keyof to avoid TS error
	const ingredientInfo =
		(title && conditionIngredientData[title as keyof typeof conditionIngredientData]) || undefined;
	const soothing: IngredientInfo[] = ingredientInfo?.soothing || [];
	const warning: IngredientInfo[] = ingredientInfo?.warning || [];

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
						borderWidth={0}
						borderRadius={16}
						// w="$10" // Remove this!
						style={{ width: 320, maxWidth: 360, minWidth: 280, maxHeight: 480, alignSelf: "center" }}
					>
						<ModalHeader px="$3" pt="$2" pb="$1" alignItems="center" justifyContent="center">
							<HStack alignItems="center" justifyContent="center" w="$full" position="relative">
								<SwipeHandleButton onPress={triggerClose} onSwipeDown={triggerClose} />
								<ModalCloseButton
									position="absolute"
									right={0}
									onPress={triggerClose}
									p="$1"
									borderRadius="$full"
								>
									<Icon as={CloseIcon} size="md" color="#111111" />
								</ModalCloseButton>
							</HStack>
						</ModalHeader>

						<ModalBody px="$3" pb="$3" pt="$0" style={{ width: "100%" }}>
							<Text
								fontSize={18}
								lineHeight={20}
								fontFamily="RobotoMedium"
								color="#111111"
								mb="$2"
							>
								{title}
							</Text>
							<Box
								borderWidth={1}
								borderColor="#DCE5EF"
								borderRadius={12}
								bg="#F8FBFF"
								px="$3"
								py="$2"
								mb={soothing.length > 0 || warning.length > 0 ? "$2" : 0}
								style={{ maxHeight: 120 }}
							>
								<ScrollView showsVerticalScrollIndicator={false}>
									<Text fontSize={14} lineHeight={20} fontFamily="Roboto" color="#344256">
										{description}
									</Text>
								</ScrollView>
							</Box>

							{/* Soothing Ingredients Section */}
							{soothing.length > 0 && (
								<Box mt="$2">
									<Text fontSize={14} fontFamily="RobotoMedium" color="#2E7D32" mb="$1">
										Soothing Ingredients
									</Text>
									<ScrollView style={{ maxHeight: 110 }} showsVerticalScrollIndicator={false}>
										{soothing.map((item: IngredientInfo, idx: number) => (
											<HStack key={item.name} alignItems="flex-start" space="sm" mb={idx === soothing.length - 1 ? 0 : "$1"}>
												<Feather name={"leaf" as any} size={16} color="#2E7D32" style={{ marginTop: 2 }} />
												<Box flex={1}>
													<Text fontSize={13} color="#2E7D32" fontFamily="RobotoMedium">
														{item.name}
													</Text>
													<Text fontSize={12} color="#344256" fontFamily="Roboto">
														{item.explanation}
													</Text>
												</Box>
											</HStack>
										))}
									</ScrollView>
								</Box>
							)}

							{/* Warning Ingredients Section */}
							{warning.length > 0 && (
								<Box mt="$2">
									<Text fontSize={14} fontFamily="RobotoMedium" color="#CB3A52" mb="$1">
										Warning Ingredients
									</Text>
									<ScrollView style={{ maxHeight: 110 }} showsVerticalScrollIndicator={false}>
										{warning.map((item: IngredientInfo, idx: number) => (
											<HStack key={item.name} alignItems="flex-start" space="sm" mb={idx === warning.length - 1 ? 0 : "$1"}>
												<Feather name={"alert-triangle" as any} size={16} color="#CB3A52" style={{ marginTop: 2 }} />
												<Box flex={1}>
													<Text fontSize={13} color="#CB3A52" fontFamily="RobotoMedium">
														{item.name}
													</Text>
													<Text fontSize={12} color="#344256" fontFamily="Roboto">
														{item.explanation}
													</Text>
												</Box>
											</HStack>
										))}
									</ScrollView>
								</Box>
							)}
						</ModalBody>
					</ModalContent>
				</MotiView>
			</Modal>
		);
}
