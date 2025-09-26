import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
    preferredPaymentMethod: 'card',
    notifications: true,
  });
  const { user, completeOnboarding } = useAuth();
  const router = useRouter();

  const handleComplete = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const profileData = {
        phone_number: formData.phoneNumber,
        emergency_contact: formData.emergencyContact,
        emergency_phone: formData.emergencyPhone,
        preferences: {
          payment_method: formData.preferredPaymentMethod,
          notifications_enabled: formData.notifications,
        },
      };

      console.log('🔧 Profile Setup - Completing onboarding with data:', profileData);
      const result = await completeOnboarding(profileData);
      if (result.success) {
        console.log('✅ Profile Setup - Onboarding completed successfully');
        router.replace('/(dashboard)');
      } else {
        console.error('Failed to complete onboarding:', result.error);
        // For demo purposes, allow completion even if it fails
        router.replace('/(dashboard)');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // For demo purposes, allow completion even if it fails
      router.replace('/(dashboard)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await completeOnboarding({});
      if (result.success) {
        router.replace('/(dashboard)');
      } else {
        console.error('Failed to skip profile setup:', result.error);
        router.replace('/(dashboard)');
      }
    } catch (error) {
      console.error('Error skipping profile setup:', error);
      router.replace('/(dashboard)');
    } finally {
      setIsLoading(false);
    }
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
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  
                  <View style={styles.headerContent}>
                    <Text style={styles.title}>Profile Setup</Text>
                    <Text style={styles.subtitle}>
                      Help us personalize your E-Ride experience
                    </Text>
                  </View>
                </View>

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '100%' }]} />
                  </View>
                  <Text style={styles.progressText}>Step 2 of 2</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.phoneNumber}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#6B7280"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Emergency Contact Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.emergencyContact}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContact: text }))}
                      placeholder="Enter emergency contact name"
                      placeholderTextColor="#6B7280"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.emergencyPhone}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyPhone: text }))}
                      placeholder="Enter emergency contact phone"
                      placeholderTextColor="#6B7280"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <Text style={styles.sectionTitle}>Preferences</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Preferred Payment Method</Text>
                    <View style={styles.radioGroup}>
                      {[
                        { key: 'card', label: 'Credit/Debit Card', icon: 'card' },
                        { key: 'cash', label: 'Cash', icon: 'cash' },
                        { key: 'digital', label: 'Digital Wallet', icon: 'phone-portrait' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={styles.radioOption}
                          onPress={() => setFormData(prev => ({ ...prev, preferredPaymentMethod: option.key }))}
                        >
                          <Ionicons 
                            name={option.icon as any} 
                            size={24} 
                            color={formData.preferredPaymentMethod === option.key ? Colors.light.brand.secondary : '#6B7280'} 
                          />
                          <Text style={[
                            styles.radioLabel,
                            formData.preferredPaymentMethod === option.key && styles.radioLabelActive
                          ]}>
                            {option.label}
                          </Text>
                          <Ionicons 
                            name={formData.preferredPaymentMethod === option.key ? "radio-button-on" : "radio-button-off"} 
                            size={24} 
                            color={formData.preferredPaymentMethod === option.key ? Colors.light.brand.secondary : '#6B7280'} 
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.notificationToggle}
                    onPress={() => setFormData(prev => ({ ...prev, notifications: !prev.notifications }))}
                  >
                    <View style={styles.notificationContent}>
                      <Ionicons 
                        name="notifications" 
                        size={24} 
                        color={formData.notifications ? Colors.light.brand.secondary : '#6B7280'} 
                      />
                      <View style={styles.notificationText}>
                        <Text style={styles.notificationTitle}>Push Notifications</Text>
                        <Text style={styles.notificationDescription}>
                          Get updates on your rides, promotions, and more
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name={formData.notifications ? "toggle" : "toggle-outline"} 
                      size={32} 
                      color={formData.notifications ? Colors.light.brand.secondary : '#6B7280'} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleComplete}
                    disabled={isLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLoading ? 'Saving Profile...' : 'Save & Complete'}
                    </Text>
                    <Ionicons name="checkmark" size={20} color={Colors.light.brand.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    disabled={isLoading}
                  >
                    <Text style={styles.skipButtonText}>
                      Skip for now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
  form: {
    flex: 1,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: '#D1D5DB',
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: 'white',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  radioGroup: {
    gap: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#374151',
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  radioLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#D1D5DB',
  },
  radioLabelActive: {
    color: 'white',
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#374151',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: 'white',
  },
  notificationDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
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
