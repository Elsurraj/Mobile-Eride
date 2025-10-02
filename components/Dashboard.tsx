import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import RoleDashboard from './RoleDashboard';

const { width } = Dimensions.get('window');

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadTokenInfo = async () => {
      const expiry = await enhancedTokenManager.getTimeUntilExpiry();
      const id = await enhancedTokenManager.getUserId();
      setTimeUntilExpiry(expiry);
      setUserId(id);
    };
    loadTokenInfo();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  // Get time until token expires
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));

  const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    iconColor: string;
  }> = ({ title, value, subtitle, icon, iconColor }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeTitle}>E-Ride Dashboard</Text>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.full_name || user?.email}!
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.badgeText}>OTP Verified</Text>
            </View>
            
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.full_name || user?.email)?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.full_name || 'User'}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email}
              </Text>
              <View style={styles.userBadges}>
                <View style={[styles.statusBadge, user?.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={[styles.statusBadgeText, user?.is_active ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                    {user?.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                {user?.is_superuser && (
                  <View style={[styles.statusBadge, styles.superuserBadge]}>
                    <Text style={[styles.statusBadgeText, styles.superuserBadgeText]}>
                      Superuser
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Session Info"
            value={hoursUntilExpiry > 0 ? `${hoursUntilExpiry} hours` : 'Soon'}
            subtitle={`Token expires in | ID: ${userId ? String(userId).substring(0, 8) : 'Loading'}...`}
            icon="time-outline"
            iconColor="#3B82F6"
          />
          
          <StatCard
            title="Security Status"
            value="Fully Verified"
            subtitle="JWT + OTP Authenticated"
            icon="shield-checkmark-outline"
            iconColor="#10B981"
          />
          
          <StatCard
            title="Quick Actions"
            value="2"
            subtitle="Available actions"
            icon="flash-outline"
            iconColor="#8B5CF6"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="person-outline" size={24} color="#6B7280" />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="settings-outline" size={24} color="#6B7280" />
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Role-Based Dashboard Content */}
        <RoleDashboard />
        
        {/* Debug Information */}
        <View style={styles.debugCard}>
          <Text style={styles.debugTitle}>Debug Information</Text>
          <Text style={styles.debugText}>
            User Role: {user?.role || 'Unknown'} | 
            Token ID: {userId ? String(userId).substring(0, 8) : 'N/A'}...
          </Text>
          <Text style={styles.debugText}>
            Session expires in: {hoursUntilExpiry > 0 ? `${hoursUntilExpiry} hours` : 'Soon'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  welcomeTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
    marginBottom: Spacing.xs,
  },
  welcomeText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.textSecondary,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success + '20', // 20% opacity
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.success,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  logoutText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.error,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  superuserBadge: {
    backgroundColor: '#E0E7FF',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeBadgeText: {
    color: '#065F46',
  },
  inactiveBadgeText: {
    color: '#991B1B',
  },
  superuserBadgeText: {
    color: '#3730A3',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  mainCardText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  overviewGrid: {
    gap: 16,
  },
  overviewSection: {
    flex: 1,
  },
  overviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusList: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  debugCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default Dashboard;
