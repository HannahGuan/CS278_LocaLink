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
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
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
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
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
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from secure storage:', error);
    }
  },
};
