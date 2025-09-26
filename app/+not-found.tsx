import React from 'react';
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
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

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
            {/* 404 Icon */}
            <View style={styles.iconContainer}>
              <Ionicons 
                name="alert-circle-outline" 
                size={120} 
                color={Colors.light.brand.secondary} 
              />
            </View>

            {/* Error Message */}
            <Text style={styles.errorCode}>404</Text>
            <Text style={styles.title}>Page Not Found</Text>
            <Text style={styles.description}>
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace('/(dashboard)')}
              >
                <Ionicons name="home" size={20} color={Colors.light.brand.primary} />
                <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <Text style={styles.helpText}>
              If you think this is a mistake, please contact our support team.
            </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  errorCode: {
    fontSize: 72,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['3xl'],
    maxWidth: 320,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
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
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#374151',
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: '#9CA3AF',
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
});
