import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
  onPasswordResetSuccess: () => void;
  onResetRequest?: (email: string) => Promise<any>;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBackToLogin,
  onPasswordResetSuccess,
  onResetRequest,
}) => {
  const [step, setStep] = useState<'email' | 'token' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let data;
      if (onResetRequest) {
        // Use the AuthContext method
        data = await onResetRequest(email);
      } else {
        // Fallback to direct API call
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/password-recovery/${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const apiData = await response.json();

        if (!response.ok) {
          throw new Error(apiData.detail || apiData.message || 'Failed to send reset email');
        }
        data = apiData;
      }

      Alert.alert(
        'Password Recovery',
        'If your email is registered with us, you will receive a password recovery email shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Move to token step for demo purposes
              setStep('token');
            },
          },
          {
            text: 'Back to Login',
            onPress: onBackToLogin,
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('Password reset request error:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim()) {
      setError('Please enter the reset token from your email');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to reset password');
      }

      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              onPasswordResetSuccess();
              onBackToLogin();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <View style={styles.logoContainer}>
        <Ionicons name="key" size={80} color={Colors.light.brand.secondary} />
        <Text style={styles.logoText}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address to receive a password reset link
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={Colors.light.textSecondary} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={Colors.light.textLight}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={Colors.light.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          onPress={handleRequestReset}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.light.brand.primary} />
          ) : (
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderTokenStep = () => (
    <>
      <View style={styles.logoContainer}>
        <Ionicons name="key" size={80} color={Colors.light.brand.secondary} />
        <Text style={styles.logoText}>Enter Reset Token</Text>
        <Text style={styles.subtitle}>
          Enter the reset token from your email and create a new password
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="shield-outline" 
              size={20} 
              color={Colors.light.textSecondary} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Reset Token"
              placeholderTextColor={Colors.light.textLight}
              value={token}
              onChangeText={(text) => {
                setToken(text);
                setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={Colors.light.textSecondary} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="New Password"
              placeholderTextColor={Colors.light.textLight}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={Colors.light.textSecondary} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Confirm New Password"
              placeholderTextColor={Colors.light.textLight}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={Colors.light.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.light.brand.primary} />
          ) : (
            <Text style={styles.primaryButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setStep('email')}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Request New Token</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBackToLogin}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {step === 'email' && renderEmailStep()}
          {step === 'token' && renderTokenStep()}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    flex: 1,
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
    marginBottom: Spacing['6xl'],
    gap: Spacing.sm,
  },
  logoText: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.text,
    padding: 0,
  },
  passwordInput: {
    paddingRight: 0,
  },
  passwordToggle: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.error,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.brand.secondary,
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;
