import { useCallback, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { authService } from "../services";
import { saveAuthToken } from "../utils/authStorage";
import type { AuthResponse } from "../services";
//NOT FUNCTIONAL DUE TO EAS AND IOS 16+ CHANGES TO EXPO AUTH SESSION. KEEPING THIS FILE FOR FUTURE REFERENCE AND POSSIBLE REIMPLEMENTATION WITH CUSTOM BROWSER FLOW.
WebBrowser.maybeCompleteAuthSession();
const GOOGLE_AUTH_DEBUG_PREFIX = "[GoogleAuthDebug]";

type UseGoogleAuthOptions = {
  onLoginSuccess?: (response: AuthResponse) => Promise<void> | void;
  onLoginError?: (message: string) => void;
};

type UseGoogleAuthReturn = {
  promptGoogleAuth: () => Promise<void>;
  isReady: boolean;
  loading: boolean;
  error: string | null;
};

export const useGoogleAuth = (
  options?: UseGoogleAuthOptions,
): UseGoogleAuthReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = "https://auth.expo.io/@lchkas-organization/lumiere";
  const isExpoGo = Constants.appOwnership === "expo";
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || webClientId;
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || webClientId;
  const expoClientId =
    process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || webClientId;

  const config: Parameters<typeof Google.useAuthRequest>[0] = {
    webClientId,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
  };

  if (iosClientId) {
    config.iosClientId = iosClientId;
  }

  if (androidClientId) {
    config.androidClientId = androidClientId;
  }

  if (isExpoGo) {
    config.clientId = expoClientId;
  }

  if (Platform.OS === "ios" && !config.iosClientId) {
    console.warn(
      `${GOOGLE_AUTH_DEBUG_PREFIX} Missing iOS Google client id; check EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`,
    );
  }

  const [request, response, promptAsync] = Google.useAuthRequest(config);
// The useEffect hook logs the initialization of the Google auth hook, including the redirect URI, request details, and whether the app is running in Expo Go. This information can be helpful for debugging issues related to the authentication flow, such as misconfigured client IDs or redirect URIs. By monitoring these values, developers can ensure that the authentication setup is correct and identify potential problems early in the development process.
  useEffect(() => {
    console.log(
      `${GOOGLE_AUTH_DEBUG_PREFIX} hook initialized`,
      JSON.stringify({
        redirectUri,
        requestRedirectUri: request?.redirectUri,
        requestUrl: request?.url,
        isExpoGo,
      }),
    );
  }, [redirectUri, request?.redirectUri, request?.url, isExpoGo]);

  const handleBackendLogin = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);

      try {
        const authResponse = await authService.googleLogin({ token });
        await saveAuthToken(authResponse.token);

        if (options?.onLoginSuccess) {
          await options.onLoginSuccess(authResponse);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Google login failed";

        setError(message);
        options?.onLoginError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [options],
  );
// The useEffect hook listens for changes in the authentication response from the Google auth request. When a response is received, it checks for errors and handles successful authentication by extracting the ID token and passing it to the backend login handler. If there are any issues during this process, such as missing tokens or errors from the authentication flow, it sets appropriate error messages and calls the onLoginError callback if provided. This ensures that the app can respond to both successful and failed authentication attempts in a user-friendly manner.
  useEffect(() => {
    if (!response) return;

    if (response.type === "error") {
      const message = response.error?.message || "Google sign-in failed";
      setError(message);
      options?.onLoginError?.(message);
      return;
    }

    if (response.type === "success") {
      const idToken =
        response.authentication?.idToken ||
        (typeof response.params?.id_token === "string"
          ? response.params.id_token
          : undefined);

      if (!idToken) {
        const message = "No ID token returned from Google";
        setError(message);
        options?.onLoginError?.(message);
        return;
      }

      void handleBackendLogin(idToken);
    }
  }, [handleBackendLogin, options, response]);
// The promptGoogleAuth function is responsible for initiating the Google authentication flow when called. It first checks if the authentication request object is available, which indicates that the hook has been properly initialized. If the request object is missing, it sets an error message and calls the onLoginError callback if provided. If the request object is present, it calls the promptAsync function to start the authentication process. This function can be used in response to user actions, such as tapping a "Sign in with Google" button, to trigger the authentication flow.
  const promptGoogleAuth = useCallback(async () => {
    setError(null);

    if (!request) {
      const message = "Google auth not ready";
      setError(message);
      options?.onLoginError?.(message);
      return;
    }

    await promptAsync();
  }, [options, promptAsync, request]);

  return {
    promptGoogleAuth,
    isReady: Boolean(request),
    loading,
    error,
  };
};

export default useGoogleAuth;
