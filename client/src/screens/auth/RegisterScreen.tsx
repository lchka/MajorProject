// React & Gluestack imports
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import LottieView from "lottie-react-native";
import { Easing } from "react-native-reanimated";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Box,
  HStack,
  Image,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { authService } from "../../services";
import profileService from "../../services/profileService";
import { registerSchema } from "../../models/auth.schema";
import { AuthStackParamList } from "../../types/navigation";
import SocialAuth from "../../components/actions/SocialAuth";
import CreateButton from "../../components/Buttons/CreateButton";
import useGoogleAuth from "../../hooks/googleAuth.hook";
import type { AuthResponse } from "../../services";
import NavBarTop from "../../components/general/NavBarTop";
import ValidationAnimation from "../../components/general/ValidationAnimation";
import { MotiView } from "moti";

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
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const validateFirstName = (value: string) => {
    if (!value.trim()) return "First name is required.";
    return "";
  };

  const validateLastName = (value: string) => {
    if (!value.trim()) return "";
    if (value.trim().length < 2) return "Last name must be at least 2 characters.";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Enter a valid email address.";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required.";
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPasswordRegex.test(value)) {
      return "Use 8+ chars with uppercase, lowercase, number, and symbol.";
    }
    return "";
  };

  const validateConfirmPassword = (value: string, sourcePassword: string) => {
    if (!value) return "Please confirm your password.";
    if (value !== sourcePassword) return "Passwords do not match.";
    return "";
  };

  const passwordRules = [
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

  const firstNameRules = [
    {
      id: "first-name-required",
      label: "First name is required",
      test: (value: string) => value.trim().length > 0,
    },
  ];

  const lastNameRules = [
    {
      id: "last-name-optional",
      label: "Last name is optional",
      test: () => true,
    },
    {
      id: "last-name-length",
      label: "If entered, last name has at least 2 characters",
      test: (value: string) => value.trim().length === 0 || value.trim().length >= 2,
    },
  ];

  const emailRules = [
    {
      id: "email-required",
      label: "Email is required",
      test: (value: string) => value.trim().length > 0,
    },
    {
      id: "email-format",
      label: "Email format is valid",
      test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    },
  ];

  const confirmPasswordRules = [
    {
      id: "confirm-required",
      label: "Confirm password is required",
      test: (value: string) => value.length > 0,
    },
    {
      id: "confirm-match",
      label: "Passwords match",
      test: (value: string) => value.length > 0 && value === password,
    },
  ];

  const setFieldError = (field: keyof typeof errors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const validateStepFields = (currentStep: number) => {
    if (currentStep === 1) {
      const firstNameError = validateFirstName(firstName);
      const lastNameError = validateLastName(lastName);
      setFieldError("firstName", firstNameError);
      setFieldError("lastName", lastNameError);
      return !firstNameError && !lastNameError;
    }

    if (currentStep === 2) {
      const emailError = validateEmail(email);
      setFieldError("email", emailError);
      return !emailError;
    }

    if (currentStep === 3) {
      const passwordError = validatePassword(password);
      const confirmPasswordError = validateConfirmPassword(
        confirmPassword,
        password,
      );
      setFieldError("password", passwordError);
      setFieldError("confirmPassword", confirmPasswordError);
      return !passwordError && !confirmPasswordError;
    }

    return true;
  };

  const isCurrentStepValid = (() => {
    if (step === 1)
      return !validateFirstName(firstName) && !validateLastName(lastName);
    if (step === 2) return !validateEmail(email);
    if (step === 3) {
      return (
        !validatePassword(password) &&
        !validateConfirmPassword(confirmPassword, password)
      );
    }
    return true;
  })();

  const completeLoginFlow = async (response: AuthResponse) => {
    let shouldGoToAnalyse = false;
    let profileIdForEdit: string | undefined =
      response.user.profile_id ?? undefined;

    if (profileIdForEdit) {
      try {
        const profiles = await profileService.getMyProfile();
        const activeProfile =
          profiles.find((item) => item.main_profile) ?? profiles[0];
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
    if (!validateStepFields(step)) {
      if (step === 1) {
        setTouched((prev) => ({ ...prev, firstName: true, lastName: true }));
      }
      if (step === 2) {
        setTouched((prev) => ({ ...prev, email: true }));
      }
      return;
    }

    setStepDirection(1);
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStepDirection(-1);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleRegister = async () => {
    const isValidForSubmit = validateStepFields(3);
    setTouched((prev) => ({
      ...prev,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    }));

    if (!isValidForSubmit) {
      return;
    }

    const result = registerSchema.safeParse({
      first_name: firstName,
      last_name: lastName.trim() ? lastName : undefined,
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
        last_name: lastName.trim() ? lastName.trim() : undefined,
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
      style={{ flex: 1, backgroundColor: "#F2F8FF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-start",
          paddingHorizontal: 20,
          paddingVertical: 30,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Background circles (lighter, less intrusive) */}
        <Box
          position="absolute"
          top={-60}
          right={-30}
          w={180}
          h={180}
          borderRadius={999}
          bg="#D8ECFF"
          opacity={0.5}
        />
        <Box
          position="absolute"
          bottom={-40}
          left={-20}
          w={140}
          h={140}
          borderRadius={999}
          bg="#BFDFFF"
          opacity={0.25}
        />

        <NavBarTop isFirstProfileSetup showAvatar={false} showDivider />
        {/* Title */}
        <HStack
          pt="$8"
          alignItems="center"
          justifyContent="space-between"
          mb="$1.5"
        >
          <MotiView
            key={`register-title-${step}`}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 280 }}
            style={{ flex: 1 }}
          >
            <Text
              size="3xl"
              style={{
                fontFamily: "Roboto",
                color: "#1E293B",
              }}
            >
              {step === 0
                ? "Create Account"
                : step === 1
                  ? "Your name"
                  : step === 2
                    ? "Your email"
                    : "Create password"}
            </Text>
          </MotiView>
          <Feather name="info" size={24} color="#5E7FA3" />
        </HStack>

        {/* Subtext */}
        <HStack mb="$4">
          <Text color="#64748B">Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate("LoginScreen")}>
            <Text color="#2E5F8A" style={{ fontFamily: "RobotoMedium" }}>
              Sign in
            </Text>
          </Pressable>
        </HStack>

        {/* STEP PANELS */}
        <Box overflow="hidden" width="100%">
          <MotiView
            key={`register-step-${step}`}
            from={{ opacity: 0.98, translateX: stepDirection === 1 ? 22 : -22 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{
              type: "timing",
              duration: 360,
              easing: Easing.out(Easing.cubic),
            }}
          >
            {step === 0 ? (
              <VStack space="lg" mt="$5">
                <CreateButton
                  label="Continue with Email"
                  onPress={handleNext}
                />

                {/* Social */}
                <SocialAuth
                  onGooglePress={promptGoogleAuth}
                  onGithubPress={promptGithubAuth}
                />

                <Box>
                  <LottieView
                    source={require("../../../assets/animations/create.json")}
                    autoPlay
                    loop
                    style={{ width: "100%", height: 300 }}
                  />
                </Box>
              </VStack>
            ) : (
              <VStack pt="$2" space="lg">
                {/* Step Inputs */}
                {step === 1 && (
                  <>
                    <VStack space="xs">
                      <Input size="lg" borderRadius="$full">
                        <InputField
                          placeholder="First name"
                          value={firstName}
                          onChangeText={(value) => {
                            setFirstName(value);
                            setTouched((prev) => ({ ...prev, firstName: true }));
                            setFieldError("firstName", validateFirstName(value));
                          }}
                          onBlur={() => {
                            setTouched((prev) => ({ ...prev, firstName: true }));
                            setFieldError(
                              "firstName",
                              validateFirstName(firstName),
                            );
                          }}
                        />
                      </Input>
                      <ValidationAnimation value={firstName} rules={firstNameRules} />
                    </VStack>

                    <VStack space="xs">
                      <Input size="lg" borderRadius="$full">
                        <InputField
                          placeholder="Last name (optional)"
                          value={lastName}
                          onChangeText={(value) => {
                            setLastName(value);
                            setTouched((prev) => ({ ...prev, lastName: true }));
                            setFieldError("lastName", validateLastName(value));
                          }}
                          onBlur={() => {
                            setTouched((prev) => ({ ...prev, lastName: true }));
                            setFieldError("lastName", validateLastName(lastName));
                          }}
                        />
                      </Input>
                      <ValidationAnimation value={lastName} rules={lastNameRules} />
                    </VStack>
                  </>
                )}

                {step === 2 && (
                  <>
                    <VStack space="xs">
                      <Input size="lg" borderRadius="$full">
                        <InputField
                          placeholder="Email address"
                          value={email}
                          onChangeText={(value) => {
                            setEmail(value);
                            setTouched((prev) => ({ ...prev, email: true }));
                            setFieldError("email", validateEmail(value));
                          }}
                          onBlur={() => {
                            setTouched((prev) => ({ ...prev, email: true }));
                            setFieldError("email", validateEmail(email));
                          }}
                        />
                      </Input>
                      <ValidationAnimation value={email} rules={emailRules} />
                    </VStack>
                  </>
                )}

                {step === 3 && (
                  <>
                    <VStack space="xs">
                      <Box position="relative">
                        <Input size="lg" borderRadius="$full">
                          <InputField
                            placeholder="Password"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={(value) => {
                              setPassword(value);
                              setTouched((prev) => ({ ...prev, password: true }));
                              setFieldError("password", validatePassword(value));
                              if (
                                touched.confirmPassword ||
                                confirmPassword.length > 0
                              ) {
                                setFieldError(
                                  "confirmPassword",
                                  validateConfirmPassword(confirmPassword, value),
                                );
                              }
                            }}
                            onBlur={() => {
                              setTouched((prev) => ({ ...prev, password: true }));
                              setFieldError(
                                "password",
                                validatePassword(password),
                              );
                            }}
                            style={{ paddingRight: 44 }}
                          />
                        </Input>
                        <Pressable
                          position="absolute"
                          right="$5"
                          top={0}
                          bottom={0}
                          w="$10"
                          alignItems="center"
                          justifyContent="center"
                          hitSlop={10}
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
                      <ValidationAnimation value={password} rules={passwordRules} />
                    </VStack>

                    <VStack space="xs">
                      <Box position="relative">
                        <Input size="lg" borderRadius="$full">
                          <InputField
                            placeholder="Confirm password"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={(value) => {
                              setConfirmPassword(value);
                              setTouched((prev) => ({
                                ...prev,
                                confirmPassword: true,
                              }));
                              setFieldError(
                                "confirmPassword",
                                validateConfirmPassword(value, password),
                              );
                            }}
                            onBlur={() => {
                              setTouched((prev) => ({
                                ...prev,
                                confirmPassword: true,
                              }));
                              setFieldError(
                                "confirmPassword",
                                validateConfirmPassword(
                                  confirmPassword,
                                  password,
                                ),
                              );
                            }}
                            style={{ paddingRight: 44 }}
                          />
                        </Input>
                        <Pressable
                          position="absolute"
                          right="$5"
                          top={0}
                          bottom={0}
                          w="$10"
                          alignItems="center"
                          justifyContent="center"
                          hitSlop={10}
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
                      <ValidationAnimation
                        value={confirmPassword}
                        rules={confirmPasswordRules}
                      />
                    </VStack>
                  </>
                )}

                {/* Buttons */}
                <HStack mx="$2" space="md" mt="$4">
                  {step > 0 && (
                    <Box flex={1}>
                      <CreateButton
                        preset="outline"
                        label="Back"
                        onPress={handleBack}
                        disabled={loading}
                      />
                    </Box>
                  )}

                  <Box flex={1}>
                    <CreateButton
                      label={
                        step === 3
                          ? loading
                            ? "Signing up..."
                            : "Sign Up"
                          : "Next"
                      }
                      onPress={step === 3 ? handleRegister : handleNext}
                      disabled={loading || !isCurrentStepValid}
                    />
                  </Box>
                </HStack>
              </VStack>
            )}
          </MotiView>
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
    paddingVertical: 14,
  },
  cardShadow: {
    shadowColor: "#4A90D9",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 14,
    elevation: 3,
  },
});
