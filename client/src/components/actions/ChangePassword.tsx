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

type ChangePasswordProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<void>;
};

const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least 1 uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "At least 1 lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "At least 1 number",
    test: (value: string) => /\d/.test(value),
  },
  {
    id: "symbol",
    label: "At least 1 symbol",
    test: (value: string) => /[^A-Za-z\d]/.test(value),
  },
];

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
  const [errors, setErrors] = React.useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  React.useEffect(() => {
    if (!isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setIsClosing(false);
    }
  }, [isOpen]);

  const validatePasswordStrength = (password: string): boolean => {
    return PASSWORD_RULES.every((rule) => rule.test(password));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!validatePasswordStrength(newPassword)) {
      newErrors.newPassword =
        "Password must contain uppercase, lowercase, number, and symbol";
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
        await onSubmit(currentPassword, newPassword, confirmPassword);
        Alert.alert("Success", "Your password has been updated successfully.");
        triggerClose();
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to update password. Please try again."
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

  const PasswordRuleItem = ({
    rule,
    isValid,
  }: {
    rule: (typeof PASSWORD_RULES)[0];
    isValid: boolean;
  }) => (
    <HStack space="xs" alignItems="center" mb="$1">
      <Feather
        name={isValid ? "check-circle" : "circle"}
        size={16}
        color={isValid ? "#10B981" : "#D1D5DB"}
      />
      <Text
        fontSize={12}
        lineHeight={16}
        fontFamily="Roboto"
        color={isValid ? "#059669" : "#6B7280"}
      >
        {rule.label}
      </Text>
    </HStack>
  );

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
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
          secureTextEntry
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
              Change Password
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
              Enter your current password and a new secure password to update your account.
            </Text>

            <InputField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              error={errors.currentPassword}
            />

            <InputField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              error={errors.newPassword}
            />

            {newPassword ? (
              <VStack space="xs" mb="$3" p="$3" bg="#F8FAFC" borderRadius={12}>
                <Text
                  fontSize={12}
                  lineHeight={16}
                  fontFamily="RobotoMedium"
                  color="#4B5563"
                  mb="$1"
                >
                  Password Requirements:
                </Text>
                {PASSWORD_RULES.map((rule) => (
                  <PasswordRuleItem
                    key={rule.id}
                    rule={rule}
                    isValid={rule.test(newPassword)}
                  />
                ))}
              </VStack>
            ) : null}

            <InputField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              error={errors.confirmPassword}
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
                    Update Password
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
