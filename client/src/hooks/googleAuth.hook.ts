import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { authService } from '../services';
import type { AuthResponse } from '../services';

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = 'authToken';
const GOOGLE_AUTH_DEBUG_PREFIX = '[GoogleAuthDebug]';

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
  const isExpoGo = Constants.appOwnership === 'expo';

  const googleConfig: Parameters<typeof Google.useAuthRequest>[0] = {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
  };

  if (!isExpoGo) {
    googleConfig.iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  }

  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);

  useEffect(() => {
    console.log(
      `${GOOGLE_AUTH_DEBUG_PREFIX} hook initialized`,
      JSON.stringify({
        isExpoGo,
        redirectUri,
        hasClientId: Boolean(process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID),
        hasIosClientId: Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
        hasWebClientId: Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
      }),
    );
  }, [isExpoGo, redirectUri]);

  useEffect(() => {
    if (!request) {
      console.log(`${GOOGLE_AUTH_DEBUG_PREFIX} auth request not ready yet`);
      return;
    }

    console.log(
      `${GOOGLE_AUTH_DEBUG_PREFIX} auth request ready`,
      JSON.stringify({
        url: request.url,
        redirectUri: request.redirectUri,
      }),
    );
  }, [request]);

  const handleBackendLogin = useCallback(
    async (token: string) => {
      console.log(
        `${GOOGLE_AUTH_DEBUG_PREFIX} backend exchange start`,
        JSON.stringify({
          tokenLength: token.length,
          tokenPrefix: token.slice(0, 12),
        }),
      );

      setLoading(true);
      setError(null);

      try {
        const authResponse = await authService.googleLogin({ token });
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, authResponse.token);

        console.log(
          `${GOOGLE_AUTH_DEBUG_PREFIX} backend exchange success`,
          JSON.stringify({
            userId: authResponse.user.id,
            email: authResponse.user.email,
          }),
        );

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

        console.log(
          `${GOOGLE_AUTH_DEBUG_PREFIX} backend exchange failed`,
          JSON.stringify({
            message,
          }),
        );

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
      console.log(`${GOOGLE_AUTH_DEBUG_PREFIX} no auth response yet`);
      return;
    }

    console.log(
      `${GOOGLE_AUTH_DEBUG_PREFIX} auth response received`,
      JSON.stringify({
        type: response.type,
        hasAuthentication: Boolean(response.authentication),
        paramsKeys: Object.keys(response.params || {}),
        errorCode: response.type === 'error' ? response.error?.code : undefined,
        errorMessage: response.type === 'error' ? response.error?.message : undefined,
      }),
    );

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

      console.log(
        `${GOOGLE_AUTH_DEBUG_PREFIX} token extraction`,
        JSON.stringify({
          hasIdTokenFromAuthentication: Boolean(idTokenFromAuth),
          hasIdTokenFromParams: Boolean(idTokenFromParams),
        }),
      );

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

    console.log(`${GOOGLE_AUTH_DEBUG_PREFIX} prompt requested`);

    if (!request) {
      const message =
        'Google auth request is not ready. Check EXPO_PUBLIC_GOOGLE_*_CLIENT_ID environment variables.';
      setError(message);
      options?.onLoginError?.(message);
      return;
    }

    console.log(`${GOOGLE_AUTH_DEBUG_PREFIX} opening auth prompt`);
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
