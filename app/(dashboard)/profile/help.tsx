// app/(dashboard)/profile/help.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import SafeAreaView from react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function HelpSupportScreen() {

  const handleContactSupport = () => {
    // Example: Open email client
    Linking.openURL('mailto:support@yourapp.com?subject=Help%20Request');
  };

  const handleViewFAQ = () => {
    // Example: Open web FAQ page
    Linking.openURL('https://yourapp.com/faq');
  };

  // Use SafeAreaView as the top-level component
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>How can we help you today?</Text>

          <TouchableOpacity style={styles.optionCard} onPress={handleContactSupport}>
            <View style={styles.optionIcon}>
              <Ionicons name="mail" size={24} color={Colors.light.brand.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Email Support</Text>
              <Text style={styles.optionSubtitle}>Get in touch with our support team</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleViewFAQ}>
            <View style={styles.optionIcon}>
              <Ionicons name="help-circle" size={24} color={Colors.light.brand.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>FAQ</Text>
              <Text style={styles.optionSubtitle}>Find answers to common questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>

          {/* Add more help options as needed */}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>App Version</Text>
            <Text style={styles.infoText}>E-Ride v1.0.0</Text>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is applied via SafeAreaView style prop
  },
  content: {
    paddingHorizontal: Spacing.lg,
    // Add padding to the bottom to ensure content isn't hidden
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  optionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
  },
  infoSection: {
    marginTop: Spacing['3xl'],
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.text,
  },
});