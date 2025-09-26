import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { getRoleSpecificGreeting, getRoleWelcomeMessage, getStatusMessage } from '@/utils/greetings';
import DashboardLayout from '../layout/DashboardLayout';
import StatCard from '../common/StatCard';
import StatusToggle from '../common/StatusToggle';
import RequestCard from '../common/RequestCard';

const { width } = Dimensions.get('window');

const CourierDashboard: React.FC = () => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isOnline, setIsOnline] = useState(false);

  // Mock data - in real app, this would come from API
  const mockData = {
    todayEarnings: "₦8,500",
    weeklyEarnings: "₦45,200",
    activeDelivery: {
      id: "delivery-789",
      pickup: { address: "Shoprite Mall", label: "Customer Service Desk" },
      dropoff: { address: "Lekki Gardens Estate", label: "Block A, Flat 12" },
      customerName: "Funmi Adebayo",
      hasActive: false
    },
    pendingRequests: [
      {
        id: "req-3",
        type: "delivery" as const,
        pickup: { address: "SPAR Supermarket", label: "Main Entrance" },
        dropoff: { address: "Banana Island", label: "Ocean View Estate" },
        customerName: "John Williams",
        estimatedTime: "5 mins"
      },
      {
        id: "req-4", 
        type: "delivery" as const,
        pickup: { address: "Pharmacy Plus", label: "Victoria Island Branch" },
        dropoff: { address: "Ikoyi Heights", label: "Tower 2, Apt 504" },
        customerName: "Dr. Sarah Okoro",
        estimatedTime: "15 mins"
      }
    ]
  };

  const handleStatusToggle = (newStatus: boolean) => {
    setIsOnline(newStatus);
    const message = newStatus ? "You are now online and ready for deliveries!" : "You are now offline";
    console.log("Status Updated:", message);
  };

  const handleAcceptRequest = (requestId: string) => {
    console.log("Accept delivery request:", requestId);
    console.log("Request Accepted: You've accepted the delivery request. Navigating to pickup location...");
  };

  const handleDeclineRequest = (requestId: string) => {
    console.log("Decline delivery request:", requestId);
    console.log("Request Declined: The delivery request has been declined.");
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
              onlineLabel="Online - Ready for deliveries"
              offlineLabel="Offline - Not accepting deliveries"
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
              bgColor={colors.warning}
              style={styles.earningsCard}
            />
          </View>
        </View>

        {/* Pending Delivery Requests */}
        {isOnline && mockData.pendingRequests.length > 0 && (
          <View style={styles.pendingRequestsSection}>
            <Text style={styles.sectionTitle}>Pending Delivery Requests</Text>
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
              <Ionicons name="cube-outline" size={48} color={colors.textLight} />
            </View>
            <Text style={styles.offlineTitle}>
              You're Currently Offline
            </Text>
            <Text style={styles.offlineMessage}>
              Toggle your status to online to start receiving delivery requests
            </Text>
          </View>
        )}
      </View>
    </DashboardLayout>
  );
};

export default CourierDashboard;
