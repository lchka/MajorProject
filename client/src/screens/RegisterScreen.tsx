// React & Gluestack imports
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  Box,
  Button,
  ButtonText,
  Divider,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import { authService } from "../services";
import { registerSchema } from "../models/auth.schema";
import { AuthStackParamList } from "../types/navigation";

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const result = registerSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      c_password: confirmPassword,
    });

    if (!result.success) {
      const errors = result.error.issues.map((err) => err.message).join("\n");
      Alert.alert("Validation Error", errors);
      return;
    }

    try {
      setLoading(true);

      const response = await authService.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.toLowerCase().trim(),
        password,
        c_password: confirmPassword,
      });

      console.log("Registration successful:", response);

      Alert.alert("Success!", "Your account has been created successfully.", [
        {
          text: "OK",
          onPress: () => {
            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
          },
        },
      ]);
    } catch (error: any) {
      console.error("Registration failed:", error);

      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details.join("\n");
      } else if (error.response?.status === 409) {
        errorMessage = "Email already exists. Please use a different email.";
      } else if (
        typeof error.message === "string" &&
        error.message.includes("Network Error")
      ) {
        errorMessage =
          "Cannot connect to server. Please check your connection.";
      }

      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Box w="$full" px="$5" py="$8" bg="$backgroundLight0">
          <VStack space="lg">
            {/* Header */}
            <VStack space="xs">
              <HStack justifyContent="space-between" alignItems="center">
                <Text p="$1" size="6xl" style={{ fontFamily: "DancingScript" }}>
                  Lumière
                </Text>

                <AntDesign name="info-circle" size={24} color="gray" />
              </HStack>
              <Divider mt={-8} />
            </VStack>

            {/* Title */}
            <VStack>
              <Text size="3xl" style={{ fontFamily: "Roboto" }}>
                Register your account
              </Text>

              <HStack space="xs">
                <Text style={{ fontFamily: "Roboto" }}>
                  Already have an account?
                </Text>

                <Pressable onPress={() => navigation.navigate("LoginScreen")}>
                  <Text style={{ fontFamily: "RobotoMedium" }} color="$blue600">
                    Sign in
                  </Text>
                </Pressable>
              </HStack>
            </VStack>

            {/* Form */}
            <VStack space="xl">
              {/* First Name */}
              <VStack space="xs">
                <Text style={{ fontFamily: "RobotoMedium" }}>First Name</Text>

                <Input size="lg" borderRadius="$lg">
                  <InputField
                    placeholder="Enter first name"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoComplete="name-given"
                    editable={!loading}
                  />
                </Input>
              </VStack>

              {/* Last Name */}
              <VStack space="xs">
                <Text style={{ fontFamily: "RobotoMedium" }}>Last Name</Text>

                <Input size="lg" borderRadius="$lg">
                  <InputField
                    placeholder="Enter last name"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoComplete="name-family"
                    editable={!loading}
                  />
                </Input>
              </VStack>

              {/* Email */}
              <VStack space="xs">
                <Text style={{ fontFamily: "RobotoMedium" }}>Email</Text>

                <Input size="lg" borderRadius="$lg">
                  <InputField
                    placeholder="abc@gmail.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                  />
                </Input>
              </VStack>

              {/* Password */}
              <VStack space="xs">
                <Text style={{ fontFamily: "RobotoMedium" }}>Password</Text>

                <Input size="lg" borderRadius="$lg">
                  <InputField
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                    editable={!loading}
                  />
                </Input>

                <Text size="xs">
                  Min 8 characters with uppercase, lowercase, number and special
                  character
                </Text>
              </VStack>

              {/* Confirm Password */}
              <VStack space="xs">
                <Text style={{ fontFamily: "RobotoMedium" }}>
                  Confirm Password
                </Text>

                <Input size="lg" borderRadius="$lg">
                  <InputField
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </Input>
              </VStack>
            </VStack>

            {/* Button */}
            <Button
              size="lg"
              onPress={handleRegister}
              isDisabled={loading}
              bg="$black"
              borderRadius="$lg"
              w="$full"
            >
              {loading ? (
                <Spinner color="$white" />
              ) : (
                <ButtonText color="$white">Create Account</ButtonText>
              )}
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
  },
});
