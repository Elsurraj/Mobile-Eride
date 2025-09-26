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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/common/Logo';

interface SignUpScreenProps {
  onLogin?: () => void;
  onSignUpComplete?: (email: string, password: string, fullName: string) => Promise<void>;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onLogin,
  onSignUpComplete,
}) => {
  const { error, clearError, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    console.log('🔵 handleSignUp called - Starting signup process');
    
    // Clear previous errors
    setLocalError('');
    clearError();
    
    // Validate inputs
    if (!formData.fullName.trim() || !formData.email.trim() || 
        !formData.password.trim() || !formData.confirmPassword.trim()) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (formData.fullName.length < 3) {
      setLocalError('Full name must be at least 3 characters');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!onSignUpComplete) {
      setLocalError('Sign up handler not available');
      return;
    }

    console.log('✅ All validations passed, calling onSignUpComplete...');
    setIsLoading(true);
    try {
      console.log('📝 Starting signup process for:', formData.email);
      await onSignUpComplete(formData.email, formData.password, formData.fullName);
      console.log('✅ Signup completed successfully');
      // Success handling is done in the parent component
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      setLocalError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (localError) setLocalError('');
    if (error) clearError();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Logo size="medium" />
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Error Message */}
              <ErrorMessage 
                message={localError || error || ''} 
                visible={Boolean(localError || error)}
              />
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={Colors.light.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={Colors.light.textLight}
                    value={formData.fullName}
                    onChangeText={(value) => updateField('fullName', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Email Input */}
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
                    placeholder="Email"
                    placeholderTextColor={Colors.light.textLight}
                    value={formData.email}
                    onChangeText={(value) => updateField('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
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
                    placeholder="Password"
                    placeholderTextColor={Colors.light.textLight}
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
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

              {/* Confirm Password Input */}
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
                    placeholder="Confirm Password"
                    placeholderTextColor={Colors.light.textLight}
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateField('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
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

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[styles.signUpButton, (isLoading || authLoading) && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading || authLoading}
              >
                <Text style={styles.signUpButtonText}>
                  {(isLoading || authLoading) ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={onLogin}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['3xl'],
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing['5xl'],
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
    padding: 8,
  },
  passwordInput: {
    paddingRight: 0,
  },
  passwordToggle: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  signUpButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  loginText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.textSecondary,
  },
  loginLink: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
