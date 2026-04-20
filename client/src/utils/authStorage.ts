/**
 * Authentication Storage Utilities
 * Centralized token storage operations to eliminate code duplication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'authToken';

/**
 * Save authentication token to device storage
 * Used after successful login, registration, or OAuth
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save auth token:', error);
    throw error;
  }
};

/**
 * Retrieve authentication token from device storage
 * Used to check if user is logged in and for API requests
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve auth token:', error);
    return null;
  }
};

/**
 * Clear authentication token from device storage
 * Used during logout to remove persisted credentials
 */
export const clearAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
    throw error;
  }
};
