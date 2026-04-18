import React from "react";
import { Alert, TextInput } from "react-native";
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
} from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";

type ChangeEmailProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (newEmail: string, password: string) => Promise<void>;
};

export default function ChangeEmail({
  isOpen,
  onClose,
  onSubmit,
}: ChangeEmailProps) {
  const [currentEmail, setCurrentEmail] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    currentEmail?: string;
    newEmail?: string;
    confirmEmail?: string;
    password?: string;
  }>({});

  React.useEffect(() => {
    if (!isOpen) {
      setCurrentEmail("");
      setNewEmail("");
      setConfirmEmail("");
      setPassword("");
      setErrors({});
      setIsClosing(false);
    }
  }, [isOpen]);

  const validateEmail = (email: string): string => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Please enter a valid email";
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const currentEmailError = validateEmail(currentEmail);
    if (currentEmailError) newErrors.currentEmail = currentEmailError;

    const newEmailError = validateEmail(newEmail);
    if (newEmailError) newErrors.newEmail = newEmailError;

    if (newEmail === currentEmail) {
      newErrors.newEmail = "New email must be different from current email";
    }

    if (newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Emails do not match";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required to confirm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      if (onSubmit) {
        await onSubmit(newEmail, password);
        Alert.alert("Success", "Your email has been updated successfully.");
        triggerClose();
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to update email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const triggerClose = React.useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 190);
  }, [isClosing, onClose]);

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    isPassword = false,
    error,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    isPassword?: boolean;
    error?: string;
  }) => (
    <VStack space="xs" mb="$3">
      <Text fontSize={13} lineHeight={18} fontFamily="RobotoMedium" color="#0F172A">
        {label}
      </Text>
      <Box
        borderWidth={1}
        borderColor={error ? "#EF4444" : "#E4ECF3"}
        borderRadius={12}
        backgroundColor="#FFFFFF"
        px="$3"
        py="$2.5"
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword}
          editable={!isLoading}
          style={{
            fontSize: 15,
            lineHeight: 20,
            color: "#0F172A",
            fontFamily: "Roboto",
          }}
        />
      </Box>
      {error ? (
        <Text fontSize={12} lineHeight={16} fontFamily="Roboto" color="#EF4444">
          {error}
        </Text>
      ) : null}
    </VStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={triggerClose}>
      <ModalBackdrop />
      <MotiView
        from={{ opacity: 0, translateY: 28 }}
        animate={
          isClosing ? { opacity: 0, translateY: 34 } : { opacity: 1, translateY: 0 }
        }
        transition={{ type: "timing", duration: 190 }}
        style={{ alignItems: "center", width: "100%", paddingHorizontal: 16 }}
      >
        <ModalContent
          bg="#FFFFFF"
          borderRadius={18}
          borderWidth={0}
          w="$full"
          maxWidth={380}
          px="$4"
          pt="$3"
          pb="$4"
        >
          <ModalHeader px="$0" pt="$0" pb="$3" alignItems="center" justifyContent="space-between">
            <Text fontSize={20} lineHeight={24} fontFamily="RobotoMedium" color="#0F172A">
              Change Email
            </Text>
            <ModalCloseButton p="$1" borderRadius="$full" onPress={triggerClose}>
              <Icon as={CloseIcon} size="md" color="#111111" />
            </ModalCloseButton>
          </ModalHeader>

          <ModalBody mx="$0" pb="$0">
            <Text
              fontSize={13}
              lineHeight={18}
              fontFamily="Roboto"
              color="#64748B"
              mb="$4"
            >
              Enter your current email, new email, and password to confirm this change.
            </Text>

            <InputField
              label="Current Email"
              value={currentEmail}
              onChangeText={setCurrentEmail}
              placeholder="your@email.com"
              error={errors.currentEmail}
            />

            <InputField
              label="New Email"
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="newemail@email.com"
              error={errors.newEmail}
            />

            <InputField
              label="Confirm New Email"
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              placeholder="newemail@email.com"
              error={errors.confirmEmail}
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              isPassword
              error={errors.password}
            />

            <HStack space="sm" mt="$6">
              <Pressable
                flex={1}
                onPress={triggerClose}
                disabled={isLoading}
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: "#E4ECF3",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFFFF",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                <Text
                  fontSize={15}
                  lineHeight={18}
                  fontFamily="RobotoMedium"
                  color="#0F172A"
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                flex={1}
                onPress={handleSubmit}
                disabled={isLoading}
                style={{
                  height: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isLoading ? "#A5E3E9" : "#1dd2d8",
                  opacity: isLoading ? 0.8 : 1,
                }}
              >
                {isLoading ? (
                  <Box style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Feather name="loader" size={16} color="#FFFFFF" />
                    <Text
                      fontSize={15}
                      lineHeight={18}
                      fontFamily="RobotoMedium"
                      color="#FFFFFF"
                    >
                      Updating...
                    </Text>
                  </Box>
                ) : (
                  <Text
                    fontSize={15}
                    lineHeight={18}
                    fontFamily="RobotoMedium"
                    color="#FFFFFF"
                  >
                    Update Email
                  </Text>
                )}
              </Pressable>
            </HStack>
          </ModalBody>
        </ModalContent>
      </MotiView>
    </Modal>
  );
}
