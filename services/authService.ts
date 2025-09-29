import { BaseApiService, ApiResponse } from './api';
import { healthService } from './healthService';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';

interface AuthCredentials {
  username: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  otp_required: boolean;
  otp_verified: boolean;
  message: string;
  dev_otp?: string;
  email_configured?: boolean;
}

interface OTPVerifyResponse {
  access_token: string;
  token_type: string;
  otp_verified: boolean;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    is_superuser: boolean;
  };
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'rider' | 'driver' | 'courier' | 'admin';
  is_active: boolean;
  is_superuser: boolean;
  onboarding_completed?: boolean;
  profile?: {
    phone_number?: string;
    profile_picture?: string;
    preferences?: any;
  };
}

class AuthService extends BaseApiService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login with email/password - returns format expected by AuthContext
   */
  async login(username: string, password: string): Promise<{ success: boolean; error?: string; token?: string; otp_code?: string }> {
    if (healthService.shouldUseMockMode()) {
      const result = await this.mockLogin({ username, password });
      return {
        success: result.success,
        error: result.error,
        token: result.data?.access_token,
        otp_code: result.data?.dev_otp
      };
    }

    try {
      const form = new URLSearchParams();
      form.append('username', username);
      form.append('password', password);

      const result = await this.post<AuthResponse>(
        '/api/v1/login/access-token',
        form,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      
      return {
        success: result.success,
        error: result.error,
        token: result.data?.access_token,
        otp_code: result.data?.dev_otp
      };
    } catch (error) {
      console.warn('⚠️ Auth Service: Login failed, falling back to mock');
      const result = await this.mockLogin({ username, password });
      return {
        success: result.success,
        error: result.error,
        token: result.data?.access_token,
        otp_code: result.data?.dev_otp
      };
    }
  }

  /**
   * Register new user - returns format expected by AuthContext
   */
  async signup(email: string, password: string, fullName: string, role?: string): Promise<{ success: boolean; error?: string }> {
    const credentials = { email, password, fullName, role };
    
    if (healthService.shouldUseMockMode()) {
      const result = await this.mockSignup(credentials);
      return {
        success: result.success,
        error: result.error
      };
    }

    try {
      const result = await this.post('/api/v1/auth/register', {
        email: credentials.email,
        password: credentials.password,
        full_name: credentials.fullName,
        role: credentials.role || 'rider',
      });
      
      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      console.warn('⚠️ Auth Service: Signup failed, falling back to mock');
      const result = await this.mockSignup(credentials);
      return {
        success: result.success,
        error: result.error
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, code: string): Promise<ApiResponse<OTPVerifyResponse>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockVerifyOTP(email, code);
    }

    try {
      return await this.post<OTPVerifyResponse>('/api/v1/auth/otp/verify', {
        email,
        code,
        purpose: 'login',
      });
    } catch (error) {
      console.warn('⚠️ Auth Service: OTP verify failed, falling back to mock');
      return this.mockVerifyOTP(email, code);
    }
  }

  /**
   * Resend OTP code
   */
  async resendOTP(email: string): Promise<ApiResponse<any>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockResendOTP(email);
    }

    try {
      return await this.post('/api/v1/auth/otp/resend', { email });
    } catch (error) {
      console.warn('⚠️ Auth Service: OTP resend failed, falling back to mock');
      return this.mockResendOTP(email);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<any>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockRequestPasswordReset(email);
    }

    try {
      return await this.post(`/api/v1/password-recovery/${encodeURIComponent(email)}`);
    } catch (error) {
      console.warn('⚠️ Auth Service: Password reset request failed, falling back to mock');
      return this.mockRequestPasswordReset(email);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<any>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockResetPassword(token, newPassword);
    }

    try {
      return await this.post('/api/v1/reset-password/', {
        token,
        new_password: newPassword,
      });
    } catch (error) {
      console.warn('⚠️ Auth Service: Password reset failed, falling back to mock');
      return this.mockResetPassword(token, newPassword);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    if (healthService.shouldUseMockMode()) {
      const result = await this.mockGetCurrentUser();
      return result.data;
    }

    try {
      const result = await this.get<User>('/api/v1/users/me');
      return result.data;
    } catch (error) {
      console.warn('⚠️ Auth Service: Get current user failed, falling back to mock');
      const result = await this.mockGetCurrentUser();
      return result.data;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    if (healthService.shouldUseMockMode()) {
      return this.mockLogout();
    }

    try {
      // Call backend logout endpoint if available
      const result = await this.post('/api/v1/auth/logout');
      
      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      console.warn('⚠️ Auth Service: Logout failed, falling back to mock');
      return this.mockLogout();
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(profileData?: any): Promise<{ success: boolean; error?: string; user?: User }> {
    if (healthService.shouldUseMockMode()) {
      const result = await this.mockCompleteOnboarding(profileData);
      return {
        success: result.success,
        error: result.error,
        user: result.data
      };
    }

    try {
      const result = await this.post<User>('/api/v1/users/me/complete-onboarding', {
        profile_data: profileData
      });
      
      return {
        success: result.success,
        error: result.error,
        user: result.data
      };
    } catch (error) {
      console.warn('⚠️ Auth Service: Complete onboarding failed, falling back to mock');
      const result = await this.mockCompleteOnboarding(profileData);
      return {
        success: result.success,
        error: result.error,
        user: result.data
      };
    }
  }

  // Mock implementations
  private async mockLogin(credentials: AuthCredentials): Promise<ApiResponse<AuthResponse>> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    // Accept admin credentials or any email with "password" as password
    const isValidCredentials = 
      (credentials.username === 'admin@eride.com' && credentials.password === 'admin123') ||
      credentials.password === 'password';

    if (!isValidCredentials) {
      return {
        data: null,
        success: false,
        error: 'Invalid credentials',
      };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Mock Auth: Generated OTP for ${credentials.username}: ${otpCode}`);

    return {
      data: {
        access_token: 'mock_jwt_token_' + Date.now(),
        token_type: 'bearer',
        otp_required: true,
        otp_verified: false,
        message: `Mock OTP generated: ${otpCode}`,
        dev_otp: otpCode,
        email_configured: false,
      },
      success: true,
    };
  }

  private async mockSignup(credentials: SignupCredentials): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    return {
      data: {
        message: 'User created successfully (mock)',
        user_id: Math.floor(Math.random() * 10000),
      },
      success: true,
    };
  }

  private async mockVerifyOTP(email: string, code: string): Promise<ApiResponse<OTPVerifyResponse>> {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

    // Accept any 6-digit code or 123456
    if (code.length !== 6 && code !== '123456') {
      return {
        data: null,
        success: false,
        error: 'Invalid OTP code',
      };
    }

    // Determine role based on email patterns
    let role: 'rider' | 'driver' | 'courier' | 'admin' = 'rider';
    let fullName = 'Mock User';
    
    if (email.includes('admin')) {
      role = 'admin';
      fullName = 'Admin User';
    } else if (email.includes('driver') || email.startsWith('driver@')) {
      role = 'driver';
      fullName = 'Driver User';
    } else if (email.includes('courier') || email.startsWith('courier@')) {
      role = 'courier';
      fullName = 'Courier User';
    } else {
      role = 'rider';
      fullName = 'Rider User';
    }

    const mockUser = {
      id: '1',
      email: email,
      full_name: fullName,
      role: role,
      is_active: true,
      is_superuser: email.includes('admin'),
      onboarding_completed: false, // New users need onboarding
      profile: {
        phone_number: undefined,
        profile_picture: undefined,
        preferences: undefined
      }
    };

    return {
      data: {
        access_token: 'verified_mock_jwt_token_' + Date.now(),
        token_type: 'bearer',
        otp_verified: true,
        user: mockUser,
      },
      success: true,
    };
  }

  private async mockResendOTP(email: string): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Mock Auth: Resent OTP for ${email}: ${otpCode}`);

    return {
      data: {
        message: `Mock OTP resent: ${otpCode}`,
        dev_otp: otpCode,
        email_configured: false,
      },
      success: true,
    };
  }

  private async mockRequestPasswordReset(email: string): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

    const resetToken = 'mock_reset_token_' + Date.now();
    console.log(`🔑 Mock Auth: Password reset token for ${email}: ${resetToken}`);

    return {
      data: {
        message: 'Password recovery email sent (mock)',
        token: resetToken,
      },
      success: true,
    };
  }

  private async mockResetPassword(token: string, newPassword: string): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

    return {
      data: {
        message: 'Password updated successfully (mock)',
      },
      success: true,
    };
  }

  private async mockGetCurrentUser(): Promise<ApiResponse<User>> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    const userData = await enhancedTokenManager.getUserData();
    
    if (!userData) {
      return {
        data: null,
        success: false,
        error: 'No user data found',
      };
    }

    return {
      data: userData,
      success: true,
    };
  }

  private async mockCompleteOnboarding(profileData?: any): Promise<ApiResponse<User>> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    const currentUserData = await enhancedTokenManager.getUserData();
    
    if (!currentUserData) {
      return {
        data: null,
        success: false,
        error: 'No user data available for onboarding completion',
      };
    }

    const updatedUser: User = {
      ...currentUserData,
      onboarding_completed: true,
      profile: {
        ...currentUserData.profile,
        ...profileData
      }
    };

    console.log('🎉 Mock Auth: Onboarding completed for user', updatedUser.email);

    return {
      data: updatedUser,
      success: true,
    };
  }

  private async mockLogout(): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    console.log('🚪 Mock Auth: User logged out successfully');

    return {
      success: true
    };
  }
}

export const authService = AuthService.getInstance();
export type { AuthCredentials, SignupCredentials, AuthResponse, OTPVerifyResponse, User };
