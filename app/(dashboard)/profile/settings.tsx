// app/(dashboard)/profile/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import SafeAreaView from react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function AppSettingsScreen() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    phone_number: user?.profile?.phone_number || '',
    emergency_contact_name: user?.profile?.emergency_contact_name || '',
    emergency_contact_phone: user?.profile?.emergency_contact_phone || '',
    notifications_enabled: user?.profile?.preferences?.notifications_enabled ?? true,
    payment_method: user?.profile?.preferences?.payment_method || 'card',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        phone_number: user.profile?.phone_number || '',
        emergency_contact_name: user.profile?.emergency_contact_name || '',
        emergency_contact_phone: user.profile?.emergency_contact_phone || '',
        notifications_enabled: user.profile?.preferences?.notifications_enabled ?? true,
        payment_method: user.profile?.preferences?.payment_method || 'card',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await enhancedTokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_number: formData.phone_number,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          preferences: {
            notifications_enabled: formData.notifications_enabled,
            payment_method: formData.payment_method,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Failed to update settings';
        throw new Error(errorMessage);
      }

      // Update local context with new profile data
      const updatedUser = {
        ...user,
        profile: data.onboarding_profile,
      };
      if (updateUser) {
        updateUser(updatedUser);
      }

      Alert.alert('Success', 'Settings updated successfully!');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', error.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Use SafeAreaView as the top-level component
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>App Settings</Text>

          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergency_contact_name: text }))}
              placeholder="Enter emergency contact name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergency_contact_phone: text }))}
              placeholder="Enter emergency contact phone"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={formData.notifications_enabled}
              onValueChange={(value) => setFormData(prev => ({ ...prev, notifications_enabled: value }))}
              trackColor={{ false: Colors.light.textSecondary, true: Colors.light.brand.primary }}
              thumbColor={Colors.light.brand.secondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Preferred Payment Method</Text>
            <View style={styles.radioGroup}>
              {[
                { key: 'card', label: 'Credit/Debit Card' },
                { key: 'cash', label: 'Cash' },
                { key: 'digital', label: 'Digital Wallet' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.radioOption}
                  onPress={() => setFormData(prev => ({ ...prev, payment_method: option.key }))}
                >
                  <Ionicons
                    name={formData.payment_method === option.key ? "radio-button-on" : "radio-button-off"}
                    size={24}
                    color={formData.payment_method === option.key ? Colors.light.brand.primary : Colors.light.textSecondary}
                  />
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Text>
            {isSaving && <Ionicons name="time-outline" size={20} color="white" />}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is applied via SafeAreaView style prop
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'], // Ensure space at the bottom
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
  radioGroup: {
    gap: Spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  radioLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
  saveButton: {
    backgroundColor: Colors.light.brand.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing['2xl'], // Add some space at the bottom
  },
  saveButtonDisabled: {
    opacity: 0.7, // Style applied when saving
  },
  saveButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
});