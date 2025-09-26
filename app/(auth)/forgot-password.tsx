import React from 'react';
import { useRouter } from 'expo-router';
import ForgotPasswordScreen from '@/components/ForgotPasswordScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  const handlePasswordResetSuccess = () => {
    // Navigate back to login after successful reset
    router.replace('/(auth)/login');
  };

  const handleResetRequest = async (email: string) => {
    const result = await resetPassword(email);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  };

  return (
    <ForgotPasswordScreen
      onBackToLogin={handleBackToLogin}
      onPasswordResetSuccess={handlePasswordResetSuccess}
      onResetRequest={handleResetRequest}
    />
  );
}
