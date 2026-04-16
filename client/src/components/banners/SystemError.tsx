import React from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ButtonText,
  Text,
  VStack,
  HStack,
  Icon,
  CloseIcon,
} from "@gluestack-ui/themed";

type SystemErrorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onReport?: () => void;
  title?: string;
  message?: string;
};

const SystemErrorModal: React.FC<SystemErrorModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onReport,
  title = "System Error",
  message = "Apologies for the inconvenience. Our team is actively working on fixing it.",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />

      <ModalContent
        borderRadius="$xl"
        padding="$4"
        bg="$backgroundLight0"
      >
        {/* Header */}
        <ModalHeader>
          <HStack justifyContent="space-between" alignItems="center" w="100%">
            <Text fontSize="$lg" fontWeight="$semibold">
              {title}
            </Text>

            <Button variant="link" onPress={onClose}>
              <Icon as={CloseIcon} />
            </Button>
          </HStack>
        </ModalHeader>

        {/* Body */}
        <ModalBody>
          <VStack space="sm">
            <Text color="$textLight500">
              {message}
            </Text>
          </VStack>
        </ModalBody>

        {/* Footer */}
        <ModalFooter>
          <HStack space="sm" justifyContent="flex-end" w="100%">
            <Button
              variant="outline"
              onPress={onRetry}
            >
              <ButtonText>Retry</ButtonText>
            </Button>

            <Button
              bg="$black"
              onPress={onReport}
            >
              <ButtonText color="$white">Report Issue</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SystemErrorModal;