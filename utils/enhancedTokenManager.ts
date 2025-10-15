import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
  otp_verified: boolean;
  user_id: string;
}

interface StoredTokenData {
  token: string;
  otpVerified: boolean;
  expiresAt: number;
  userId: string;
}

interface DecodedToken {
  sub: string; // Subject (user ID)
  exp: number; // Expiration timestamp
  iat?: number; // Issued at
  otp_verified: boolean; // OTP verification status
  role: string; // User role (rider, driver, courier)
  user_id?: string; // Alternative user ID field
  email?: string; // Email (may not be in JWT)
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

  // Decode JWT token with proper validation
  private decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format: token does not have 3 parts');
        return null;
      }
      
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      
      // Validate required fields
      if (!decoded.sub && !decoded.user_id) {
        console.error('Invalid JWT: missing subject/user_id');
        return null;
      }
      if (!decoded.exp) {
        console.error('Invalid JWT: missing expiration');
        return null;
      }
      
      // Normalize user ID field
      if (!decoded.sub && decoded.user_id) {
        decoded.sub = decoded.user_id;
      }
      
      console.log('🔍 Decoded JWT:', {
        sub: decoded.sub,
        exp: new Date(decoded.exp * 1000),
        otp_verified: decoded.otp_verified,
        role: decoded.role
      });
      
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
        await this.clearAllData();
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

  async clearTokensAsync(): Promise<void> {
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
      // Use 'sub' field as primary, fallback to user_id
      const userId = decoded?.sub || decoded?.user_id;
      return userId ? String(userId) : null;
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

  // Frontend-compatible methods
  
  /**
   * Get stored token data synchronously (for immediate checks)
   */
  getTokenData(): StoredTokenData | null {
    try {
      // For mobile, we need to make this async-compatible
      // This is a sync version for immediate checks
      if (Platform.OS === 'web') {
        try {
          const token = localStorage.getItem('jwt_token');
          const otpVerified = localStorage.getItem('otp_verified') === 'true';
          if (!token) return null;
          
          const decoded = this.decodeToken(token);
          if (!decoded) return null;
          
          return {
            token,
            otpVerified,
            expiresAt: decoded.exp * 1000,
            userId: decoded.user_id || decoded.sub,
          };
        } catch {
          return null;
        }
      }
      // For native, this will return null and caller should use async methods
      return null;
    } catch (error) {
      console.error('Token data retrieval error:', error);
      return null;
    }
  }

  /**
   * Check if token exists and is valid (synchronous for web, async fallback for native)
   */
  hasValidToken(): boolean {
    if (Platform.OS === 'web') {
      const tokenData = this.getTokenData();
      if (!tokenData) return false;
      const now = Date.now();
      return now < tokenData.expiresAt;
    }
    // For native platforms, this should be used with async methods
    return false;
  }

  /**
   * Check if token is expired (synchronous for web)
   */
  isTokenExpired(): boolean {
    if (Platform.OS === 'web') {
      const tokenData = this.getTokenData();
      if (!tokenData) return true;
      const now = Date.now();
      return now >= tokenData.expiresAt;
    }
    // For native platforms, use async methods
    return true;
  }

  /**
   * Get authorization header value
   */
  async getAuthHeader(): Promise<string | null> {
    const token = await this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Get current user ID synchronously (web only)
   */
  getUserIdSync(): string | null {
    if (Platform.OS === 'web') {
      const tokenData = this.getTokenData();
      return tokenData?.userId || null;
    }
    return null;
  }

  /**
   * Check if user can access dashboard (authenticated + OTP verified)
   */
  async canAccessDashboard(): Promise<boolean> {
    const token = await this.getToken();
    const otpVerified = await this.isOtpVerified();
    return Boolean(token && otpVerified);
  }

  /**
   * Synchronous version of canAccessDashboard for route guards (web only)
   */
  canAccessDashboardSync(): boolean {
    if (Platform.OS === 'web') {
      return this.hasValidToken() && this.getTokenData()?.otpVerified === true;
    }
    return false;
  }

  /**
   * Clear all stored token data (frontend-compatible)
   */
  clearToken(): void {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('otp_verified');
        localStorage.removeItem('user_data');
      } catch (error) {
        console.error('Error clearing tokens (sync):', error);
      }
    } else {
      // For native, use the async version
      this.clearAllData().catch(console.error);
    }
  }

  // Role Management Methods
  async getUserRole(): Promise<string | null> {
    try {
      const token = await PlatformStorage.getItemAsync(this.TOKEN_KEY);
      if (!token) return null;
      
      const decoded = this.decodeToken(token);
      return decoded?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  getUserRoleSync(): string | null {
    if (Platform.OS === 'web') {
      const tokenData = this.getTokenData();
      if (!tokenData) return null;
      
      try {
        const decoded = this.decodeToken(tokenData.token);
        return decoded?.role || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  async isOtpVerifiedFromToken(): Promise<boolean> {
    try {
      const token = await PlatformStorage.getItemAsync(this.TOKEN_KEY);
      if (!token) return false;
      
      const decoded = this.decodeToken(token);
      return decoded?.otp_verified || false;
    } catch (error) {
      console.error('Error checking OTP verification from token:', error);
      return false;
    }
  }

  async getOnboardingCompletedFromToken(): Promise<boolean> {
    try {
      const token = await PlatformStorage.getItemAsync(this.TOKEN_KEY);
      if (!token) return false;
    
      const decoded = this.decodeToken(token);
      return decoded?.onboarding_completed ?? false;
    } catch (error) {
      console.error('Error getting onboarding status from token:', error);
      return false;
    }
  }

  /**
   * Initialize token manager
   */
  initialize(): void {
    console.log('Enhanced token manager initialized for mobile');
  }
}

export const enhancedTokenManager = new EnhancedTokenManager();

// Initialize on import
enhancedTokenManager.initialize();

export default enhancedTokenManager;
