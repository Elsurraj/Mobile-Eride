import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/common/Logo';

interface LoginScreenProps {
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onLoginSuccess?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onForgotPassword,
  onSignUp,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, clearError, isLoading: authLoading } = useAuth();

  const handleLogin = async () => {
    setLocalError('');
    clearError();
    
    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      const result = await login({ username: email, password });
      
      if (result.success) {
        // Login successful, AuthContext will handle navigation via useEffect in auth wrapper
        onLoginSuccess?.();
      } else {
        // Error will be handled by AuthContext
        setLocalError(result.error || 'Failed to login. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLocalError(error.message || 'Failed to login. Please try again.');
    }
  };

  const [isFocused, setIsFocused] = useState(false);

  return (



    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
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
                  style={[styles.input, isFocused && styles.inputFocused]}
                  placeholder="Email"
                  placeholderTextColor={Colors.light.textLight}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (localError) setLocalError('');
                    if (error) clearError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
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
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (localError) setLocalError('');
                    if (error) clearError();
                  }}
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

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={onForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, authLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={authLoading}
            >
              <Text style={styles.loginButtonText}>
                {authLoading ? 'Signing in...' : 'Log In'}
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onSignUp}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    padding: 10,
  },
  inputFocused: {
    borderColor: '#FFD700',
  },
  passwordInput: {
    paddingRight: 0,
  },
  passwordToggle: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.brand.secondary,
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signUpText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.textSecondary,
  },
  signUpLink: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
