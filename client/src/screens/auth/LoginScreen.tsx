// React & Gluestack imports
import React, { useEffect, useState } from "react";
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
import Banner from "../../components/banners/GenBanner";
const REMEMBER_ME_KEY = "rememberMe";
const REMEMBERED_EMAIL_KEY = "rememberedEmail";
const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
// The LoginScreen component provides a user interface for signing into the app. It includes input fields for email and password, validation rules, and options for remembering the user's login. The component also integrates social authentication options for Google and GitHub, handling the respective authentication flows and managing loading and error states to provide feedback to the user during the login process.
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generic Banner state
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerType, setBannerType] = useState<"success" | "error" | "info" | "warning">("error");

  const showError = (message: string) => {
    setBannerVisible(false);
    setTimeout(() => {
      setBannerType("error");
      setBannerMessage(message || "An unexpected error occurred.");
      setBannerVisible(true);
    }, 50);
  };

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // --- Validation rules --
  const emailRules = [
    { id: "email-required", label: "Email is required", test: (v: string) => v.trim().length > 0 },
    { id: "email-format", label: "Email format is valid", test: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
  ];

  const passwordRules = [
    { id: "password-required", label: "Password is required", test: (v: string) => v.length > 0 },
    { id: "password-length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  ];

  // --- Auth helpers ---
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

  const { promptGoogleAuth, loading: googleLoading } = useGoogleAuth({
    onLoginSuccess: async (response) => await completeLoginFlow(response),
    onLoginError: (message) => showError(message),
  });

  const isWeb = Platform.OS === "web";
  const isExpoGo = Constants.appOwnership === "expo";
  const githubRedirectUri = isExpoGo
    ? "https://auth.expo.io/@lchkas-organization/lumiere"
    : AuthSession.makeRedirectUri({ preferLocalhost: isWeb, scheme: "client" });

  const [githubRequest, , promptGithubAuth] = AuthSession.useAuthRequest(
    { clientId: GITHUB_CLIENT_ID || "", scopes: ["read:user", "user:email"], redirectUri: githubRedirectUri },
    { authorizationEndpoint: "https://github.com/login/oauth/authorize" }
  );
// The useEffect hook listens for changes in the GitHub authentication response. If a successful authentication response is received, it extracts the authorization code and sends it to the backend API to exchange for an authentication token. Upon successful exchange, it saves the token and completes the login flow. If any errors occur during this process, it displays an appropriate error message to the user.
  useEffect(() => {
    const loadRememberedLogin = async () => {
      try {
        const rememberValue = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        if (rememberValue === "true") {
          setRememberMe(true);
          const savedEmail = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
          if (savedEmail) setEmail(savedEmail);
        }
      } catch (e) { console.warn(e); }
    };
    loadRememberedLogin();
  }, []);
//  The useEffect hook listens for changes in the GitHub authentication response. If a successful authentication response is received, it extracts the authorization code and sends it to the backend API to exchange for an authentication token. Upon successful exchange, it saves the token and completes the login flow. If any errors occur during this process, it displays an appropriate error message to the user.
  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      showError(result.error.issues[0].message);
      return;
    }

    try {
      setLoading(true);
      
      const response = await authService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      // ONLY proceed to save/navigate if login didn't throw
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

    } catch (error: any) {
      // STOP loading immediately to keep user on screen
      setLoading(false);
      
      console.log("Login Error Caught:", error);

      const status = error.response?.status || error.status || error.statusCode;
      const errorStr = (error.message || String(error)).toLowerCase();
      const apiResponseMsg = (error.response?.data?.message || "").toLowerCase();

      let finalErrorMessage = "Login failed. Please try again.";

      // Matching status 401 or the "Invalid credentials" string
      if (
        status === 401 || 
        errorStr.includes("401") || 
        errorStr.includes("invalid") ||
        apiResponseMsg.includes("credential")
      ) {
        finalErrorMessage = "Incorrect email or password.";
      } else if (errorStr.includes("network") || errorStr.includes("timeout")) {
        finalErrorMessage = "Please check your internet connection.";
      }

      showError(finalErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} style={{ backgroundColor: "#F2F8FF" }}>
      <Banner
        key={bannerMessage}
        isOpen={bannerVisible}
        message={bannerMessage}
        type={bannerType}
        onDismiss={() => setBannerVisible(false)}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 30 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background circles */}
          <Box position="absolute" top={-60} right={-30} w={180} h={180} borderRadius={999} bg="#D8ECFF" opacity={0.5} />
          <Box position="absolute" bottom={-40} left={-20} w={140} h={140} borderRadius={999} bg="#BFDFFF" opacity={0.25} />

          <NavBarTop isFirstProfileSetup showAvatar={false} showDivider />

          <HStack pt="$8" alignItems="center" justifyContent="space-between" mb="$1.5">
            <Text size="3xl" style={{ fontFamily: "Roboto", color: "#1E293B", flex: 1 }}>Sign in to your account</Text>
            <Feather name="log-in" size={22} color="#5E7FA3" />
          </HStack>

          <HStack mb="$4">
            <Text color="#64748B">Don&apos;t have an account? </Text>
            <Pressable onPress={() => navigation.navigate("RegisterScreen")}>
              <Text color="#2E5F8A" style={{ fontFamily: "RobotoMedium" }}>Sign up</Text>
            </Pressable>
          </HStack>

          <VStack pt="$2" space="lg">
            <VStack space="xs">
              <Input size="lg" borderRadius="$full">
                <InputField
                  placeholder="Email address"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setTouched(t => ({...t, email: true})); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </Input>
              {touched.email && <ValidationAnimation value={email} rules={emailRules} />}
            </VStack>

            <VStack space="xs">
              <Box position="relative">
                <Input size="lg" borderRadius="$full">
                  <InputField
                    placeholder="Password"
                    value={password}
                    onChangeText={(v) => { setPassword(v); setTouched(t => ({...t, password: true})); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                    style={{ paddingRight: 44 }}
                  />
                </Input>
                <Pressable
                  position="absolute"
                  right="$5" top={0} bottom={0} w="$10"
                  alignItems="center" justifyContent="center"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#6B7280" />
                </Pressable>
              </Box>
              {touched.password && <ValidationAnimation value={password} rules={passwordRules} />}
            </VStack>

            <HStack justifyContent="space-between" alignItems="center">
              <Pressable onPress={() => setRememberMe(!rememberMe)} disabled={loading}>
                <HStack space="sm" alignItems="center">
                  <Box w="$5" h="$5" borderWidth={1} borderColor="#9BB9D8" borderRadius="$md" alignItems="center" justifyContent="center" bg={rememberMe ? "#4A90D9" : "transparent"}>
                    {rememberMe && <Feather name="check" size={12} color="white" />}
                  </Box>
                  <Text style={{ fontFamily: "Roboto", color: "#57799B" }}>Remember me</Text>
                </HStack>
              </Pressable>
              <Pressable disabled={loading}>
                <Text style={{ fontFamily: "RobotoMedium" }} color="#2E5F8A">Forgot Password?</Text>
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
                if (!GITHUB_CLIENT_ID || !githubRequest) {
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