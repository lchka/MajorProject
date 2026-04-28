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
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";

type ChangeEmailProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (
    currentEmail: string,
    newEmail: string,
    password: string,
  ) => Promise<void>;
  currentEmail?: string;
};

//
// ✅ INPUT COMPONENT (with eye toggle support)
//
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  isPassword = false,
  error,
  editable = true,
  isLoading,
  secureTextEntry,
  onToggleSecure,
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
      style={{ flexDirection: "row", alignItems: "center" }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        secureTextEntry={isPassword ? secureTextEntry : false}
        editable={editable && !isLoading}
        style={{
          flex: 1,
          fontSize: 15,
          color: "#0F172A",
          fontFamily: "Roboto",
        }}
      />

      {isPassword && (
        <Pressable onPress={onToggleSecure}>
          <Feather
            name={secureTextEntry ? "eye-off" : "eye"}
            size={18}
            color="#64748B"
          />
        </Pressable>
      )}
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
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [errors, setErrors] = React.useState<any>({});

  React.useEffect(() => {
    if (isOpen) {
      setCurrentEmail(currentEmailProp || "");
    } else {
      setCurrentEmail("");
      setNewEmail("");
      setConfirmEmail("");
      setPassword("");
      setErrors({});
      setIsClosing(false);
      setShowPassword(false);
    }
  }, [isOpen, currentEmailProp]);

  const validateEmail = (email: string) => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Invalid email";
    return "";
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (validateEmail(newEmail)) newErrors.newEmail = "Invalid";

    if (newEmail === currentEmail) {
      newErrors.newEmail = "Must be different";
    }

    if (newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Doesn't match";
    }

    if (!password.trim()) {
      newErrors.password = "Required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onSubmit?.(currentEmail, newEmail.trim(), password);
      Alert.alert("Success", "Email updated.");
      triggerClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerClose = React.useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 180);
  }, [isClosing, onClose]);

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
                  Update your email securely.
                </Text>

                <VStack space="md">
                  <InputField
                    label="Current Email"
                    value={currentEmail}
                    onChangeText={() => {}}
                    editable={false}
                    isLoading={isLoading}
                  />

                  <InputField
                    label="New Email"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="new@email.com"
                    error={errors.newEmail}
                    isLoading={isLoading}
                  />

                  <InputField
                    label="Confirm Email"
                    value={confirmEmail}
                    onChangeText={setConfirmEmail}
                    placeholder="new@email.com"
                    error={errors.confirmEmail}
                    isLoading={isLoading}
                  />

                  <InputField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    isPassword
                    secureTextEntry={!showPassword}
                    onToggleSecure={() => setShowPassword((prev) => !prev)}
                    error={errors.password}
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
                    {isLoading ? (
                      <Feather name="loader" size={16} color="#fff" />
                    ) : (
                      <Text color="#fff" fontFamily="RobotoMedium">
                        Update
                      </Text>
                    )}
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