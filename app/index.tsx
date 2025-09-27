import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import SplashScreen from '@/components/SplashScreen';

export default function InitialScreen() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { 
    isAuthenticated, 
    isOtpVerified, 
    otpRequired,
    initialized, 
    isOnboardingComplete,
    isBackendHealthy 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleInitialNavigation = async () => {
      if (!initialized) return; // Wait for auth to initialize

      try {
        console.log('🚆 Navigation check:', {
          initialized,
          isAuthenticated,
          isOtpVerified,
          otpRequired,
          isOnboardingComplete,
          isBackendHealthy
        });

        // If user needs OTP verification
        if (otpRequired) {
          console.log('📱 Navigating to OTP verification');
          router.replace('/(auth)/otp');
        }
        // If user is fully authenticated and onboarded
        else if (isAuthenticated && isOtpVerified && isOnboardingComplete) {
          console.log('🏠 Navigating to dashboard');
          router.replace('/(dashboard)');
        }
        // If user is authenticated but needs onboarding
        else if (isAuthenticated && isOtpVerified && !isOnboardingComplete) {
          console.log('🎯 Navigating to onboarding');
          router.replace('/(onboarding)/welcome');
        }
        // If user is not authenticated (including after logout)
        else {
          console.log('🔐 Navigating to login (user not authenticated)');
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Error during initial navigation:', error);
        router.replace('/(auth)/login');
      } finally {
        setIsInitializing(false);
      }
    };

    handleInitialNavigation();
  }, [initialized, isAuthenticated, isOtpVerified, otpRequired, isOnboardingComplete, router]);

  if (isInitializing || !initialized) {
    return (
      <SplashScreen 
        onComplete={() => {
          // This won't be called since we're handling navigation in useEffect
        }}
        showHealthStatus={true}
        isBackendHealthy={isBackendHealthy}
      />
    );
  }

  // This should rarely be seen as navigation should happen in useEffect
  return <View style={{ flex: 1 }} />;
}
