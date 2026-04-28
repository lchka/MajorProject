import React from "react";
import { TextInput } from "react-native";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  Pressable,
  Icon,
  CloseIcon,
  HStack,
  VStack,
  ScrollView,
} from "@gluestack-ui/themed";
import { MotiView } from "moti";

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  isLoading,
}: any) => (
  <VStack space="xs">
    <Text fontSize={13} fontFamily="RobotoMedium" color="#0F172A">
      {label}
    </Text>

    <Box
      borderWidth={1}
      borderColor="#E6EEF5"
      borderRadius={14}
      px="$3"
      height={48}
      justifyContent="center"
      bg={editable ? "#FFFFFF" : "#F1F5F9"}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        editable={editable && !isLoading}
        style={{
          fontSize: 15,
          color: "#0F172A",
          fontFamily: "Roboto",
        }}
      />
    </Box>
  </VStack>
);

type ChangeNameProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (firstName: string, lastName: string) => Promise<void>;
  currentFirstName?: string;
  currentLastName?: string;
};

export default function ChangeName({
  isOpen,
  onClose,
  onSubmit,
  currentFirstName,
  currentLastName,
}: ChangeNameProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const initialisedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen) {
      initialisedRef.current = false;
      return;
    }

    if (!initialisedRef.current) {
      setFirstName(currentFirstName || "");
      setLastName(currentLastName || "");
      setIsClosing(false);
      initialisedRef.current = true;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const triggerClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 180);
  }, [onClose]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await onSubmit?.(firstName.trim(), lastName.trim());
      triggerClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />

      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={
          isClosing
            ? { opacity: 0, translateY: 30 }
            : { opacity: 1, translateY: 0 }
        }
        transition={{ duration: 180 }}
        style={{
          alignItems: "center",
          width: "100%",
          paddingHorizontal: 16,
        }}
      >
        <ModalContent
          bg="#FFFFFF"
          borderRadius={20}
          w="$full"
          maxWidth={380}
          px="$5"
          pt="$4"
          pb="$4"
        >
          <ModalHeader px="$0" pb="$3" justifyContent="space-between">
            <Text fontSize={20} fontFamily="RobotoMedium">
              Change Name
            </Text>

            <ModalCloseButton onPress={triggerClose}>
              <Icon as={CloseIcon} size="md" />
            </ModalCloseButton>
          </ModalHeader>

          <ModalBody px="$0">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text fontSize={13} color="#64748B" mb="$5">
                Update your name.
              </Text>

              <VStack space="md">
                {/* CURRENT VALUES */}
                <InputField
                  label="Current First Name"
                  value={currentFirstName || ""}
                  onChangeText={() => {}}
                  editable={false}
                  isLoading={isLoading}
                />

                <InputField
                  label="Current Last Name"
                  value={currentLastName || ""}
                  onChangeText={() => {}}
                  editable={false}
                  isLoading={isLoading}
                />

                {/* NEW VALUES */}
                <InputField
                  label="New First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  isLoading={isLoading}
                />

                <InputField
                  label="New Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  isLoading={isLoading}
                />
              </VStack>

              <HStack space="sm" mt="$6">
                <Pressable
                  flex={1}
                  onPress={triggerClose}
                  disabled={isLoading}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#E6EEF5",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text fontFamily="RobotoMedium">Cancel</Text>
                </Pressable>

                <Pressable
                  flex={1}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isLoading ? "#A5E3E9" : "#1dd2d8",
                  }}
                >
                  <Text color="#fff" fontFamily="RobotoMedium">
                    {isLoading ? "Updating..." : "Update"}
                  </Text>
                </Pressable>
              </HStack>
            </ScrollView>
          </ModalBody>
        </ModalContent>
      </MotiView>
    </Modal>
  );
}
