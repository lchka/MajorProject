// React & Gluestack imports
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
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
import { authService } from "../services";
import profileService from "../services/profileService";
import { loginSchema } from "../models/auth.schema";
import { AuthStackParamList } from "../types/navigation";
import SocialAuth from "../components/actions/SocialAuth";

const AUTH_TOKEN_KEY = "authToken";
const REMEMBER_ME_KEY = "rememberMe";
const REMEMBERED_EMAIL_KEY = "rememberedEmail";

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

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

      let shouldGoToAnalyse = false;
      let profileIdForEdit: string | undefined = response.user.profile_id ?? undefined;

      if (profileIdForEdit) {
        try {
          const profile = await profileService.getMyProfile();
          shouldGoToAnalyse = Boolean(profile?.isComplete);
          profileIdForEdit = profile?.id ?? profileIdForEdit;
        } catch {
          shouldGoToAnalyse = false;
        }
      }

      console.log("Login successful:", response);

      Alert.alert("Success!", "You have been signed in successfully.", [
        {
          text: "OK",
          onPress: () => {
            if (shouldGoToAnalyse) {
              navigation.navigate("AnalyseScreen");
            } else {
              navigation.navigate("ProfileScreen", {
                firstName: response.user.first_name,
                lastName: response.user.last_name,
                email: response.user.email,
                profileId: profileIdForEdit,
              });
            }

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
        <Box w="$full" px="$5" py="$8" bg="$backgroundLight0">
          <VStack space="xl">
            {/* Header */}
            <VStack space="xs">
              <HStack justifyContent="space-between" alignItems="center">
                <Text pl="$2" size="6xl" style={{ fontFamily: "DancingScript" }}>
                  Lumière
                </Text>

                <Box
                  w="$8"
                  h="$8"
                  alignItems="center"
                  justifyContent="center"
                  mt="$4"
                >
                  <AntDesign name="info-circle" size={28} color="gray" />
                </Box>
              </HStack>

              <Divider mt={-8} />
            </VStack>

            {/* Title */}
            <VStack>
              <Text size="3xl" style={{ fontFamily: "Roboto" }}>
                Sign in to your account
              </Text>

              <HStack space="xs">
                <Text style={{ fontFamily: "Roboto" }}>
                  Don't have an account?
                </Text>

                <Pressable
                  onPress={() => navigation.navigate("RegisterScreen")}
                >
                  <Text style={{ fontFamily: "RobotoMedium" }} color="$textLight700">
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
                      borderColor="$borderDark400"
                      borderRadius="$md"
                      alignItems="center"
                      justifyContent="center"
                      bg={rememberMe ? "$blue600" : "transparent"}
                    >
                      {rememberMe ? (
                        <Feather name="check" size={12} color="white" />
                      ) : null}
                    </Box>
                    <Text style={{ fontFamily: "Roboto" }}>Remember me</Text>
                  </HStack>
                </Pressable>

                <Pressable disabled={loading}>
                  <Text style={{ fontFamily: "RobotoMedium" }} color="$textLight700">
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
              bg="$black"
              borderRadius="$lg"
              w="$full"
            >
              {loading ? (
                <Spinner color="$white" />
              ) : (
                <ButtonText color="$white">Login</ButtonText>
              )}
            </Button>

            <SocialAuth />
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
