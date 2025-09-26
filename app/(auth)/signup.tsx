import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import SignUpScreen from '@/components/SignUpScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const { isAuthenticated, isOtpVerified, otpRequired, signup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && isOtpVerified) {
      router.replace('/(dashboard)');
    } else if (otpRequired) {
      router.replace('/(auth)/otp');
    }
  }, [isAuthenticated, isOtpVerified, otpRequired]);

  const handleSignUpComplete = async (email: string, password: string, fullName: string) => {
    const result = await signup({ email, password, fullName });
    if (!result.success) {
      throw new Error(result.error);
    }
    // The AuthContext will handle the state change
    // and the useEffect will handle navigation
  };

  const handleGoToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <SignUpScreen
      onSignUpComplete={handleSignUpComplete}
      onLogin={handleGoToLogin}
    />
  );
}
