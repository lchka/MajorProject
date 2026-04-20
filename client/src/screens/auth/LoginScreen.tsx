// React & Gluestack imports
import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { saveAuthToken } from "../../utils/authStorage";
import {
  Box,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, profileService, type AuthResponse } from "../../services";
import { loginSchema } from "../../models/auth.schema";
import { AuthStackParamList } from "../../types/navigation";
import SocialAuth from "../../components/actions/SocialAuth";
import { useGoogleAuth } from "../../hooks/googleAuth.hook";
import CreateButton from "../../components/Buttons/CreateButton";
import NavBarTop from "../../components/general/NavBarTop";
import ValidationAnimation from "../../components/general/ValidationAnimation";
import ErrorBanner from "../../components/banners/ErrorBanner";

const REMEMBER_ME_KEY = "rememberMe";
const REMEMBERED_EMAIL_KEY = "rememberedEmail";
const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // ErrorBanner state
  const [bannerError, setBannerError] = useState<string | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = (message: string) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBannerError(message);
    bannerTimerRef.current = setTimeout(() => setBannerError(null), 4500);
  };

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // --- Validation rules ---

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

  const passwordRules = [
    {
      id: "password-required",
      label: "Password is required",
      test: (value: string) => value.length > 0,
    },
    {
      id: "password-length",
      label: "At least 8 characters",
      test: (value: string) => value.length >= 8,
    },
  ];

  // --- Auth helpers ---

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

  const { promptGoogleAuth, loading: googleLoading } = useGoogleAuth({
    onLoginSuccess: async (response) => {
      await completeLoginFlow(response);
    },
    onLoginError: (message) => {
      showError(message);
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

  useEffect(() => {
    const loadRememberedLogin = async () => {
      try {
        const rememberValue = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        const isRememberEnabled = rememberValue === "true";
        setRememberMe(isRememberEnabled);
        if (isRememberEnabled) {
          const savedEmail = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
          if (savedEmail) setEmail(savedEmail);
        }
      } catch (storageError) {
        console.warn("Could not load remembered login", storageError);
      }
    };
    loadRememberedLogin();
  }, []);

  // Cleanup banner timer on unmount
  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const handleLogin = async () => {
    setTouched({ email: true, password: true });

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const errors = result.error.issues.map((err) => err.message).join("\n");
      showError(errors);
      return;
    }

    try {
      setLoading(true);

      const response = await authService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      await saveAuthToken(response.token);

      if (rememberMe) {
        await AsyncStorage.multiSet([
          [REMEMBER_ME_KEY, "true"],
          [REMEMBERED_EMAIL_KEY, email.toLowerCase().trim()],
        ]);
      } else {
        await AsyncStorage.multiRemove([REMEMBER_ME_KEY, REMEMBERED_EMAIL_KEY]);
      }

      await completeLoginFlow(response);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Login failed:", error);

      let errorMessage = "Login failed. Please try again.";
      const backendMessage = error.response?.data?.message?.toLowerCase() || "";

      if (
        backendMessage.includes("invalid credentials") ||
        backendMessage.includes("wrong password")
      ) {
        errorMessage = "Incorrect email or password.";
      } else if (backendMessage.includes("user not found")) {
        errorMessage = "No account found with that email.";
      } else if (error.response?.status === 401) {
        errorMessage = "Incorrect email or password.";
      } else if (
        typeof error.message === "string" &&
        error.message.includes("Network Error")
      ) {
        errorMessage = "Cannot connect to server. Please check your connection.";
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} style={{ backgroundColor: "#F2F8FF" }}>
      {/* ErrorBanner lives at root level — above KeyboardAvoidingView and ScrollView */}
      <ErrorBanner
        error={bannerError ? { message: bannerError } : null}
        onDismiss={() => setBannerError(null)}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
          {/* Background circles */}
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

          <HStack
            pt="$8"
            alignItems="center"
            justifyContent="space-between"
            mb="$1.5"
          >
            <Text
              size="3xl"
              style={{
                fontFamily: "Roboto",
                color: "#1E293B",
                flex: 1,
              }}
            >
              Sign in to your account
            </Text>
            <Feather name="log-in" size={22} color="#5E7FA3" />
          </HStack>

          <HStack mb="$4">
            <Text color="#64748B">Don&apos;t have an account? </Text>
            <Pressable onPress={() => navigation.navigate("RegisterScreen")}>
              <Text color="#2E5F8A" style={{ fontFamily: "RobotoMedium" }}>
                Sign up
              </Text>
            </Pressable>
          </HStack>

          <VStack pt="$2" space="lg">
            {/* Email */}
            <VStack space="xs">
              <Input size="lg" borderRadius="$full">
                <InputField
                  placeholder="Email address"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setTouched((prev) => ({ ...prev, email: true }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />
              </Input>
              {touched.email && (
                <ValidationAnimation value={email} rules={emailRules} />
              )}
            </VStack>

            {/* Password */}
            <VStack space="xs">
              <Box position="relative">
                <Input size="lg" borderRadius="$full">
                  <InputField
                    placeholder="Password"
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setTouched((prev) => ({ ...prev, password: true }));
                    }}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, password: true }))
                    }
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!loading}
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
              {touched.password && (
                <ValidationAnimation value={password} rules={passwordRules} />
              )}
            </VStack>

            {/* Remember me / Forgot password */}
            <HStack justifyContent="space-between" alignItems="center">
              <Pressable
                onPress={() => setRememberMe((prev) => !prev)}
                disabled={loading}
              >
                <HStack space="sm" alignItems="center">
                  <Box
                    w="$5"
                    h="$5"
                    borderWidth={1}
                    borderColor="#9BB9D8"
                    borderRadius="$md"
                    alignItems="center"
                    justifyContent="center"
                    bg={rememberMe ? "#4A90D9" : "transparent"}
                  >
                    {rememberMe ? (
                      <Feather name="check" size={12} color="white" />
                    ) : null}
                  </Box>
                  <Text style={{ fontFamily: "Roboto", color: "#57799B" }}>
                    Remember me
                  </Text>
                </HStack>
              </Pressable>

              <Pressable disabled={loading}>
                <Text style={{ fontFamily: "RobotoMedium" }} color="#2E5F8A">
                  Forgot Password?
                </Text>
              </Pressable>
            </HStack>

            <CreateButton
              label={loading || googleLoading ? "Signing in..." : "Login"}
              onPress={handleLogin}
              disabled={loading || googleLoading}
            />

            <SocialAuth
              onGooglePress={() => void promptGoogleAuth()}
              onGithubPress={async () => {
                if (!GITHUB_CLIENT_ID) {
                  showError("Missing GitHub client ID.");
                  return;
                }
                if (!githubRequest) {
                  showError("GitHub auth not ready.");
                  return;
                }
                await promptGithubAuth();
              }}
            />
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
