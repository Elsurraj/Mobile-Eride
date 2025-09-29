import { useState, useEffect } from 'react';
import { authService, User } from '@/services/authService';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';

interface LoginCredentials {
  username: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

interface OTPVerifyData {
  email: string;
  otpCode: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  otp_required?: boolean;
  otp_verified?: boolean;
  dev_otp?: string;
}

interface OTPVerifyResponse {
  access_token: string;
  token_type: string;
  otp_verified: boolean;
  user: User;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  const isLoggedIn = async (): Promise<boolean> => {
    const token = await enhancedTokenManager.getToken();
    const otpVerified = await enhancedTokenManager.isOtpVerified();
    return Boolean(token && otpVerified);
  };

  // Get current user data
  useEffect(() => {
    const initializeUser = async () => {
      if (await isLoggedIn()) {
        const userData = await enhancedTokenManager.getUserData();
        if (userData) {
          setUser(userData);
        } else {
          // Try to fetch from server
          try {
            const serverUser = await authService.getCurrentUser();
            if (serverUser) {
              setUser(serverUser);
              await enhancedTokenManager.setUserData(serverUser);
            }
          } catch (error) {
            console.warn('Failed to fetch user data from server:', error);
          }
        }
      }
    };

    initializeUser();
  }, []);

  // Step 1: Login and get OTP token (matching frontend pattern)
  const login = async (data: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login(data.username, data.password);
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      // Return format expected by frontend
      const response: AuthResponse = {
        access_token: result.token || '',
        token_type: 'bearer',
        otp_required: true,
        otp_verified: false,
        dev_otp: result.otp_code,
      };

      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login mutation wrapper (for compatibility)
  const loginMutation = {
    mutateAsync: login,
    isLoading,
    error,
  };

  // Step 2: Verify OTP and get verified token (matching frontend pattern)
  const verifyOtp = async (data: OTPVerifyData): Promise<OTPVerifyResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          code: data.otpCode,
          purpose: 'login',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'OTP verification failed');
      }

      // Store token and user data
      if (responseData.access_token) {
        await enhancedTokenManager.setTokenWithOtpStatus(
          responseData.access_token,
          true,
          responseData.user
        );
        setUser(responseData.user);
      }

      return {
        access_token: responseData.access_token,
        token_type: 'bearer',
        otp_verified: true,
        user: responseData.user,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'OTP verification failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // OTP verification mutation wrapper
  const verifyOtpMutation = {
    mutateAsync: verifyOtp,
    isLoading,
    error,
    onSuccess: (response: OTPVerifyResponse) => {
      setUser(response.user);
    },
  };

  // Resend OTP
  const resendOtp = async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.resendOTP(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to resend OTP');
      }

      // Log OTP for development if available
      if (result.data?.dev_otp && process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
        console.log('🔐 DEV MODE - RESEND OTP CODE:', result.data.dev_otp);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend OTP';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP mutation wrapper
  const resendOtpMutation = {
    mutateAsync: resendOtp,
    isLoading,
    error,
  };

  // User registration
  const signUp = async (data: SignupCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.signup(
        data.email,
        data.password,
        data.fullName,
        data.role
      );

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup mutation wrapper
  const signUpMutation = {
    mutateAsync: signUp,
    isLoading,
    error,
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      // Call backend logout
      await authService.logout();
      
      // Clear local data
      await enhancedTokenManager.clearAllData();
      setUser(null);
      setError(null);
    } catch (error) {
      console.warn('Logout error:', error);
      // Even if backend logout fails, clear local data
      await enhancedTokenManager.clearAllData();
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status
  const isAuthenticated = Boolean(user && isLoggedIn());

  // Clear error
  const clearError = () => setError(null);

  return {
    // Queries
    user,
    userError: error,
    
    // Mutations (frontend-compatible)
    signUpMutation,
    loginMutation,
    verifyOtpMutation,
    resendOtpMutation,
    
    // Actions
    logout,
    clearError,
    
    // State
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
  };
};

export { useAuth as default, useAuth };
