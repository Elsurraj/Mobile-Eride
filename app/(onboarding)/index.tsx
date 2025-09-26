import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingScreens from '@/components/OnboardingScreens';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import { useAuth } from '@/contexts/AuthContext';

export default function Onboarding() {
  const { isAuthenticated, isOtpVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !isOtpVerified) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isOtpVerified]);

  const handleOnboardingComplete = async () => {
    try {
      await enhancedTokenManager.setOnboardingCompleted(true);
      router.replace('/(dashboard)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/(dashboard)'); // Fallback navigation
    }
  };

  return <OnboardingScreens onComplete={handleOnboardingComplete} />;
}
