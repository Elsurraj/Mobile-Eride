import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import { healthService } from '@/services/healthService';
import { authService } from '@/services/authService';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  role?: 'driver' | 'rider' | 'courier';
  onboarding_completed?: boolean;
  profile?: {
    phone_number?: string;
    profile_picture?: string;
    preferences?: any;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOtpVerified: boolean;
  otpRequired: boolean;
  userEmail: string;
  error: string | null;
  initialized: boolean;
  isBackendHealthy: boolean;
  isOnboardingComplete: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signup: (credentials: { email: string; password: string; fullName: string; role?: string }) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otpCode: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  completeOnboarding: (profileData?: any) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  resendOtp: (email?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Initialize health check and check for existing token on app start
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize health check first
      const healthStatus = await healthService.checkHealth();
      setIsBackendHealthy(healthStatus);
      console.log('🔍 Backend health status:', healthStatus ? 'Healthy' : 'Offline');
      
      // Then check auth status
      await checkAuthStatus();
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsBackendHealthy(false);
      await checkAuthStatus();
    }
  };

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const token = await enhancedTokenManager.getToken();
      if (token) {
        // Check if token is valid and not expired
        if (enhancedTokenManager.isTokenValid(token)) {
          const userId = await enhancedTokenManager.getUserId();
          const otpVerified = await enhancedTokenManager.isOtpVerified();
          const userData = await enhancedTokenManager.getUserData();
          
          if (userId && otpVerified) {
            // User is fully authenticated
            if (userData) {
              setUser(userData);
              // Check onboarding status
              setIsOnboardingComplete(userData.onboarding_completed || false);
            } else {
              // Try to fetch fresh user data from backend if available
              if (isBackendHealthy) {
                try {
                  const freshUserData = await authService.getCurrentUser();
                  if (freshUserData) {
                    await enhancedTokenManager.setUserData(freshUserData);
                    setUser(freshUserData);
                    setIsOnboardingComplete(freshUserData.onboarding_completed || false);
                  } else {
                    // Fallback user data if backend call fails
                    const fallbackUser = {
                      id: userId,
                      email: 'user@example.com',
                      full_name: 'Demo User',
                      is_active: true,
                      is_superuser: false,
                      role: 'rider' as const,
                      onboarding_completed: false,
                    };
                    setUser(fallbackUser);
                    setIsOnboardingComplete(false);
                  }
                } catch (error) {
                  console.log('Failed to fetch fresh user data, using fallback');
                  const fallbackUser = {
                    id: userId,
                    email: 'user@example.com',
                    full_name: 'Demo User',
                    is_active: true,
                    is_superuser: false,
                    role: 'rider' as const,
                    onboarding_completed: false,
                  };
                  setUser(fallbackUser);
                  setIsOnboardingComplete(false);
                }
              } else {
                // Fallback user data when backend is not healthy
                const fallbackUser = {
                  id: userId,
                  email: 'user@example.com',
                  full_name: 'Demo User',
                  is_active: true,
                  is_superuser: false,
                  role: 'rider' as const,
                  onboarding_completed: false,
                };
                setUser(fallbackUser);
                setIsOnboardingComplete(false);
              }
            }
            setIsAuthenticated(true);
            setIsOtpVerified(true);
          } else if (userId && !otpVerified) {
            // User logged in but OTP not verified
            setOtpRequired(true);
            setIsAuthenticated(false);
            setIsOtpVerified(false);
            setIsOnboardingComplete(false);
          }
        } else {
          // Token is expired or invalid
          console.log('Token is expired or invalid, clearing authentication');
          await enhancedTokenManager.clearAllData();
          resetAuthState();
        }
      } else {
        resetAuthState();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await enhancedTokenManager.clearAllData();
      resetAuthState();
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  };
  
  const resetAuthState = () => {
    console.log('🔄 Resetting authentication state...');
    setUser(null);
    setIsAuthenticated(false);
    setIsOtpVerified(false);
    setOtpRequired(false);
    setUserEmail('');
    setError(null);
    setIsOnboardingComplete(false);
    console.log('✅ Authentication state reset complete');
  };

  const login = async (credentials: { username: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (isBackendHealthy) {
        // Use authService when backend is healthy
        result = await authService.login(credentials.username, credentials.password);
      } else {
        // Fallback to direct API call if authService is not available
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/login/access-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
        
        result = {
          success: true,
          token: data.access_token,
          otp_code: data.dev_otp
        };
      }
      
      if (result.success && result.token) {
        // Store token (OTP not verified yet)
        await enhancedTokenManager.setTokenWithOtpStatus(result.token, false);
        
        setUserEmail(credentials.username);
        setOtpRequired(true);
        setIsLoading(false);
        
        // Log OTP for development if available
        if (result.otp_code && process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
          console.log('🔐 DEV MODE - OTP CODE:', result.otp_code);
        }
        
        return { success: true, otp_code: result.otp_code };
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  const signup = async (credentials: { email: string; password: string; fullName: string; role?: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (isBackendHealthy) {
        // Use authService when backend is healthy
        result = await authService.signup(credentials.email, credentials.password, credentials.fullName, credentials.role);
      } else {
        // Fallback to direct API call
        console.log('🔵 Making signup API call to backend...');
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            full_name: credentials.fullName,
            role: credentials.role || 'rider',
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        
        result = { success: true };
      }
      
      if (result.success) {
        console.log('✅ Registration successful, attempting auto-login...');
        
        // Auto-login after successful registration
        const loginResult = await login({ 
          username: credentials.email, 
          password: credentials.password 
        });
        
        return loginResult;
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const verifyOtp = async (otpCode: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!userEmail) {
      const error = 'No email available for OTP verification';
      setError(error);
      return { success: false, error };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          code: otpCode,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP code');
      }
      
      // Update token as verified and store user data
      await enhancedTokenManager.setTokenWithOtpStatus(data.access_token, true, data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);
      setIsOtpVerified(true);
      setOtpRequired(false);
      setUserEmail('');
      setIsOnboardingComplete(data.user?.onboarding_completed || false);
      setIsLoading(false);
      
      return { success: true, user: data.user };
    } catch (error: any) {
      const errorMessage = error.message || 'OTP verification failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const resendOtp = async (email?: string): Promise<{ success: boolean; error?: string }> => {
    const emailToUse = email || userEmail;
    if (!emailToUse) {
      const error = 'No email available for OTP resend';
      setError(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/otp/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToUse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      
      // Log OTP for development if available
      if (data.dev_otp && process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
        console.log('🔐 DEV MODE - RESEND OTP CODE:', data.dev_otp);
      }

      setIsLoading(false);
      return { success: true, otp_code: data.dev_otp };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend OTP';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/password-recovery/${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password recovery failed');
      }

      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Password recovery failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    setIsLoading(true);
    
    try {
      // Call backend logout if available
      if (isBackendHealthy) {
        try {
          const result = await authService.logout();
          if (result.success) {
            console.log('✅ Backend logout successful');
          } else {
            console.warn('⚠️ Backend logout failed:', result.error);
          }
        } catch (error) {
          console.warn('⚠️ Backend logout request failed:', error);
        }
      }
      
      // Clear all stored data
      await enhancedTokenManager.clearAllData();
      console.log('✅ Token manager data cleared');
      
      // Reset all authentication state
      resetAuthState();
      console.log('✅ Auth state reset');
      
      console.log('🔓 Logout completed successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Even if there's an error, still reset the state to ensure user is logged out
      resetAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
    // Update onboarding status if it's part of the update
    if (userData.onboarding_completed !== undefined) {
      setIsOnboardingComplete(userData.onboarding_completed);
    }
  };

  const completeOnboarding = async (profileData?: any): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user available for onboarding' };
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (isBackendHealthy) {
        // Use authService when backend is healthy
        result = await authService.completeOnboarding(profileData);
      } else {
        // Mock completion for offline mode
        result = { 
          success: true, 
          user: { 
            ...user, 
            onboarding_completed: true,
            profile: profileData 
          } 
        };
      }

      if (result.success) {
        const updatedUser = result.user || { ...user, onboarding_completed: true, profile: profileData };
        
        // Update stored user data
        await enhancedTokenManager.setUserData(updatedUser);
        setUser(updatedUser);
        setIsOnboardingComplete(true);
        setIsLoading(false);

        return { success: true };
      } else {
        throw new Error(result.error || 'Onboarding completion failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Onboarding completion failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isOtpVerified,
    otpRequired,
    userEmail,
    error,
    initialized,
    isBackendHealthy,
    isOnboardingComplete,
    login,
    signup,
    verifyOtp,
    logout,
    updateUser,
    completeOnboarding,
    clearError,
    checkAuthStatus,
    resendOtp,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
