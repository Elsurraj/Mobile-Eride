import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import OTPScreen from '@/components/OTPScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function OTP() {
  const { 
    isAuthenticated, 
    isOtpVerified, 
    userEmail, 
    otpRequired, 
    verifyOtp, 
    resendOtp, 
    logout 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!otpRequired) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && isOtpVerified) {
      router.replace('/(onboarding)');
    }
  }, [isAuthenticated, isOtpVerified, otpRequired]);

  const handleOTPSuccess = async (otpCode: string) => {
    try {
      const result = await verifyOtp(otpCode);
      if (!result.success) {
        throw new Error(result.error);
      }
      // The AuthContext will handle the state change
      // and the useEffect will handle navigation
    } catch (error: any) {
      throw error;
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleResendOTP = async () => {
    try {
      const result = await resendOtp(userEmail);
      if (result.success) {
        Alert.alert(
          'OTP Resent',
          'New verification code has been generated. Check the backend console for the code.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    }
  };

  return (
    <OTPScreen
      email={userEmail}
      onVerifySuccess={handleOTPSuccess}
      onBackToLogin={handleBackToLogin}
      onResendOTP={handleResendOTP}
    />
  );
}
