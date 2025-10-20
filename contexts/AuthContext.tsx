import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import { healthService } from '@/services/healthService';
import { authService } from '@/services/authService';
import { socketService } from '@/services/socketService';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  role: 'driver' | 'rider' | 'courier';
  onboarding_completed?: boolean;
  profile?: {
    phone_number?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    preferences?: any;
    profile_completed_at?: string;
  };
}

// Types
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOtpVerified: boolean;
  isLoading: boolean;
  otpRequired: boolean;
  userEmail: string;
  error: string | null;
  initialized: boolean;
  isBackendHealthy: boolean;
  isOnboardingComplete: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { email: string } }
  | { type: 'OTP_VERIFIED'; payload: { user: User; token: string } }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOGOUT' }
  | { type: 'INITIALIZE'; payload: { user: User | null; isOtpVerified: boolean; isBackendHealthy: boolean } }
  | { type: 'SET_BACKEND_HEALTH'; payload: boolean }
  | { type: 'SET_ONBOARDING_STATUS'; payload: boolean };

interface AuthContextType extends AuthState {
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
  fetchUserProfile: () => Promise<User | null>;
}

// JWT decoding utility (kept for verifyOtp fallback)
function decodeTokenSync(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Error decoding token in AuthContext:', error);
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isOtpVerified: false,
  isLoading: false,
  otpRequired: false,
  userEmail: '',
  error: null,
  initialized: false,
  isBackendHealthy: false,
  isOnboardingComplete: false,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        otpRequired: true,
        userEmail: action.payload.email,
        error: null,
      };
    
    case 'OTP_VERIFIED':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isOtpVerified: true,
        otpRequired: false,
        isLoading: false,
        userEmail: '',
        error: null,
        isOnboardingComplete: action.payload.user.onboarding_completed || false,
      };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isOnboardingComplete: action.payload?.onboarding_completed || false,
        initialized: true,
      };
    
    case 'INITIALIZE':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isOtpVerified: action.payload.isOtpVerified,
        isBackendHealthy: action.payload.isBackendHealthy,
        isOnboardingComplete: action.payload.user?.onboarding_completed || false,
        initialized: true,
        isLoading: false,
      };
    
    case 'SET_BACKEND_HEALTH':
      return {
        ...state,
        isBackendHealthy: action.payload,
      };
    
    case 'SET_ONBOARDING_STATUS':
      return {
        ...state,
        isOnboardingComplete: action.payload,
        user: state.user ? { ...state.user, onboarding_completed: action.payload } : null,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        initialized: true,
        isBackendHealthy: state.isBackendHealthy,
      };
    
    default:
      return state;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const healthStatus = await healthService.quickHealthCheck();
      dispatch({ type: 'SET_BACKEND_HEALTH', payload: healthStatus });
      console.log('🔍 Backend health status:', healthStatus ? 'Healthy' : 'Offline');
      
      await checkAuthStatus();
    } catch (error) {
      console.error('Error initializing app:', error);
      dispatch({ type: 'SET_BACKEND_HEALTH', payload: false });
      await checkAuthStatus();
    }
  };

  const fetchUserProfile = async (): Promise<User | null> => {
  try {
    const token = await enhancedTokenManager.getToken();
    if (!token) {
      console.error('No token available to fetch user profile');
      return null;
    }

    // Fetch base user data
    const userResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user data from /users/me');
    }

    const userData = userResponse.ok ? await userResponse.json() : null;
    console.log('✅ Fetched user data:', userData);

    // Fetch onboarding status and profile data
    const onboardingResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/onboarding/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!onboardingResponse.ok) {
        console.error('Failed to fetch onboarding status');
      }

      const onboardingData = onboardingResponse.ok ? await onboardingResponse.json() : null;
      console.log('✅ Fetched onboarding status:', onboardingData);

      // Combine both responses into a single user object
      const combinedUser: User = {
        // Base user data from /users/me
        id: userData?.id,
        email: userData?.email,
        full_name: userData?.full_name,
        is_active: userData?.is_active,
        is_superuser: userData?.is_superuser,
        role: userData?.role,
        // Onboarding status from /onboarding/status
        onboarding_completed: onboardingData?.onboarding_completed,
        // Profile data from /onboarding/status
        profile: onboardingData?.onboarding_profile || undefined,
      };

      console.log('✅ Combined user profile:', combinedUser);
      return combinedUser;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      return null;
    }
  };


  const joinWebSocketRoom = (user: User | null) => {
    if (user && (user.role === 'driver' || user.role === 'rider')) {
      console.log('🔌 Joining WebSocket personal room:', `${user.role}:${user.id}`);
      socketService.joinPersonalRoom(user.id, user.role);
    }
  };

  const checkAuthStatus = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const token = await enhancedTokenManager.getToken();
      if (token) {
        if (enhancedTokenManager.isTokenValid(token)) {
          const userId = await enhancedTokenManager.getUserId();
          const otpVerifiedFromStorage = await enhancedTokenManager.isOtpVerified();
          const otpVerifiedFromToken = await enhancedTokenManager.isOtpVerifiedFromToken();
          const userRole = await enhancedTokenManager.getUserRole();
          const onboardingCompletedFromToken = await enhancedTokenManager.getOnboardingCompletedFromToken();
          const userData = await enhancedTokenManager.getUserData();
          
          const otpVerified = otpVerifiedFromToken !== null ? otpVerifiedFromToken : otpVerifiedFromStorage;
          
          console.log('🔍 Auth Status Check:', {
            userId,
            otpVerifiedFromStorage,
            otpVerifiedFromToken,
            otpVerified,
            userRole,
            onboardingCompletedFromToken,
            hasUserData: !!userData
          });
          
          if (userId && otpVerified) {
            let userToSet = userData;
            
            if (!userData) {
              // Create fallback user data with role and onboarding from JWT
              const fallbackUser = {
                id: userId,
                email: 'user@example.com',
                full_name: 'Demo User',
                is_active: true,
                is_superuser: false,
                role: (userRole as 'rider' | 'driver' | 'courier') || 'rider',
                onboarding_completed: onboardingCompletedFromToken,
              };

              // Fetch full user profile from backend to get profile data
              const fullUser = await fetchUserProfile();
              userToSet = fullUser || fallbackUser;
            } else {
              // Prioritize token values over stored data
              userToSet = {
                ...userData,
                role: (userRole as 'rider' | 'driver' | 'courier') || userData.role || 'rider',
                onboarding_completed: onboardingCompletedFromToken ?? userData.onboarding_completed ?? false,
              };

              // Fetch full profile to ensure latest data is available
              const fullUser = await fetchUserProfile();
              if (fullUser) {
                userToSet = fullUser; // Use fresh data from backend
              }
            }
            
            dispatch({ 
              type: 'INITIALIZE', 
              payload: { 
                user: userToSet, 
                isOtpVerified: otpVerified,
                isBackendHealthy: state.isBackendHealthy
              } 
            });
            joinWebSocketRoom(userToSet);
          } else {
            console.log('⚠️ Token found but not fully authenticated', { userId, otpVerified });
            dispatch({ 
              type: 'INITIALIZE', 
              payload: { 
                user: null, 
                isOtpVerified: false,
                isBackendHealthy: state.isBackendHealthy
              } 
            });
          }
        } else {
          console.log('Token is expired or invalid, clearing authentication');
          await enhancedTokenManager.clearAllData();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('No token found, user not authenticated');
        dispatch({ 
          type: 'INITIALIZE', 
          payload: { 
            user: null, 
            isOtpVerified: false,
            isBackendHealthy: state.isBackendHealthy
          } 
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await enhancedTokenManager.clearAllData();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (credentials: { username: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const result = await authService.login(credentials.username, credentials.password);
      
      if (result.success && result.token) {
        await enhancedTokenManager.setTokenWithOtpStatus(result.token, false);
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { email: credentials.username } 
        });
        
        if (result.otp_code && process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
          console.log('🔐 DEV MODE - OTP CODE:', result.otp_code);
        }
        
        return { success: true };
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (credentials: { email: string; password: string; fullName: string; role?: string }): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const result = await authService.signup(credentials.email, credentials.password, credentials.fullName, credentials.role);
      
      if (result.success) {
        console.log('✅ Registration successful, attempting auto-login...');
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
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const verifyOtp = async (otpCode: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!state.userEmail) {
      const error = 'No email available for OTP verification';
      dispatch({ type: 'SET_ERROR', payload: error });
      return { success: false, error };
    }
    
    console.log('🔐 Starting OTP verification for:', state.userEmail);
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.userEmail,
          code: otpCode,
          purpose: "login",
        }),
      });
      
      const data = await response.json();
      console.log('🔐 OTP verification response:', { 
        status: response.status, 
        hasUser: !!data.user, 
        userEmail: data.user?.email 
      });
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP code');
      }
      
      let userToStore = data.user;
      
      if (!userToStore) {
        console.log('⚠️ No user data returned from OTP verification, creating fallback');
        
        const decoded = decodeTokenSync(data.access_token);
        const roleFromToken = decoded?.role || 'rider';
        const onboardingFromToken = decoded?.onboarding_completed ?? false;

        // Fetch full user profile from backend instead of using fallback
        userToStore = await fetchUserProfile();
        
        if (!userToStore) {
          // Fallback if backend call fails
          userToStore = {
            id: decoded?.sub || '1',
            email: state.userEmail,
            full_name: state.userEmail.split('@')[0],
            is_active: true,
            is_superuser: false,
            role: roleFromToken as 'rider' | 'driver' | 'courier',
            onboarding_completed: onboardingFromToken,
          };
        }
      }
      
      if (userToStore.onboarding_completed === undefined) {
        userToStore.onboarding_completed = false;
      }
      
      console.log('✅ Setting user data:', {
        email: userToStore.email,
        onboarding_completed: userToStore.onboarding_completed
      });
      
      await enhancedTokenManager.setTokenWithOtpStatus(data.access_token, true, userToStore);
      
      dispatch({ 
        type: 'OTP_VERIFIED', 
        payload: { user: userToStore, token: data.access_token } 
      });
      
      joinWebSocketRoom(userToStore);

      console.log('✅ OTP verification completed successfully');
      return { success: true, user: userToStore };
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error);
      
      if (error.message?.includes('fetch') || error.message?.includes('Network') || !state.isBackendHealthy) {
        console.log('🔄 Backend unavailable, attempting fallback OTP verification');
        
        if (otpCode === '123456' || (process.env.EXPO_PUBLIC_DEV_MODE === 'true' && otpCode.length === 6)) {
          console.log('✅ Fallback OTP verification successful');
          
          const fallbackUser = {
            id: '1',
            email: state.userEmail,
            full_name: state.userEmail.split('@')[0],
            is_active: true,
            is_superuser: false,
            role: 'rider' as 'rider' | 'driver' | 'courier',
            onboarding_completed: false, // Fallback assumes not onboarded
          };
          
          const mockToken = 'fallback_jwt_token_' + Date.now();
          await enhancedTokenManager.setTokenWithOtpStatus(mockToken, true, fallbackUser);
          
          dispatch({ 
            type: 'OTP_VERIFIED', 
            payload: { user: fallbackUser, token: mockToken } 
          });
          
          return { success: true, user: fallbackUser };
        }
      }
      
      const errorMessage = error.message || 'OTP verification failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const resendOtp = async (email?: string): Promise<{ success: boolean; error?: string }> => {
    const emailToUse = email || state.userEmail;
    if (!emailToUse) {
      const error = 'No email available for OTP resend';
      dispatch({ type: 'SET_ERROR', payload: error });
      return { success: false, error };
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

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
      
      if (data.dev_otp && process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
        console.log('🔐 DEV MODE - RESEND OTP CODE:', data.dev_otp);
      }

      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend OTP';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

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

      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Password recovery failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (state.isBackendHealthy) {
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
      
      await enhancedTokenManager.clearAllData();
      console.log('✅ Token manager data cleared');
      
      dispatch({ type: 'LOGOUT' });
      console.log('✅ Auth state reset');
      
      console.log('🔓 Logout completed successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData: Partial<User>) => {
  if (state.user) {
    const updatedUser = { 
      ...state.user, 
      ...userData,
      // Ensure profile is preserved if not being updated
      profile: userData.profile || state.user.profile
    };
    dispatch({ type: 'SET_USER', payload: updatedUser });
    // Optionally save to storage as well
    enhancedTokenManager.setUserData(updatedUser).catch(console.error);
  }
};

  const completeOnboarding = async (profileData?: any): Promise<{ success: boolean; error?: string }> => {
    console.log('🎯 Starting onboarding completion with backend sync...');
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Always call the backend first
      const token = await enhancedTokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_number: profileData?.phone_number,
          emergency_contact_name: profileData?.emergency_contact,
          emergency_contact_phone: profileData?.emergency_phone,
          preferences: profileData?.preferences,
          skip_profile: !profileData || Object.keys(profileData).length === 0,
        }),
      });

      const data = await response.json();
      console.log('✅ Backend onboarding response:', { status: response.status, data });

      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Failed to complete onboarding';
        throw new Error(errorMessage);
      }

      // Update local state with the returned user (which has onboarding_completed: true)
      const updatedUser = {
        ...state.user,
        ...data.user,
        onboarding_completed: true,
        profile: profileData || state.user?.profile,
      };

      await enhancedTokenManager.setUserData(updatedUser);
      dispatch({ type: 'SET_USER', payload: updatedUser });
      dispatch({ type: 'SET_ONBOARDING_STATUS', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });

      console.log('✅ Onboarding completed successfully with backend sync');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Onboarding completion error:', error);
      
      // Optional: Fallback to local-only completion if backend is down
      if (!state.isBackendHealthy) {
        console.warn('⚠️ Backend unavailable, falling back to local onboarding completion');
        const fallbackUser = {
          ...state.user,
          onboarding_completed: true,
          profile: profileData || state.user?.profile,
        };
        await enhancedTokenManager.setUserData(fallbackUser);
        dispatch({ type: 'SET_USER', payload: fallbackUser });
        dispatch({ type: 'SET_ONBOARDING_STATUS', payload: true });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true };
      }

      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: error.message };
    }
  };
  
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value: AuthContextType = {
    ...state,
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
    fetchUserProfile,
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