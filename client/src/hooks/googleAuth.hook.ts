import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { authService } from '../services';
import type { AuthResponse } from '../services';

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = 'authToken';

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

export const useGoogleAuth = (options?: UseGoogleAuthOptions): UseGoogleAuthReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectUri = 'https://auth.expo.io/@lchkas-organization/client';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

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
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
            'string'
            ? (err as { response?: { data?: { message?: string } } }).response!.data!.message!
            : err instanceof Error
              ? err.message
              : 'Google login failed';

        setError(message);
        options?.onLoginError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === 'error') {
      const message = response.error?.message || 'Google sign-in failed';
      setError(message);
      options?.onLoginError?.(message);
      return;
    }

    if (response.type === 'success') {
      const idTokenFromAuth = response.authentication?.idToken;
      const idTokenFromParams =
        typeof response.params?.id_token === 'string' ? response.params.id_token : undefined;
      const idToken = idTokenFromAuth || idTokenFromParams;

      if (!idToken) {
        const message =
          'Google did not return an ID token. Check EXPO_PUBLIC_GOOGLE_*_CLIENT_ID values.';
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
      const message =
        'Google auth request is not ready. Check EXPO_PUBLIC_GOOGLE_*_CLIENT_ID environment variables.';
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
