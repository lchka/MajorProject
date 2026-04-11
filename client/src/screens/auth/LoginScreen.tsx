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
import { loginSchema } from "../../models/auth.schema";
import { AuthStackParamList } from "../../types/navigation";
import SocialAuth from "../../components/actions/SocialAuth";
import useGoogleAuth from "../../hooks/googleAuth.hook";
import { AuthResponse } from "../../services";

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

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);

      if (rememberMe) {
        await AsyncStorage.multiSet([
          [REMEMBER_ME_KEY, "true"],
          [REMEMBERED_EMAIL_KEY, email.toLowerCase().trim()],
        ]);
      } else {
        await AsyncStorage.multiRemove([REMEMBER_ME_KEY, REMEMBERED_EMAIL_KEY]);
      }

      console.log("Login successful:", response);

      Alert.alert("Success!", "You have been signed in successfully.", [
        {
          text: "OK",
          onPress: async () => {
            await completeLoginFlow(response);
            setEmail("");
            setPassword("");
          },
        },
      ]);
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
                Sign in to your account
              </Text>

              <HStack space="xs">
                <Text style={{ fontFamily: "Roboto", color: "#57799B" }}>
                  Don't have an account?
                </Text>

                <Pressable
                  onPress={() => navigation.navigate("RegisterScreen")}
                >
                  <Text style={{ fontFamily: "RobotoMedium" }} color="#2E5F8A">
                    Sign up
                  </Text>
                </Pressable>
              </HStack>
            </VStack>

            {/* Form */}
            <VStack space="xl">
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

                <Box position="relative">
                  <Input size="lg" borderRadius="$lg">
                    <InputField
                      placeholder="Enter password"
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
              </VStack>

              {/* Remember + forgot */}
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
                    <Text style={{ fontFamily: "Roboto", color: "#57799B" }}>Remember me</Text>
                  </HStack>
                </Pressable>

                <Pressable disabled={loading}>
                  <Text style={{ fontFamily: "RobotoMedium" }} color="#2E5F8A">
                    Forgot Password?
                  </Text>
                </Pressable>
              </HStack>
            </VStack>

            {/* Button */}
            <Button
            mt="$4"
              size="lg"
              onPress={handleLogin}
              isDisabled={loading}
              bg="#4A90D9"
              borderRadius="$lg"
              w="$full"
            >
              {loading || googleLoading ? (
                <Spinner color="#F7FBFF" />
              ) : (
                <ButtonText color="#F7FBFF">Login</ButtonText>
              )}
            </Button>

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
