import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { authService } from "../services";
import type { AuthResponse } from "../services";

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = "authToken";
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

  const redirectUri = "https://auth.expo.io/@lchkas-organization/client";
  const isExpoGo = Constants.appOwnership === "expo";

  const config: Parameters<typeof Google.useAuthRequest>[0] = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
  };

  if (isExpoGo) {
    config.clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  } else {
    config.iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  }

  const [request, response, promptAsync] = Google.useAuthRequest(config);

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
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, authResponse.token);

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

  const promptGoogleAuth = useCallback(async () => {
    setError(null);

    if (!request) {
      const message = "Google auth not ready";
      setError(message);
      options?.onLoginError?.(message);
      return;
    }

await promptAsync({
  showInRecents: true,
});
  }, [options, promptAsync, request]);

  return {
    promptGoogleAuth,
    isReady: Boolean(request),
    loading,
    error,
  };
};

export default useGoogleAuth;
