// React & Gluestack imports
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import Feather from "@expo/vector-icons/Feather";
import { authService } from "../../services";
import profileService from "../../services/profileService";
import { registerSchema } from "../../models/auth.schema";
import { AuthStackParamList } from "../../types/navigation";
import SocialAuth from "../../components/actions/SocialAuth";
import useGoogleAuth from "../../hooks/googleAuth.hook";
import type { AuthResponse } from "../../services";

const AUTH_TOKEN_KEY = "authToken";
const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const completeLoginFlow = async (response: AuthResponse) => {
    let shouldGoToAnalyse = false;
    let profileIdForEdit: string | undefined = response.user.profile_id ?? undefined;

    if (profileIdForEdit) {
      try {
        const profiles = await profileService.getMyProfile();
        const activeProfile = profiles.find((item) => item.main_profile) ?? profiles[0];
        shouldGoToAnalyse = Boolean(activeProfile?.isComplete);
        profileIdForEdit = activeProfile?.id ?? profileIdForEdit;
      } catch {
        shouldGoToAnalyse = false;
      }
    }

    if (shouldGoToAnalyse) {
      navigation.navigate("LandingScreen");
      return;
    }

    navigation.navigate("ProfileScreen", {
      firstName: response.user.first_name,
      lastName: response.user.last_name,
      email: response.user.email,
      profileId: profileIdForEdit,
    });
  };

  const { promptGoogleAuth } = useGoogleAuth({
    onLoginSuccess: async (response) => {
      await completeLoginFlow(response);
      Alert.alert("Success!", "Google sign-in successful.");
    },
    onLoginError: (message) => {
      Alert.alert("Google Login Failed", message);
    },
  });

  const isWeb = Platform.OS === "web";
  const isExpoGo = Constants.appOwnership === "expo";
  const githubRedirectUri = isExpoGo
    ? "https://auth.expo.io/@lchkas-organization/lumiere"
    : AuthSession.makeRedirectUri({
        preferLocalhost: isWeb,
        scheme: "client",
      });
  console.log("REDIRECT URI:", githubRedirectUri);
  const [githubRequest, githubResponse, promptGithubAuth] =
    AuthSession.useAuthRequest(
      {
        clientId: GITHUB_CLIENT_ID || "",
        scopes: ["read:user", "user:email"],
        redirectUri: githubRedirectUri,
      },
      {
        authorizationEndpoint: "https://github.com/login/oauth/authorize",
      },
    );

  useEffect(() => {
    console.log("[GitHubAuth] init", {
      redirectUri: githubRedirectUri,
      requestUrl: githubRequest?.url,
      hasClientId: Boolean(GITHUB_CLIENT_ID),
    });
  }, [githubRedirectUri, githubRequest?.url]);

  useEffect(() => {
    if (githubResponse?.type !== "success") return;
    const code = githubResponse.params?.code;

    if (typeof code === "string") {
      console.log("[GitHubAuth] code", code);
    }
  }, [githubResponse]);

  const handleNext = () => {
    if (step === 1 && (!firstName.trim() || !lastName.trim())) {
      Alert.alert("Missing info", "Please enter first and last name.");
      return;
    }

    if (step === 2 && !email.trim()) {
      Alert.alert("Missing info", "Please enter your email.");
      return;
    }

    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

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

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);

      console.log("Registration successful:", response);

      Alert.alert("Success!", "Your account has been created successfully.", [
        {
          text: "OK",
          onPress: () => {
            const prefillFirstName = firstName.trim();
            const prefillLastName = lastName.trim();
            const prefillEmail = email.toLowerCase().trim();

            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setStep(0);
            navigation.navigate("ProfileScreen", {
              firstName: prefillFirstName,
              lastName: prefillLastName,
              email: prefillEmail,
              profileId: response.user.profile_id ?? undefined,
            });
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
        <Box w="$full" bg="#F2F8FF">
          <Box
            position="absolute"
            top={-90}
            right={-45}
            w={220}
            h={220}
            borderRadius={999}
            bg="#D8ECFF"
            opacity={0.9}
          />
          <Box
            position="absolute"
            bottom={-70}
            left={-35}
            w={180}
            h={180}
            borderRadius={999}
            bg="#BFDFFF"
            opacity={0.35}
          />

          <Box w="$full" px="$5" py="$4">
            <Box
              bg="#F9FCFF"
              borderRadius="$2xl"
              p="$5"
              style={styles.cardShadow}
            >
              <VStack space="xl">
            {/* Header */}
            <VStack space="xs">
              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  pl="$2"
                  size="6xl"
                  style={{ fontFamily: "DancingScript", color: "#204C78" }}
                >
                  Lumière
                </Text>

                <Box
                  w="$9"
                  h="$9"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius={999}
                  bg="#E6F2FF"
                >
                  <AntDesign name="star" size={18} color="#4A90D9" />
                </Box>
              </HStack>
              <Divider mt={-8} bg="#C8E0F8" />
            </VStack>

            {/* Title */}
            <VStack>
              <Text size="3xl" style={{ fontFamily: "Roboto", color: "#261A10" }}>
                {step === 0
                  ? "Welcome to Lumière"
                  : step === 1
                  ? "Tell us your name"
                  : step === 2
                  ? "Add your email"
                  : "Set your password"}
              </Text>

              <HStack space="xs">
                <Text style={{ fontFamily: "Roboto", color: "#57799B" }}>
                  Already have an account?
                </Text>

                <Pressable onPress={() => navigation.navigate("LoginScreen")}>
                  <Text style={{ fontFamily: "RobotoMedium" }} color="#2E5F8A">
                    Sign in
                  </Text>
                </Pressable>
              </HStack>
            </VStack>

            {step === 0 ? (
              <VStack space="xl">
                <Text size="sm" color="#57799B">
                  Create your account in a few quick steps.
                </Text>

                <Button
                  size="lg"
                  onPress={handleNext}
                  bg="#4A90D9"
                  borderRadius="$lg"
                  w="$full"
                >
                  <ButtonText color="#F7FBFF">Continue with Email</ButtonText>
                </Button>

                <SocialAuth
                  onGooglePress={promptGoogleAuth}
                  onGithubPress={async () => {
                    if (!GITHUB_CLIENT_ID) {
                      Alert.alert("GitHub Login", "Missing GitHub client ID.");
                      return;
                    }
                    if (!githubRequest) {
                      Alert.alert("GitHub Login", "GitHub auth not ready.");
                      return;
                    }
                    await promptGithubAuth();
                  }}
                />
              </VStack>
            ) : (
              <VStack space="xl">
                {step === 1 ? (
                  <>
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
                  </>
                ) : null}

                {step === 2 ? (
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
                ) : null}

                {step === 3 ? (
                  <>
                    <VStack space="xs">
                      <Text style={{ fontFamily: "RobotoMedium" }}>Password</Text>
                      <Box position="relative">
                        <Input size="lg" borderRadius="$lg">
                          <InputField
                            placeholder="Enter password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="password-new"
                            editable={!loading}
                            style={{ paddingRight: 44 }}
                          />
                        </Input>

                        <Pressable
                          position="absolute"
                          right="$3"
                          top="50%"
                          mt={-9}
                          onPress={() => setShowPassword((prev) => !prev)}
                          disabled={loading}
                        >
                          <Feather
                            name={showPassword ? "eye-off" : "eye"}
                            size={18}
                            color="#6B7280"
                          />
                        </Pressable>
                      </Box>

                      <Text size="xs">
                        Min 8 characters with uppercase, lowercase, number and special
                        character
                      </Text>
                    </VStack>

                    <VStack space="xs">
                      <Text style={{ fontFamily: "RobotoMedium" }}>
                        Confirm Password
                      </Text>

                      <Box position="relative">
                        <Input size="lg" borderRadius="$lg">
                          <InputField
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            editable={!loading}
                            style={{ paddingRight: 44 }}
                          />
                        </Input>

                        <Pressable
                          position="absolute"
                          right="$3"
                          top="50%"
                          mt={-9}
                          onPress={() => setShowConfirmPassword((prev) => !prev)}
                          disabled={loading}
                        >
                          <Feather
                            name={showConfirmPassword ? "eye-off" : "eye"}
                            size={18}
                            color="#6B7280"
                          />
                        </Pressable>
                      </Box>
                    </VStack>
                  </>
                ) : null}

                <HStack space="md" mt="$2">
                  {step > 0 ? (
                    <Button
                      flex={1}
                      variant="outline"
                      borderRadius="$lg"
                      borderColor="#A8CFF5"
                      onPress={handleBack}
                      isDisabled={loading}
                    >
                      <ButtonText color="#2E5F8A">Back</ButtonText>
                    </Button>
                  ) : null}

                  <Button
                    flex={1}
                    size="lg"
                    onPress={step === 3 ? handleRegister : handleNext}
                    isDisabled={loading}
                    bg="#4A90D9"
                    borderRadius="$lg"
                  >
                    {loading && step === 3 ? (
                      <Spinner color="#F7FBFF" />
                    ) : (
                      <ButtonText color="#F7FBFF">
                        {step === 3 ? "Sign Up" : "Next"}
                      </ButtonText>
                    )}
                  </Button>
                </HStack>
              </VStack>
            )}
              </VStack>
            </Box>
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F8FF",
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#F2F8FF",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  cardShadow: {
    shadowColor: "#4A90D9",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 5,
  },
});
