import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface DecodedToken {
  exp: number;
  user_id: string;
  email: string;
  [key: string]: any;
}

// Platform-specific storage abstraction
class PlatformStorage {
  static async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('Web storage not available, using memory storage');
        // Fallback to in-memory storage for web
        (window as any).__expo_storage = (window as any).__expo_storage || {};
        (window as any).__expo_storage[key] = value;
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  static async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('Web storage not available, using memory storage');
        // Fallback to in-memory storage for web
        const memoryStorage = (window as any).__expo_storage || {};
        return memoryStorage[key] || null;
      }
    } else {
      return await SecureStore.getItemAsync(key);
    }
  }

  static async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Web storage not available, using memory storage');
        // Fallback to in-memory storage for web
        const memoryStorage = (window as any).__expo_storage || {};
        delete memoryStorage[key];
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
}

class EnhancedTokenManager {
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly OTP_VERIFIED_KEY = 'otp_verified';
  private readonly USER_DATA_KEY = 'user_data';
  private readonly ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

  // Decode JWT token (simplified version without external library)
  private decodeToken(token: string): DecodedToken | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await PlatformStorage.setItemAsync(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await PlatformStorage.getItemAsync(this.TOKEN_KEY);
      if (token && this.isTokenValid(token)) {
        return token;
      }
      // Token is invalid, clear it
      if (token) {
        await this.clearToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setRefreshToken(refreshToken: string): Promise<void> {
    try {
      await PlatformStorage.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await PlatformStorage.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await PlatformStorage.deleteItemAsync(this.TOKEN_KEY);
      await PlatformStorage.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  isTokenValid(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return false;
    
    const now = Date.now() / 1000;
    return decoded.exp > now;
  }

  async getUserId(): Promise<string | null> {
    try {
      const token = await PlatformStorage.getItemAsync(this.TOKEN_KEY);
      if (!token) return null;
      
      const decoded = this.decodeToken(token);
      // Convert user_id to string to ensure consistency
      return decoded?.user_id ? String(decoded.user_id) : null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  async getTimeUntilExpiry(): Promise<number> {
    try {
      const token = await PlatformStorage.getItemAsync(this.TOKEN_KEY);
      if (!token) return 0;
      
      const decoded = this.decodeToken(token);
      if (!decoded) return 0;
      
      const now = Date.now() / 1000;
      return Math.max(0, (decoded.exp - now) * 1000);
    } catch (error) {
      console.error('Error getting time until expiry:', error);
      return 0;
    }
  }

  // OTP Verification Status Methods
  async setOtpVerified(verified: boolean): Promise<void> {
    try {
      await PlatformStorage.setItemAsync(this.OTP_VERIFIED_KEY, verified.toString());
    } catch (error) {
      console.error('Error setting OTP verification status:', error);
    }
  }

  async isOtpVerified(): Promise<boolean> {
    try {
      const verified = await PlatformStorage.getItemAsync(this.OTP_VERIFIED_KEY);
      return verified === 'true';
    } catch (error) {
      console.error('Error getting OTP verification status:', error);
      return false;
    }
  }

  // User Data Methods
  async setUserData(userData: any): Promise<void> {
    try {
      await PlatformStorage.setItemAsync(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const userData = await PlatformStorage.getItemAsync(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Onboarding Status Methods
  async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await PlatformStorage.setItemAsync(this.ONBOARDING_COMPLETED_KEY, completed.toString());
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  }

  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await PlatformStorage.getItemAsync(this.ONBOARDING_COMPLETED_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return false;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await PlatformStorage.deleteItemAsync(this.TOKEN_KEY);
      await PlatformStorage.deleteItemAsync(this.REFRESH_TOKEN_KEY);
      await PlatformStorage.deleteItemAsync(this.OTP_VERIFIED_KEY);
      await PlatformStorage.deleteItemAsync(this.USER_DATA_KEY);
      // Note: We typically don't clear onboarding status on logout
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  // Enhanced token setting with OTP status
  async setTokenWithOtpStatus(token: string, otpVerified: boolean, userData?: any): Promise<void> {
    await this.setToken(token);
    await this.setOtpVerified(otpVerified);
    if (userData) {
      await this.setUserData(userData);
    }
  }

  // Check if user is fully authenticated (has token and OTP verified)
  async isFullyAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    const otpVerified = await this.isOtpVerified();
    return Boolean(token && otpVerified);
  }
}

export const enhancedTokenManager = new EnhancedTokenManager();
