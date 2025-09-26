import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CancellationModal } from '@/components/modals/CancellationModal';
import { ridesService } from '@/services/ridesService';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { getRoleSpecificGreeting, getRoleWelcomeMessage, getStatusMessage } from '@/utils/greetings';
import DashboardLayout from '../layout/DashboardLayout';
import StatCard from '../common/StatCard';
import StatusToggle from '../common/StatusToggle';
import RequestCard from '../common/RequestCard';

const { width } = Dimensions.get('window');

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isOnline, setIsOnline] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [isCancellingRide, setIsCancellingRide] = useState(false);

  // Mock data - in real app, this would come from API
  const mockData = {
    todayEarnings: "₦15,000",
    weeklyEarnings: "₦72,500",
    activeRide: {
      id: "ride-456",
      pickup: { address: "Lagos Mall", label: "Mall Entrance" },
      dropoff: { address: "Ikeja City Mall", label: "Main Gate" },
      riderName: "Sarah Johnson",
      hasActive: true
    },
    pendingRequests: [
      {
        id: "req-1",
        type: "ride" as const,
        pickup: { address: "Victoria Island", label: "Landmark Centre" },
        dropoff: { address: "Lekki Phase 1", label: "Admiralty Way" },
        customerName: "Michael Chen",
        estimatedTime: "8 mins"
      },
      {
        id: "req-2", 
        type: "ride" as const,
        pickup: { address: "Ikoyi", label: "Hotel Continental" },
        dropoff: { address: "Airport Road", label: "MMA Terminal" },
        customerName: "David Adebayo",
        estimatedTime: "12 mins"
      }
    ]
  };

  const handleStatusToggle = (newStatus: boolean) => {
    setIsOnline(newStatus);
    const message = newStatus ? "You are now online and ready for rides!" : "You are now offline";
    console.log("Status Updated:", message);
  };

  const handleAcceptRequest = (requestId: string) => {
    console.log("Accept request:", requestId);
    console.log("Request Accepted: You've accepted the ride request. Navigating to pickup location...");
  };

  const handleDeclineRequest = (requestId: string) => {
    console.log("Decline request:", requestId);
    console.log("Request Declined: The ride request has been declined.");
  };

  const handleCancelActiveRide = () => {
    setShowCancellationModal(true);
  };

  const handleCancellationConfirm = async (reasonId?: string, notes?: string) => {
    if (!reasonId) {
      Alert.alert('Required', 'Please select a reason for cancellation.');
      return;
    }

    setIsCancellingRide(true);
    try {
      // Using mock ride ID - in real app this would come from active ride state
      const result = await ridesService.cancelRideByDriver(mockData.activeRide.id, reasonId, notes);
      
      if (result.success && result.data) {
        const { replacement_driver } = result.data;
        
        let message = 'Ride cancelled successfully.';
        if (replacement_driver) {
          message += ` A replacement driver (${replacement_driver.driver.name}) has been assigned.`;
        } else {
          message += ' The passenger will be notified and a new driver will be found.';
        }
        
        Alert.alert('Ride Cancelled', message);
        
        // In real app, this would update the active ride state
        // For now, we'll just log it
        console.log('Active ride cancelled by driver');
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel ride');
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
      Alert.alert('Error', 'Failed to cancel ride. Please try again.');
    } finally {
      setIsCancellingRide(false);
      setShowCancellationModal(false);
    }
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
    statusMessage: {
      fontSize: Typography.fontSize.sm,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    statusSection: {
      marginBottom: Spacing['2xl'],
    },
    statusCard: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius['2xl'],
      padding: Spacing.lg,
      ...Shadows.lg,
    },
    earningsSection: {
      marginBottom: Spacing['3xl'],
    },
    earningsGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    earningsCard: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
      marginBottom: Spacing.lg,
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
    riderInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    riderInfo: {
      flex: 1,
    },
    riderLabel: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    riderName: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
    },
    statusBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    statusText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: '#FFFFFF',
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
    locationSubLabel: {
      fontSize: Typography.fontSize.xs,
      color: colors.textLight,
    },
    navigateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.info + '20',
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginTop: Spacing.lg,
    },
    navigateText: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.info,
      marginLeft: Spacing.sm,
    },
    pendingRequestsSection: {
      marginBottom: Spacing['2xl'],
    },
    offlineContainer: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    offlineIcon: {
      marginBottom: Spacing.lg,
    },
    offlineTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    offlineMessage: {
      fontSize: Typography.fontSize.base,
      color: colors.textLight,
      textAlign: 'center',
    },
    rideActionsContainer: {
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.textLight + '20',
    },
    cancelRideButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
    },
    cancelRideText: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
    },
    buttonDisabled: {
      opacity: 0.6,
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
          <Text style={styles.statusMessage}>
            {getStatusMessage(isOnline, user?.role)}
          </Text>
        </View>

        {/* Status Toggle */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <StatusToggle
              isOnline={isOnline}
              onToggle={handleStatusToggle}
              onlineLabel="Online - Ready for rides"
              offlineLabel="Offline - Not accepting rides"
            />
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsSection}>
          <View style={styles.earningsGrid}>
            <StatCard
              title="Today's Earnings"
              value={mockData.todayEarnings}
              icon="cash-outline"
              style={styles.earningsCard}
            />
            <StatCard
              title="Weekly Earnings"
              value={mockData.weeklyEarnings}
              icon="trending-up-outline"
              bgColor={colors.success}
              style={styles.earningsCard}
            />
          </View>
        </View>

        {/* Active Ride */}
        {mockData.activeRide.hasActive && (
          <View style={styles.activeRideSection}>
            <Text style={styles.sectionTitle}>Current Ride</Text>
            <View style={styles.activeRideCard}>
              {/* Rider Info */}
              <View style={styles.riderInfoRow}>
                <View style={styles.riderInfo}>
                  <Text style={styles.riderLabel}>Passenger</Text>
                  <Text style={styles.riderName}>{mockData.activeRide.riderName}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>In Progress</Text>
                </View>
              </View>

              {/* Route */}
              <View style={styles.locationRow}>
                <View style={[styles.locationIcon, styles.pickupIcon]}>
                  <Ionicons name="location" size={16} color={colors.success} />
                </View>
                <View style={styles.locationText}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress}>{mockData.activeRide.pickup.address}</Text>
                  <Text style={styles.locationSubLabel}>{mockData.activeRide.pickup.label}</Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <View style={[styles.locationIcon, styles.dropoffIcon]}>
                  <Ionicons name="location" size={16} color={colors.error} />
                </View>
                <View style={styles.locationText}>
                  <Text style={styles.locationLabel}>Dropoff</Text>
                  <Text style={styles.locationAddress}>{mockData.activeRide.dropoff.address}</Text>
                  <Text style={styles.locationSubLabel}>{mockData.activeRide.dropoff.label}</Text>
                </View>
              </View>

              <View style={styles.navigateContainer}>
                <Ionicons name="navigate-outline" size={20} color={colors.info} />
                <Text style={styles.navigateText}>
                  Navigate to Destination
                </Text>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.rideActionsContainer}>
                <TouchableOpacity
                  style={[styles.cancelRideButton, isCancellingRide && styles.buttonDisabled]}
                  onPress={handleCancelActiveRide}
                  disabled={isCancellingRide}
                >
                  <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                  <Text style={[styles.cancelRideText, { color: colors.error }]}>
                    {isCancellingRide ? 'Cancelling...' : 'Cancel Ride'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Pending Requests */}
        {isOnline && mockData.pendingRequests.length > 0 && (
          <View style={styles.pendingRequestsSection}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {mockData.pendingRequests.map((request) => (
              <RequestCard
                key={request.id}
                {...request}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
              />
            ))}
          </View>
        )}

        {/* Offline Message */}
        {!isOnline && (
          <View style={styles.offlineContainer}>
            <View style={styles.offlineIcon}>
              <Ionicons name="time-outline" size={48} color={colors.textLight} />
            </View>
            <Text style={styles.offlineTitle}>
              You're Currently Offline
            </Text>
            <Text style={styles.offlineMessage}>
              Toggle your status to online to start receiving ride requests
            </Text>
          </View>
        )}
      </View>
      
      {/* Cancellation Modal */}
      {mockData.activeRide.hasActive && (
        <CancellationModal
          visible={showCancellationModal}
          onClose={() => setShowCancellationModal(false)}
          onConfirm={handleCancellationConfirm}
          rideId={mockData.activeRide.id}
          cancelledBy="driver"
          rideStatus="active"
        />
      )}
    </DashboardLayout>
  );
};

export default DriverDashboard;
