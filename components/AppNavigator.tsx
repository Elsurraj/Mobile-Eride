import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import OTPScreen from './OTPScreen';
import Dashboard from './Dashboard';
import BottomNav from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';

type AppState = 
  | 'splash' 
  | 'login' 
  | 'signup' 
  | 'forgot-password'
  | 'otp' 
  | 'dashboard';

const AppNavigator: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>('splash');
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  const { isAuthenticated, isLoading, login } = useAuth();

  // Handle auth state changes
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setCurrentState('dashboard');
      } else if (currentState === 'dashboard') {
        // If logged out, go back to splash
        setCurrentState('splash');
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleSplashComplete = () => {
    setCurrentState('login');
  };

  const handleLoginSubmit = async (email: string, password: string) => {
    try {
      setUserEmail(email);
      
      // Make API call to Express backend with JSON
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/login/access-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store temporary user data and navigate to OTP
      setPendingUserData({
        email: email,
        token: data.access_token,
        otp_required: data.otp_required,
        otp_verified: data.otp_verified,
        message: data.message
      });
      
      console.log('🔐 Backend message:', data.message);
      setCurrentState('otp');
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  };

  const handleSignUpComplete = async (email: string, password: string, fullName: string) => {
    console.log('🔴 handleSignUpComplete called with:', { email, password: '***', fullName });
    console.log('🔴 API URL:', process.env.EXPO_PUBLIC_API_URL);
    
    try {
      console.log('🚀 Starting registration for:', email);
      setUserEmail(email);
      
      const requestBody = {
        email: email,
        password: password,
        full_name: fullName,
        role: 'rider'
      };
      console.log('📡 Request body:', { ...requestBody, password: '***' });
      
      // Make API call to Express backend for registration
      console.log('📡 Making fetch request to:', `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/register`);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Registration response status:', response.status);
      console.log('📡 Registration response ok:', response.ok);
      
      let data;
      try {
        data = await response.json();
        console.log('📄 Registration response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('❌ Registration failed with status:', response.status);
        throw new Error(data.message || 'Registration failed');
      }

      console.log('✅ Registration successful, proceeding to login...');
      // After successful registration, automatically login
      await handleLoginSubmit(email, password);
    } catch (error) {
      console.error('❌ Registration API error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      throw error;
    }
  };

  const handleOTPVerifySuccess = async (otpCode: string) => {
    try {
      if (!pendingUserData || !userEmail) {
        throw new Error('No pending login data');
      }

      // Call Express backend OTP verification API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          code: otpCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP code');
      }

      // Complete the login process with user data from response
      await login(data.access_token, data.user);
      setPendingUserData(null);
      setCurrentState('dashboard');
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const handleBackToLogin = () => {
    setPendingUserData(null);
    setUserEmail('');
    setCurrentState('login');
  };

  const handleGoToSignUp = () => {
    setCurrentState('signup');
  };

  const handleGoToLogin = () => {
    setCurrentState('login');
  };

  const handleGoToForgotPassword = () => {
    setCurrentState('forgot-password');
  };

  const handlePasswordResetSuccess = () => {
    // Reset any pending data and go back to login
    setPendingUserData(null);
    setUserEmail('');
  };

  const handleResendOTP = async () => {
    try {
      if (!userEmail) {
        throw new Error('No email address available');
      }

      // Use Express backend resend OTP endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/otp/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      console.log('🔐 New OTP sent:', data.message);
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  // Render current screen based on state
  const renderCurrentScreen = () => {
    switch (currentState) {
      case 'splash':
        return (
          <SplashScreen 
            onComplete={handleSplashComplete}
          />
        );
      
      case 'login':
        return (
          <LoginScreen 
            onForgotPassword={handleGoToForgotPassword}
            onSignUp={handleGoToSignUp}
            onLoginSubmit={handleLoginSubmit}
          />
        );
      
      case 'signup':
        return (
          <SignUpScreen 
            onLogin={handleGoToLogin}
            onSignUpComplete={handleSignUpComplete}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordScreen 
            onBackToLogin={handleGoToLogin}
            onPasswordResetSuccess={handlePasswordResetSuccess}
          />
        );
      
      case 'otp':
        return (
          <OTPScreen 
            email={userEmail}
            onVerifySuccess={handleOTPVerifySuccess}
            onBackToLogin={handleBackToLogin}
            onResendOTP={handleResendOTP}
          />
        );
      
      case 'dashboard':
        return (
          <View style={styles.dashboardContainer}>
            <Dashboard />
            <BottomNav />
          </View>
        );
      
      default:
        return (
          <SplashScreen 
            onComplete={handleSplashComplete}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dashboardContainer: {
    flex: 1,
  },
});

export default AppNavigator;
