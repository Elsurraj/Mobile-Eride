import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { getRoleSpecificGreeting, getRoleWelcomeMessage, formatDuration } from '@/utils/greetings';
import DashboardLayout from '../layout/DashboardLayout';
import StatCard from '../common/StatCard';
import ActionButton from '../common/ActionButton';

const { width } = Dimensions.get('window');

const RiderDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Mock data - in real app, this would come from API
  const mockData = {
    walletBalance: "₦2,500.00",
    activeRide: {
      id: "ride-123",
      pickup: "Lagos Mall",
      dropoff: "Ikeja City",
      eta: 5,
      driverName: "Ahmed Okonkwo",
      hasActive: true
    },
    recentTrips: [
      { id: 1, destination: "Victoria Island", date: "Today", cost: "₦1,200" },
      { id: 2, destination: "Lekki Phase 1", date: "Yesterday", cost: "₦850" },
      { id: 3, destination: "Surulere", date: "2 days ago", cost: "₦600" }
    ]
  };

  const handleRequestRide = () => {
    console.log("Request Ride clicked");
    router.push('/(dashboard)/book-ride');
  };

  const handleRequestDelivery = () => {
    console.log("Request Delivery clicked");
    router.push('/(dashboard)/book-ride?type=delivery');
  };

  const styles = StyleSheet.create({
    container: {
      padding: Spacing.lg,
      paddingBottom: Spacing['3xl'],
    },
    welcomeSection: {
      marginBottom: Spacing['2xl'],
      alignItems: 'center',
    },
    welcomeMessage: {
      fontSize: Typography.fontSize.lg,
      color: colors.textSecondary,
      fontWeight: Typography.fontWeight.medium,
      textAlign: 'center',
    },
    walletSection: {
      marginBottom: Spacing['2xl'],
    },
    quickActionsSection: {
      marginBottom: Spacing['3xl'],
    },
    sectionTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
      marginBottom: Spacing.lg,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    quickActionButton: {
      flex: 1,
    },
    activeRideSection: {
      marginBottom: Spacing['3xl'],
    },
    activeRideCard: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius['2xl'],
      padding: Spacing.lg,
      ...Shadows.lg,
    },
    driverInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    driverInfo: {
      flex: 1,
    },
    driverLabel: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    driverName: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
    },
    statusBadge: {
      backgroundColor: colors.success + '20',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    statusText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.success,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    locationIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    pickupIcon: {
      backgroundColor: colors.success + '20',
    },
    dropoffIcon: {
      backgroundColor: colors.error + '20',
    },
    locationText: {
      flex: 1,
    },
    locationLabel: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    locationAddress: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
    },
    etaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginTop: Spacing.lg,
    },
    etaText: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    recentTripsSection: {
      marginBottom: Spacing['2xl'],
    },
    tripCard: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    tripRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tripInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    tripIconContainer: {
      backgroundColor: colors.brand.secondary + '20',
      borderRadius: BorderRadius.base,
      padding: Spacing.sm,
      marginRight: Spacing.md,
    },
    tripDetails: {
      flex: 1,
    },
    tripDestination: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
    },
    tripDate: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    tripCost: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.bold,
      color: colors.brand.primary,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.brand.primary + '10',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      marginTop: Spacing.sm,
    },
    roleText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      color: colors.brand.primary,
      marginLeft: Spacing.xs,
    },
  });

  return (
    <DashboardLayout title={getRoleSpecificGreeting(user?.role, user?.full_name)}>
      <View style={styles.container}>
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeMessage}>
            {getRoleWelcomeMessage(user?.role)}
          </Text>
          <View style={styles.roleBadge}>
            <Ionicons name="person-outline" size={16} color={colors.brand.primary} />
            <Text style={styles.roleText}>Rider Dashboard</Text>
          </View>
        </View>

        {/* Wallet Balance */}
        <View style={styles.walletSection}>
          <StatCard
            title="Wallet Balance"
            value={mockData.walletBalance}
            icon="card-outline"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <ActionButton
              label="Request Ride"
              icon="navigate-outline"
              onPress={handleRequestRide}
              variant="primary"
              fullWidth
              style={styles.quickActionButton}
            />
            <ActionButton
              label="Request Delivery"
              icon="cube-outline"
              onPress={handleRequestDelivery}
              variant="secondary"
              fullWidth
              style={styles.quickActionButton}
            />
          </View>
        </View>

        {/* Active Ride */}
        {mockData.activeRide.hasActive && (
          <View style={styles.activeRideSection}>
            <Text style={styles.sectionTitle}>Active Ride</Text>
            <View style={styles.activeRideCard}>
              {/* Driver Info */}
              <View style={styles.driverInfoRow}>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverLabel}>Your Driver</Text>
                  <Text style={styles.driverName}>{mockData.activeRide.driverName}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>On the way</Text>
                </View>
              </View>

              {/* Locations */}
              <View style={styles.locationRow}>
                <View style={[styles.locationIcon, styles.pickupIcon]}>
                  <Ionicons name="location" size={16} color={colors.success} />
                </View>
                <View style={styles.locationText}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress}>{mockData.activeRide.pickup}</Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <View style={[styles.locationIcon, styles.dropoffIcon]}>
                  <Ionicons name="location" size={16} color={colors.error} />
                </View>
                <View style={styles.locationText}>
                  <Text style={styles.locationLabel}>Dropoff</Text>
                  <Text style={styles.locationAddress}>{mockData.activeRide.dropoff}</Text>
                </View>
              </View>

              {/* ETA */}
              <View style={styles.etaContainer}>
                <Ionicons name="time-outline" size={20} color={colors.brand.secondary} />
                <Text style={styles.etaText}>
                  ETA: {formatDuration(mockData.activeRide.eta)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Trips */}
        <View style={styles.recentTripsSection}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {mockData.recentTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripRow}>
                <View style={styles.tripInfo}>
                  <View style={styles.tripIconContainer}>
                    <Ionicons name="location" size={16} color={colors.brand.primary} />
                  </View>
                  <View style={styles.tripDetails}>
                    <Text style={styles.tripDestination}>{trip.destination}</Text>
                    <Text style={styles.tripDate}>{trip.date}</Text>
                  </View>
                </View>
                <Text style={styles.tripCost}>{trip.cost}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </DashboardLayout>
  );
};

export default RiderDashboard;
