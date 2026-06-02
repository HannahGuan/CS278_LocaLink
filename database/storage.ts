import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Custom storage implementation for Supabase Auth
 * Uses expo-secure-store which works with Expo Go
 */
export const expoSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // For web, use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            return window.localStorage.getItem(key);
          } catch (storageError) {
            console.error('localStorage.getItem failed:', storageError);
            return null;
          }
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from secure storage:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // For web, use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(key, value);
          } catch (storageError) {
            // localStorage might be full or disabled
            console.error('localStorage.setItem failed:', storageError);
            // Try to clear old items if quota exceeded
            if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
              console.warn('localStorage quota exceeded, clearing old auth data...');
              try {
                // Clear old Supabase auth keys
                const keys = Object.keys(window.localStorage);
                keys.forEach(k => {
                  if (k.startsWith('supabase.auth.token') && k !== key) {
                    window.localStorage.removeItem(k);
                  }
                });
                // Retry setting the item
                window.localStorage.setItem(key, value);
              } catch (retryError) {
                console.error('Failed to recover from quota error:', retryError);
              }
            }
          }
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting item in secure storage:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // For web, use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.removeItem(key);
          } catch (storageError) {
            console.error('localStorage.removeItem failed:', storageError);
          }
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from secure storage:', error);
    }
  },
};
