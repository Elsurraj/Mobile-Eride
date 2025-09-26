import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '@/components/LoginScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { isAuthenticated, isOtpVerified, otpRequired } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && isOtpVerified) {
      router.replace('/(dashboard)');
    } else if (otpRequired) {
      router.replace('/(auth)/otp');
    }
  }, [isAuthenticated, isOtpVerified, otpRequired]);

  const handleLoginSuccess = () => {
    // The AuthContext will handle the state change
    // and the useEffect will handle navigation
  };

  const handleGoToSignUp = () => {
    router.push('/(auth)/signup');
  };

  const handleGoToForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <LoginScreen
      onLoginSuccess={handleLoginSuccess}
      onSignUp={handleGoToSignUp}
      onForgotPassword={handleGoToForgotPassword}
    />
  );
}
