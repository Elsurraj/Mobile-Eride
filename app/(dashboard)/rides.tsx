import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { ridesService, Ride } from '@/services/ridesService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatDuration } from '@/utils/greetings';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BottomNav from '@/components/BottomNav';
import { useRouter } from 'expo-router';

type TabType = 'active' | 'completed' | 'cancelled';

export default function RidesScreen() {
  const { user, isBackendHealthy } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRides();
  }, [activeTab]);

  const loadRides = async () => {
    setIsLoading(true);
    try {
      let result;
      switch (activeTab) {
        case 'active':
          result = await ridesService.getActiveRides();
          break;
        case 'completed':
          result = await ridesService.getCompletedRides();
          break;
        case 'cancelled':
          result = await ridesService.getCancelledRides();
          break;
        default:
          result = await ridesService.getRides();
      }
      
      if (result.success && result.data) {
        setRides(result.data);
      } else {
        console.warn('⚠️ Failed to load rides:', result.error);
        setRides([]);
      }
    } catch (error) {
      console.error('❌ Error loading rides:', error);
      setRides([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

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

  const handleRideDetails = (ride: Ride) => {
    console.log('View ride details:', ride.id);
    router.push(`/(dashboard)/ride-details?id=${ride.id}`);
  };

  const getRidesByStatus = (status: string) => {
    return rides.filter(ride => {
      switch (status) {
        case 'active':
          return ride.status === 'active' || ride.status === 'pending';
        case 'completed':
          return ride.status === 'completed';
        case 'cancelled':
          return ride.status === 'cancelled';
        default:
          return false;
      }
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const tabs = [
    { key: 'active' as TabType, label: 'Active', count: getRidesByStatus('active').length },
    { key: 'completed' as TabType, label: 'Completed', count: getRidesByStatus('completed').length },
    { key: 'cancelled' as TabType, label: 'Cancelled', count: getRidesByStatus('cancelled').length },
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
    demoModeContainer: {
      backgroundColor: colors.brand.secondary + '20',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.md,
    },
    demoModeText: {
      fontSize: Typography.fontSize.sm,
      color: colors.brand.secondary,
      textAlign: 'center',
      fontWeight: Typography.fontWeight.medium,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    loadingText: {
      fontSize: Typography.fontSize.base,
      color: colors.textSecondary,
      marginTop: Spacing.md,
    },
    rideDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: Spacing.md,
      gap: Spacing.md,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      gap: Spacing.xs,
    },
    detailText: {
      fontSize: Typography.fontSize.xs,
      color: colors.textSecondary,
      fontWeight: Typography.fontWeight.medium,
    },
    viewDetailsButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.sm,
    },
  });

  const currentRides = getRidesByStatus(activeTab);

  return (
    <View style={styles.container}>
      <DashboardLayout title={getRidesLabel()} showHeader={true} scrollable={false}>
        <View style={styles.content}>
          {/* Demo Mode Indicator */}
          {!isBackendHealthy && (
            <View style={styles.demoModeContainer}>
              <Text style={styles.demoModeText}>
                🔄 Demo Mode - Showing mock ride data
              </Text>
            </View>
          )}

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

          {/* Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brand.secondary} />
              <Text style={styles.loadingText}>Loading rides...</Text>
            </View>
          ) : (
            /* Rides List */
            <ScrollView
              style={styles.ridesContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Spacing['3xl'] }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.brand.secondary}
                />
              }
            >
              {currentRides.length > 0 ? (
                currentRides.map((ride) => (
                  <TouchableOpacity
                    key={ride.id}
                    style={styles.rideCard}
                    onPress={() => handleRideDetails(ride)}
                    activeOpacity={0.7}
                  >
                    {/* Header */}
                    <View style={styles.rideHeader}>
                      <Text style={styles.rideCustomer}>
                        {user?.role === 'rider' 
                          ? `${ride.type === 'delivery' ? 'Delivery' : 'Ride'} to ${ride.to.address.substring(0, 30)}...`
                          : ride.customer_name || 'Unknown Customer'
                        }
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          (ride.status === 'active' || ride.status === 'pending') && styles.activeStatus,
                          ride.status === 'completed' && styles.completedStatus,
                          ride.status === 'cancelled' && styles.cancelledStatus,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            (ride.status === 'active' || ride.status === 'pending') && styles.activeStatusText,
                            ride.status === 'completed' && styles.completedStatusText,
                            ride.status === 'cancelled' && styles.cancelledStatusText,
                          ]}
                        >
                          {ride.status.toUpperCase()}
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
                        <Text style={styles.locationText} numberOfLines={1}>
                          {ride.from.address}
                        </Text>
                      </View>
                      <View style={styles.locationRow}>
                        <View style={[styles.locationIcon, styles.toIcon]}>
                          <Ionicons name="location" size={12} color={colors.error} />
                        </View>
                        <Text style={styles.locationLabel}>To:</Text>
                        <Text style={styles.locationText} numberOfLines={1}>
                          {ride.to.address}
                        </Text>
                      </View>
                    </View>

                    {/* Additional Details */}
                    <View style={styles.rideDetails}>
                      {ride.distance && (
                        <View style={styles.detailItem}>
                          <Ionicons name="map-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.detailText}>{ride.distance} km</Text>
                        </View>
                      )}
                      {ride.duration && (
                        <View style={styles.detailItem}>
                          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.detailText}>{ride.duration} min</Text>
                        </View>
                      )}
                      {ride.driver_name && (
                        <View style={styles.detailItem}>
                          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.detailText}>{ride.driver_name}</Text>
                        </View>
                      )}
                    </View>

                    {/* Footer */}
                    <View style={styles.rideFooter}>
                      <View style={styles.rideLeft}>
                        <Text style={styles.rideAmount}>{ride.formatted_amount}</Text>
                        <Text style={styles.rideTime}>{formatTimeAgo(ride.created_at)}</Text>
                      </View>
                      <View style={styles.rideRight}>
                        {(ride.status === 'active' || ride.status === 'pending') && ride.eta && (
                          <View style={styles.etaContainer}>
                            <Ionicons name="time" size={14} color={colors.brand.secondary} />
                            <Text style={styles.etaText}>
                              ETA: {ride.eta} min
                            </Text>
                          </View>
                        )}
                        {ride.status === 'completed' && ride.rating && (
                          <View style={styles.ratingContainer}>
                            {renderStars(ride.rating)}
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.viewDetailsButton}
                          onPress={() => handleRideDetails(ride)}
                        >
                          <Ionicons name="arrow-forward" size={16} color={colors.brand.secondary} />
                        </TouchableOpacity>
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
          )}
        </View>
      </DashboardLayout>
      <BottomNav />
    </View>
  );
}
