import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface OTPScreenProps {
  email: string;
  onVerifySuccess: (otpCode: string) => Promise<void>;
  onBackToLogin?: () => void;
  onResendOTP?: () => void;
}

const OTPScreen: React.FC<OTPScreenProps> = ({
  email,
  onVerifySuccess,
  onBackToLogin,
  onResendOTP,
}) => {
  const [otp, setOTP] = useState<string[]>(new Array(6).fill(''));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Focus on first input when component mounts
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow numeric input
    if (isNaN(Number(value))) return;

    const newOTP = [...otp];
    newOTP[index] = value.substring(value.length - 1); // Take only the last character
    setOTP(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all fields are filled
    const otpString = newOTP.join('');
    if (otpString.length === 6) {
      handleVerifyOTP(otpString);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setIsLoading(true);
    try {
      // Call the parent's verify function which will call the backend
      await onVerifySuccess(otpCode);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Failed to verify code. Please try again.');
      clearOTP();
    }
  };

  const clearOTP = () => {
    setOTP(new Array(6).fill(''));
    setActiveIndex(0);
    inputRefs.current[0]?.focus();
  };

  const handleResend = () => {
    if (resendCooldown === 0) {
      setResendCooldown(30); // 30 second cooldown
      clearOTP();
      onResendOTP?.();
      Alert.alert('Success', 'Verification code sent to your email');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackToLogin}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.textSecondary} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="car-sport" size={60} color={Colors.light.brand.secondary} />
          <Text style={styles.logoText}>E-Ride</Text>
        </View>

        {/* Title and Description */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.description}>
            We sent a 6-digit code to your email
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                activeIndex === index && styles.activeOtpInput,
              ]}
              value={digit}
              onChangeText={(value) => handleChange(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              onFocus={() => handleFocus(index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={resendCooldown > 0}
          >
            <Text style={[
              styles.resendButtonText,
              resendCooldown > 0 && styles.resendButtonTextDisabled
            ]}>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearOTP}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <Text style={styles.loadingText}>Verifying...</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['3xl'],
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: Spacing['3xl'],
    right: Spacing['3xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.textSecondary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['5xl'],
    gap: Spacing.sm,
  },
  logoText: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
    marginTop: Spacing.sm,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing['5xl'],
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.text,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  email: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.brand.secondary,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing['4xl'],
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  activeOtpInput: {
    borderColor: Colors.light.brand.secondary,
    borderWidth: 2,
  },
  resendSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  resendButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  resendButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.brand.secondary,
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    color: Colors.light.textLight,
    textDecorationLine: 'none',
  },
  clearButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  clearButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.textLight,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.brand.secondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});

export default OTPScreen;


