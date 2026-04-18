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
import { saveAuthToken } from "../../utils/authStorage";
import {
  Box,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { authService } from "../../services";
import profileService from "../../services/profileService";
import { loginSchema } from "../../models/auth.schema";
import { AuthStackParamList } from "../../types/navigation";
import SocialAuth from "../../components/actions/SocialAuth";
import useGoogleAuth from "../../hooks/googleAuth.hook";
import { AuthResponse } from "../../services";
import CreateButton from "../../components/Buttons/CreateButton";
import NavBarTop from "../../components/general/NavBarTop";

const AUTH_TOKEN_KEY = "authToken";
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
    onLoginSuccess: async (response) => {
      // FIX: Removed success alert, navigate directly to landing/profile page
      await completeLoginFlow(response);
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

  useEffect(() => {
    const loadRememberedLogin = async () => {
      try {
        const rememberValue = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        const isRememberEnabled = rememberValue === "true";

        setRememberMe(isRememberEnabled);

        if (isRememberEnabled) {
          const savedEmail = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
          if (savedEmail) {
            setEmail(savedEmail);
          }
        }
      } catch (storageError) {
        console.warn("Could not load remembered login", storageError);
      }
    };

    loadRememberedLogin();
  }, []);

  const handleLogin = async () => {
    const result = loginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      const errors = result.error.issues.map((err) => err.message).join("\n");
      Alert.alert("Validation Error", errors);
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

      console.log("Login successful:", response);

      // FIX: Removed success alert, navigate directly to landing/profile page
      await completeLoginFlow(response);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Login failed:", error);

      let errorMessage = "Login failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (
        typeof error.message === "string" &&
        error.message.includes("Network Error")
      ) {
        errorMessage =
          "Cannot connect to server. Please check your connection.";
      }

      Alert.alert("Login Failed", errorMessage);
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
          <VStack space="xs">
            <Input size="lg" borderRadius="$full">
              <InputField
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </Input>
          </VStack>

          <VStack space="xs">
            <Box position="relative">
              <Input size="lg" borderRadius="$full">
                <InputField
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
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
          </VStack>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F8FF",
  },
});
