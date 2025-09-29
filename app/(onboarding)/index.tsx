import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingScreens from '@/components/OnboardingScreens';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import { useAuth } from '@/contexts/AuthContext';

export default function Onboarding() {
  const { isAuthenticated, isOtpVerified, user, completeOnboarding } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !isOtpVerified) {
      console.log('🚨 Onboarding: User not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isOtpVerified]);

  const handleOnboardingComplete = async () => {
    console.log('🎯 Onboarding: Handling completion...');
    try {
      // Use the AuthContext method which handles missing backend gracefully
      const result = await completeOnboarding({});
      
      if (result.success) {
        console.log('✅ Onboarding: Completed successfully, navigating to dashboard');
        await enhancedTokenManager.setOnboardingCompleted(true);
        router.replace('/(dashboard)');
      } else {
        console.warn('⚠️ Onboarding: Completion failed but proceeding anyway:', result.error);
        await enhancedTokenManager.setOnboardingCompleted(true);
        router.replace('/(dashboard)');
      }
    } catch (error) {
      console.error('❌ Onboarding: Error completing onboarding:', error);
      // Always allow navigation to dashboard as fallback
      try {
        await enhancedTokenManager.setOnboardingCompleted(true);
      } catch (tokenError) {
        console.error('❌ Token manager error:', tokenError);
      }
      router.replace('/(dashboard)');
    }
  };

  // Show loading if user is not available yet
  if (!user && isAuthenticated && isOtpVerified) {
    console.log('⏳ Onboarding: Waiting for user data...');
    return null; // or a loading component
  }

  return <OnboardingScreens onComplete={handleOnboardingComplete} />;
}
