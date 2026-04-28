import React from "react";
import {
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
import ValidationAnimation from "../general/ValidationAnimation";

type ChangeEmailProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (newEmail: string) => Promise<void>;
  currentEmail?: string;
};

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  editable = true,
  isLoading,
}: any) => (
  <VStack space="xs">
    <Text fontSize={13} fontFamily="RobotoMedium" color="#0F172A">
      {label}
    </Text>

    <Box
      borderWidth={1}
      borderColor={error ? "#F87171" : "#E6EEF5"}
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

    {error && (
      <Text fontSize={11} color="#F87171" fontFamily="Roboto">
        {error}
      </Text>
    )}
  </VStack>
);

export default function ChangeEmail({
  isOpen,
  onClose,
  onSubmit,
  currentEmail: currentEmailProp,
}: ChangeEmailProps) {
  const [currentEmail, setCurrentEmail] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [confirmEmail, setConfirmEmail] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const emailRules = [
    {
      id: "email-required",
      label: "Email is required",
      test: (value: string) => value.trim().length > 0,
    },
    {
      id: "email-format",
      label: "Valid email format",
      test: (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    },
  ];

  const confirmEmailRules = [
    {
      id: "match",
      label: "Emails do not match",
      test: (value: string) =>
        value.length > 0 && value === newEmail,
    },
  ];

  React.useEffect(() => {
    if (isOpen) {
      setCurrentEmail(currentEmailProp || "");
    } else {
      setCurrentEmail("");
      setNewEmail("");
      setConfirmEmail("");
      setIsClosing(false);
    }
  }, [isOpen, currentEmailProp]);

  const validateForm = () => {
    return (
      emailRules.every((rule) => rule.test(newEmail)) &&
      confirmEmailRules.every((rule) => rule.test(confirmEmail)) &&
      newEmail !== currentEmail
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fix the errors before continuing.");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit?.(newEmail.trim());
      Alert.alert("Success", "Email updated.");
      triggerClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerClose = () => {
  onClose();
};

  return (
    <Modal isOpen={isOpen} onClose={triggerClose}>
      <ModalBackdrop />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ width: "100%" }}
      >
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
                Change Email
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
                  Update your email.
                </Text>

                <VStack space="md">
                  <InputField
                    label="Current Email"
                    value={currentEmail}
                    onChangeText={() => {}}
                    editable={false}
                    isLoading={isLoading}
                  />

                  <VStack space="xs">
                    <InputField
                      label="New Email"
                      value={newEmail}
                      onChangeText={setNewEmail}
                      placeholder="new@email.com"
                      isLoading={isLoading}
                    />

                    {newEmail.length > 0 && (
                      <ValidationAnimation
                        value={newEmail}
                        rules={emailRules}
                        validColor="#10B981"
                        invalidColor="#DC2626"
                        validMessage="Email looks good"
                      />
                    )}
                  </VStack>

                  <VStack space="xs">
                    <InputField
                      label="Confirm Email"
                      value={confirmEmail}
                      onChangeText={setConfirmEmail}
                      placeholder="new@email.com"
                      isLoading={isLoading}
                    />

                    {confirmEmail.length > 0 && (
                      <ValidationAnimation
                        value={confirmEmail}
                        rules={confirmEmailRules}
                        validColor="#10B981"
                        invalidColor="#DC2626"
                      />
                    )}
                  </VStack>
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
      </KeyboardAvoidingView>
    </Modal>
  );
}