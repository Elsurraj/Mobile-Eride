import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import router from expo-router
import { router } from 'expo-router'; 
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { getUserInitials } from '@/utils/greetings';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BottomNav from '@/components/BottomNav';

interface ProfileOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const ProfileOption: React.FC<ProfileOptionProps> = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          ...Shadows.sm,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Show loading if user data is not available
  if (isLoading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary }}>
        <Text style={{ color: colors.text }}>Loading profile...</Text>
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 Profile: Logout button pressed');
            try {
              await logout();
              console.log('🚪 Profile: Logout function completed');
            } catch (error) {
              console.error('🚪 Profile: Logout error:', error);
            }
          },
        },
      ]
    );
  };

  // Replace the handlers inside the component with the router.push versions
  const handlePersonalInfo = () => {
    // console.log('Navigate to personal information'); // Remove or comment out
    router.push('/(dashboard)/profile/edit'); // Use router.push
  };

  const handleAppSettings = () => {
    // console.log('Navigate to app settings'); // Remove or comment out
    router.push('/(dashboard)/profile/settings'); // Use router.push
  };

  const handleHelpSupport = () => {
    // console.log('Navigate to help & support'); // Remove or comment out
    router.push('/(dashboard)/profile/help'); // Use router.push
  };

  return (
    <View style={styles.container}>
      <DashboardLayout title="Profile" showHeader={true}>
        <View style={styles.content}>
          {/* User Info Card */}
          <View style={[styles.userInfoCard, { backgroundColor: colors.background }]}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.brand.secondary }]}>
              <Text style={[styles.avatarText, { color: colors.brand.primary }]}>
                {getUserInitials(user?.full_name || user?.email)}
              </Text>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.full_name || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.brand.secondary }]}>
              <Text style={[styles.roleText, { color: colors.brand.primary }]}>
                {user?.role || 'rider'}
              </Text>
            </View>
          </View>

          {/* Profile Details */}
          {user?.profile && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Details</Text>
              
              {user.profile.phone_number && (
                <View style={[styles.optionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="call" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Phone Number</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      {user.profile.phone_number}
                    </Text>
                  </View>
                </View>
              )}
              
              {user.profile.emergency_contact && (
                <View style={[styles.optionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="medical" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Emergency Contact</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      {user.profile.emergency_contact}
                      {user.profile.emergency_phone && ` • ${user.profile.emergency_phone}`}
                    </Text>
                  </View>
                </View>
              )}
              
              {user.profile.preferences?.payment_method && (
                <View style={[styles.optionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="card" size={20} color="#8B5CF6" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Payment Method</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      {user.profile.preferences.payment_method === 'card' ? 'Credit/Debit Card' : 
                       user.profile.preferences.payment_method === 'cash' ? 'Cash' : 'Digital Wallet'}
                    </Text>
                  </View>
                </View>
              )}
              
              {user.profile.preferences?.notifications_enabled !== undefined && (
                <View style={[styles.optionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="notifications" size={20} color="#10B981" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Notifications</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      {user.profile.preferences.notifications_enabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Account Settings */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
          
          <ProfileOption
            icon="person-outline"
            iconColor="#3B82F6"
            iconBg="#EFF6FF"
            title="Personal Information"
            subtitle="Update your profile details"
            onPress={handlePersonalInfo}
          />
          
          <ProfileOption
            icon="settings-outline"
            iconColor="#8B5CF6"
            iconBg="#F3E8FF"
            title="App Settings"
            subtitle="Notifications, privacy & more"
            onPress={handleAppSettings}
          />
          
          <ProfileOption
            icon="help-circle-outline"
            iconColor="#10B981"
            iconBg="#ECFDF5"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={handleHelpSupport}
          />

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </DashboardLayout>
      <BottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  userInfoCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs / 2,
  },
  optionSubtitle: {
    fontSize: Typography.fontSize.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.xl,
    ...Shadows.sm,
  },
  logoutText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.sm,
  },
});