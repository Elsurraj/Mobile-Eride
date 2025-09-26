import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatDuration } from '@/utils/greetings';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BottomNav from '@/components/BottomNav';

type TabType = 'active' | 'completed' | 'cancelled';

export default function RidesScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Get role-specific label
  const getRidesLabel = () => {
    switch (user?.role) {
      case 'driver':
        return 'Jobs';
      case 'courier':
        return 'Deliveries';
      case 'rider':
      default:
        return 'Rides';
    }
  };

  // Mock data based on user role
  const mockData = {
    active: [
      {
        id: 1,
        type: user?.role === 'courier' ? 'delivery' : 'ride',
        from: 'Lagos Mall',
        to: 'Ikeja City Mall',
        customerName: 'Sarah Johnson',
        status: 'In Progress',
        amount: '₦1,500',
        time: '15 mins ago',
        eta: 12,
      },
    ],
    completed: [
      {
        id: 2,
        type: user?.role === 'courier' ? 'delivery' : 'ride',
        from: 'Victoria Island',
        to: 'Lekki Phase 1',
        customerName: 'Michael Chen',
        status: 'Completed',
        amount: '₦2,200',
        time: '2 hours ago',
        rating: 5,
      },
      {
        id: 3,
        type: user?.role === 'courier' ? 'delivery' : 'ride',
        from: 'Surulere',
        to: 'Yaba',
        customerName: 'Funmi Adebayo',
        status: 'Completed',
        amount: '₦800',
        time: '1 day ago',
        rating: 4,
      },
      {
        id: 4,
        type: user?.role === 'courier' ? 'delivery' : 'ride',
        from: 'Ikoyi',
        to: 'Airport Road',
        customerName: 'John Williams',
        status: 'Completed',
        amount: '₦3,500',
        time: '2 days ago',
        rating: 5,
      },
    ],
    cancelled: [
      {
        id: 5,
        type: user?.role === 'courier' ? 'delivery' : 'ride',
        from: 'Banana Island',
        to: 'Ajah',
        customerName: 'Dr. Sarah Okoro',
        status: 'Cancelled',
        amount: '₦1,200',
        time: '3 days ago',
        cancelledBy: 'rider',
        cancellationReason: 'Changed plans',
        cancellationFee: '₦50',
      },
      {
        id: 6,
        type: user?.role === 'courier' ? 'delivery' : 'ride',
        from: 'Ikeja Mall',
        to: 'Magodo',
        customerName: 'Ahmed Hassan',
        status: 'Cancelled',
        amount: '₦900',
        time: '5 days ago',
        cancelledBy: 'driver',
        cancellationReason: 'Vehicle breakdown',
        replacementAssigned: true,
      },
      {
        id: 7,
        type: user?.role === 'courier' ? 'delivery' : 'ride',
        from: 'Lekki Phase 2',
        to: 'Victoria Island',
        customerName: 'Mary Okafor',
        status: 'Cancelled',
        amount: '₦1,800',
        time: '1 week ago',
        cancelledBy: 'rider',
        cancellationReason: 'Emergency',
        cancellationFee: '₦0',
        feeWaived: true,
      },
    ],
  };

  const handleRideDetails = (ride: any) => {
    console.log('View ride details:', ride.id);
    // TODO: Navigate to ride details screen
  };

  const tabs = [
    { key: 'active' as TabType, label: 'Active', count: mockData.active.length },
    { key: 'completed' as TabType, label: 'Completed', count: mockData.completed.length },
    { key: 'cancelled' as TabType, label: 'Cancelled', count: mockData.cancelled.length },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16}
        color={colors.brand.secondary}
        style={{ marginRight: 2 }}
      />
    ));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.md,
      padding: Spacing.xs,
      ...Shadows.sm,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    activeTab: {
      backgroundColor: colors.brand.secondary,
    },
    tabText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.brand.primary,
    },
    tabCount: {
      backgroundColor: colors.brand.primary,
      color: colors.brand.secondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.bold,
      paddingHorizontal: Spacing.xs,
      borderRadius: BorderRadius.full,
      marginLeft: Spacing.xs,
      minWidth: 18,
      textAlign: 'center',
    },
    activeTabCount: {
      backgroundColor: colors.brand.primary,
      color: colors.brand.secondary,
    },
    ridesContainer: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
    rideCard: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    rideHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    rideCustomer: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      borderRadius: BorderRadius.full,
    },
    activeStatus: {
      backgroundColor: colors.success + '20',
    },
    completedStatus: {
      backgroundColor: colors.info + '20',
    },
    cancelledStatus: {
      backgroundColor: colors.error + '20',
    },
    statusText: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.bold,
      textTransform: 'uppercase',
    },
    activeStatusText: {
      color: colors.success,
    },
    completedStatusText: {
      color: colors.info,
    },
    cancelledStatusText: {
      color: colors.error,
    },
    rideRoute: {
      marginBottom: Spacing.md,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    locationIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    fromIcon: {
      backgroundColor: colors.success + '20',
    },
    toIcon: {
      backgroundColor: colors.error + '20',
    },
    locationText: {
      fontSize: Typography.fontSize.base,
      color: colors.text,
    },
    locationLabel: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
      marginRight: Spacing.sm,
    },
    rideFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rideLeft: {
      flex: 1,
    },
    rideAmount: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.brand.primary,
      marginBottom: Spacing.xs / 2,
    },
    rideTime: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    rideRight: {
      alignItems: 'flex-end',
    },
    etaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    etaText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
      marginLeft: Spacing.xs,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    emptyMessage: {
      fontSize: Typography.fontSize.base,
      color: colors.textLight,
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
    },
    cancellationInfo: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.error,
    },
    cancellationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    cancellationText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.textSecondary,
      marginLeft: Spacing.xs,
    },
    cancellationReason: {
      fontSize: Typography.fontSize.xs,
      color: colors.textLight,
      marginBottom: Spacing.xs,
      fontStyle: 'italic',
    },
    replacementInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    replacementText: {
      fontSize: Typography.fontSize.xs,
      color: colors.success,
      marginLeft: Spacing.xs,
      fontWeight: Typography.fontWeight.medium,
    },
    feeInfo: {
      alignSelf: 'flex-end',
    },
    feeText: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.semibold,
    },
    feeWaived: {
      color: colors.success,
    },
    feeCharged: {
      color: colors.error,
    },
  });

  const currentData = mockData[activeTab];

  return (
    <View style={styles.container}>
      <DashboardLayout title={getRidesLabel()} showHeader={true} scrollable={false}>
        <View style={styles.content}>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <Text
                    style={[
                      styles.tabCount,
                      activeTab === tab.key && styles.activeTabCount,
                    ]}
                  >
                    {tab.count}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Rides List */}
          <ScrollView
            style={styles.ridesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing['3xl'] }}
          >
            {currentData.length > 0 ? (
              currentData.map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={styles.rideCard}
                  onPress={() => handleRideDetails(ride)}
                  activeOpacity={0.7}
                >
                  {/* Header */}
                  <View style={styles.rideHeader}>
                    <Text style={styles.rideCustomer}>
                      {user?.role === 'rider' ? `${ride.type} to ${ride.to}` : ride.customerName}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        ride.status === 'In Progress' && styles.activeStatus,
                        ride.status === 'Completed' && styles.completedStatus,
                        ride.status === 'Cancelled' && styles.cancelledStatus,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          ride.status === 'In Progress' && styles.activeStatusText,
                          ride.status === 'Completed' && styles.completedStatusText,
                          ride.status === 'Cancelled' && styles.cancelledStatusText,
                        ]}
                      >
                        {ride.status}
                      </Text>
                    </View>
                  </View>

                  {/* Route */}
                  <View style={styles.rideRoute}>
                    <View style={styles.locationRow}>
                      <View style={[styles.locationIcon, styles.fromIcon]}>
                        <Ionicons name="location" size={12} color={colors.success} />
                      </View>
                      <Text style={styles.locationLabel}>From:</Text>
                      <Text style={styles.locationText}>{ride.from}</Text>
                    </View>
                    <View style={styles.locationRow}>
                      <View style={[styles.locationIcon, styles.toIcon]}>
                        <Ionicons name="location" size={12} color={colors.error} />
                      </View>
                      <Text style={styles.locationLabel}>To:</Text>
                      <Text style={styles.locationText}>{ride.to}</Text>
                    </View>
                  </View>

                  {/* Cancellation Details */}
                  {ride.status === 'Cancelled' && (ride.cancelledBy || ride.cancellationReason) && (
                    <View style={styles.cancellationInfo}>
                      <View style={styles.cancellationHeader}>
                        <Ionicons 
                          name={ride.cancelledBy === 'rider' ? 'person-outline' : 'car-outline'} 
                          size={14} 
                          color={colors.textSecondary} 
                        />
                        <Text style={styles.cancellationText}>
                          Cancelled by {ride.cancelledBy === 'rider' ? 'you' : 'driver'}
                        </Text>
                      </View>
                      {ride.cancellationReason && (
                        <Text style={styles.cancellationReason}>
                          Reason: {ride.cancellationReason}
                        </Text>
                      )}
                      {ride.replacementAssigned && (
                        <View style={styles.replacementInfo}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                          <Text style={styles.replacementText}>
                            Replacement driver was assigned
                          </Text>
                        </View>
                      )}
                      {ride.cancellationFee && (
                        <View style={styles.feeInfo}>
                          <Text style={[
                            styles.feeText, 
                            ride.feeWaived ? styles.feeWaived : styles.feeCharged
                          ]}>
                            {ride.feeWaived ? 'Fee waived' : `Fee: ${ride.cancellationFee}`}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Footer */}
                  <View style={styles.rideFooter}>
                    <View style={styles.rideLeft}>
                      <Text style={styles.rideAmount}>{ride.amount}</Text>
                      <Text style={styles.rideTime}>{ride.time}</Text>
                    </View>
                    <View style={styles.rideRight}>
                      {ride.status === 'In Progress' && ride.eta && (
                        <View style={styles.etaContainer}>
                          <Ionicons name="time" size={14} color={colors.brand.secondary} />
                          <Text style={styles.etaText}>
                            {formatDuration(ride.eta)}
                          </Text>
                        </View>
                      )}
                      {ride.status === 'Completed' && ride.rating && (
                        <View style={styles.ratingContainer}>
                          {renderStars(ride.rating)}
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name={user?.role === 'courier' ? 'cube-outline' : 'car-outline'}
                    size={48}
                    color={colors.textLight}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  No {activeTab} {getRidesLabel().toLowerCase()}
                </Text>
                <Text style={styles.emptyMessage}>
                  Your {activeTab} {getRidesLabel().toLowerCase()} will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </DashboardLayout>
      <BottomNav />
    </View>
  );
}
