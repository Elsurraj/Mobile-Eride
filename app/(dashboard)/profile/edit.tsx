// app/(dashboard)/profile/edit.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView, // Keep ScrollView for keyboard handling
  KeyboardAvoidingView,
  Platform,
  // Remove direct import of SafeAreaView from react-native
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import useAuth and enhancedTokenManager
import { useAuth } from '@/contexts/AuthContext';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
// Import SafeAreaView from react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditPersonalInfoScreen() {
  const { user, updateUser, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const token = await enhancedTokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Failed to update profile';
        throw new Error(errorMessage);
      }

      updateUser(data);
      Alert.alert('Success', 'Profile updated successfully!');
      // Optionally, navigate back after saving
      // import { router } from 'expo-router'; at the top and use router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Wrap the content in SafeAreaView and ScrollView for safe areas and keyboard avoidance
  // The SafeAreaView handles the top and bottom safe areas automatically
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView} // Use a dedicated style for this view
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer} // Style for the scroll view itself
          contentContainerStyle={styles.content} // Style for the scrollable content area
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Edit Personal Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
            {isSaving && <Ionicons name="time-outline" size={20} color="white" />}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // The SafeAreaView's style prop handles container background and flex
  container: {
    flex: 1,
    // backgroundColor is now applied via the SafeAreaView style prop in the component
  },
  keyboardAvoidingView: {
    flex: 1, // Ensure it fills the SafeAreaView
  },
  scrollContainer: {
    flex: 1, // Ensure it fills the KeyboardAvoidingView
  },
  // contentContainerStyle for the ScrollView - this is where main padding goes
  content: {
    // Use theme spacing for padding
    paddingHorizontal: Spacing.lg,
    // Add padding to the bottom to ensure content isn't hidden behind the keyboard initially
    // paddingBottom is added dynamically by KeyboardAvoidingView if needed
    // paddingTop is handled by SafeAreaView
    // Add some top padding to the *content* if needed, but SafeAreaView should handle the system inset
    // paddingTop: Spacing.lg, // Consider removing or adjusting if SafeAreaView provides enough space
    paddingBottom: Spacing['3xl'], // Ensure space at the bottom for keyboard/inputs
    // Add padding to the top of the *scrollable content* if needed beyond the SafeAreaView's handling
    // This can be useful if you want a specific amount of space below the status bar
    // paddingTop: Spacing.xl, // Example: add extra space below the status bar
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing['2xl'],
    textAlign: 'center',
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