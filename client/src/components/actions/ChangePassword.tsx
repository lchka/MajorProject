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
// Component for changing the user's password, with form validation and loading states. It uses a modal to display the form, and includes input fields for the current password, new password, and confirm password, along with validation rules for each field. The component also handles form submission and displays success or error alerts based on the outcome.
type ChangePasswordProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<void>;
};
// Validation rules for the new password field, including length, uppercase, lowercase, number, and symbol requirements
const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "1 uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "1 lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "1 number",
    test: (value: string) => /\d/.test(value),
  },
  {
    id: "symbol",
    label: "1 symbol",
    test: (value: string) => /[^A-Za-z\d]/.test(value),
  },
];
// Validation rules for the confirm password field, which checks that the field is not empty and matches the new password
export default function ChangePassword({
  isOpen,
  onClose,
  onSubmit,
}: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const confirmRules = [
    {
      id: "match",
      label: "Passwords match",
      test: (value: string) =>
        value.length > 0 && value === newPassword,
    },
  ];

  React.useEffect(() => {
    if (!isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsClosing(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    return (
      currentPassword.length > 0 &&
      PASSWORD_RULES.every((rule) => rule.test(newPassword)) &&
      confirmRules.every((rule) => rule.test(confirmPassword)) &&
      newPassword !== currentPassword
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fix the errors before continuing.");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit?.(currentPassword, newPassword, confirmPassword);
      Alert.alert("Success", "Password updated.");
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

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
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
        bg="#FFFFFF"
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry
          editable={!isLoading}
          style={{
            fontSize: 15,
            color: "#0F172A",
            fontFamily: "Roboto",
          }}
        />
      </Box>
    </VStack>
  );

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
                Change Password
              </Text>

              <ModalCloseButton onPress={triggerClose}>
                <Icon as={CloseIcon} size="md" />
              </ModalCloseButton>
            </ModalHeader>

            <ModalBody px="$0">
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text fontSize={13} color="#64748B" mb="$5">
                  Update your password.
                </Text>

                <VStack space="md">
                  <InputField
                    label="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Current password"
                  />

                  <VStack space="xs">
                    <InputField
                      label="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="New password"
                    />

                    {newPassword.length > 0 && (
                      <ValidationAnimation
                        value={newPassword}
                        rules={PASSWORD_RULES}
                        validColor="#10B981"
                        invalidColor="#DC2626"
                      />
                    )}
                  </VStack>

                  <VStack space="xs">
                    <InputField
                      label="Confirm Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm password"
                    />

                    {confirmPassword.length > 0 && (
                      <ValidationAnimation
                        value={confirmPassword}
                        rules={confirmRules}
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