import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function WelcomeScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, completeOnboarding } = useAuth();
  const router = useRouter();

  const handleSkipOnboarding = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await completeOnboarding({});
      if (result.success) {
        router.replace('/(dashboard)');
      } else {
        console.error('Failed to skip onboarding:', result.error);
        // For demo purposes, allow skip even if it fails
        router.replace('/(dashboard)');
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      // For demo purposes, allow skip even if it fails
      router.replace('/(dashboard)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOnboarding = () => {
    router.push('/(onboarding)/profile');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <LinearGradient
        colors={['#1a1a1a', '#2d1d0c']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="car-sport" size={60} color={Colors.light.brand.secondary} />
                <Text style={styles.logoText}>E-Ride</Text>
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="hand-right" 
                  size={80} 
                  color={Colors.light.brand.secondary} 
                />
              </View>

              <Text style={styles.title}>
                Welcome to E-Ride!
              </Text>

              <Text style={styles.subtitle}>
                Hi {user?.full_name || 'there'}! 👋
              </Text>

              <Text style={styles.description}>
                Let's get you set up with a personalized experience. This will only take a minute and help us provide you with better service.
              </Text>

              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.light.brand.secondary} />
                  <Text style={styles.benefitText}>Personalized ride recommendations</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.light.brand.secondary} />
                  <Text style={styles.benefitText}>Faster booking with saved preferences</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.light.brand.secondary} />
                  <Text style={styles.benefitText}>Better driver-rider matching</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStartOnboarding}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  Let's Get Started
                </Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.light.brand.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipOnboarding}
                disabled={isLoading}
              >
                <Text style={styles.skipButtonText}>
                  {isLoading ? 'Setting up...' : 'Skip for now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.light.brand.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
    maxWidth: 320,
  },
  benefitsList: {
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#D1D5DB',
    flex: 1,
  },
  buttonsContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
});
