import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ridesService, Ride } from '@/services/ridesService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { CancellationModal } from '@/components/modals/CancellationModal';
import { socketService, SocketEventHandlers } from '@/services/socketService';

export default function RideDetailsScreen() {
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { user, isBackendHealthy } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      fetchRideDetails();
      setupSocketConnection();
    }
    
    return () => {
      if (id) {
        socketService.unsubscribeFromRide(id);
      }
    };
  }, [id]);

  const setupSocketConnection = async () => {
    if (!id) return;

    const handlers: SocketEventHandlers = {
      onStatusUpdate: (data) => {
        console.log('📡 Ride status update:', data);
        if (data.rideId === id) {
          fetchRideDetails(); // Refresh ride details on status update
        }
      },
      onRideCancelled: (data) => {
        console.log('❌ Ride cancellation update:', data);
        if (data.rideId === id) {
          Alert.alert(
            'Ride Cancelled',
            data.cancelled_by === 'driver' 
              ? `Driver cancelled the ride: ${data.reason || 'No reason provided'}`
              : 'Your ride has been cancelled',
            [{ text: 'OK', onPress: () => fetchRideDetails() }]
          );
        }
      },
      onError: (error) => {
        console.warn('Socket error:', error);
      }
    };

    await socketService.initialize(handlers);
    socketService.subscribeToRide(id);
  };

  const fetchRideDetails = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const result = await ridesService.getRideDetails(id);
      if (result.success && result.data) {
        setRide(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load ride details');
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      Alert.alert('Error', 'Failed to load ride details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRide = () => {
    if (!ride) return;
    setShowCancellationModal(true);
  };

  const handleCancellationConfirm = async (reasonId?: string, notes?: string) => {
    if (!ride) return;

    setIsCancelling(true);
    try {
      const result = await ridesService.cancelRideByRider(ride.id, reasonId, notes);
      
      if (result.success && result.data) {
        const { penalty, cancellation_fee_waived } = result.data;
        
        let message = 'Your ride has been cancelled successfully.';
        if (penalty && !cancellation_fee_waived) {
          message += ` A cancellation fee of ${penalty.formatted_amount} will be charged.`;
        } else if (cancellation_fee_waived) {
          message += ' No cancellation fee was charged.';
        }
        
        Alert.alert('Ride Cancelled', message, [
          { text: 'OK', onPress: () => router.replace('/(dashboard)') }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel ride');
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
      Alert.alert('Error', 'Failed to cancel ride. Please try again.');
    } finally {
      setIsCancelling(false);
      setShowCancellationModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return '#6366F1';
      case 'cancelled':
        return '#EF4444';
      case 'pending':
      default:
        return '#F59E0B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'car';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'pending':
      default:
        return 'time';
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2d1d0c']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading ride details...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!ride) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2d1d0c']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Ride not found</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(dashboard)')}
            >
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <LinearGradient
        colors={['#1a1a1a', '#2d1d0c']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.headerBackButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                  <Text style={styles.title}>Ride Details</Text>
                  {!isBackendHealthy && (
                    <Text style={styles.demoModeText}>
                      🔄 Demo Mode
                    </Text>
                  )}
                </View>
              </View>

              {/* Status Card */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <View style={[styles.statusIcon, { backgroundColor: getStatusColor(ride.status) + '20' }]}>
                    <Ionicons 
                      name={getStatusIcon(ride.status) as any} 
                      size={24} 
                      color={getStatusColor(ride.status)} 
                    />
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusLabel}>Status</Text>
                    <Text style={[styles.statusValue, { color: getStatusColor(ride.status) }]}>
                      {ride.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.rideId}>#{ride.id.slice(-6)}</Text>
                </View>
                
                {ride.eta && ride.status === 'pending' && (
                  <View style={styles.etaContainer}>
                    <Ionicons name="time" size={20} color={Colors.light.brand.secondary} />
                    <Text style={styles.etaText}>
                      Estimated pickup in {ride.eta} minutes
                    </Text>
                  </View>
                )}
              </View>

              {/* Trip Details */}
              <View style={styles.tripCard}>
                <Text style={styles.sectionTitle}>Trip Details</Text>
                
                {/* Pickup */}
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <View style={styles.pickupDot} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Pickup</Text>
                    <Text style={styles.locationAddress}>{ride.from.address}</Text>
                    {ride.from.label && (
                      <Text style={styles.locationSubtext}>{ride.from.label}</Text>
                    )}
                  </View>
                </View>

                {/* Connection Line */}
                <View style={styles.connectionLine} />

                {/* Dropoff */}
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <View style={styles.dropoffDot} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Dropoff</Text>
                    <Text style={styles.locationAddress}>{ride.to.address}</Text>
                    {ride.to.label && (
                      <Text style={styles.locationSubtext}>{ride.to.label}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Ride Info */}
              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Ride Information</Text>
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="car" size={20} color="#6B7280" />
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>{ride.type.charAt(0).toUpperCase() + ride.type.slice(1)}</Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="cash" size={20} color="#6B7280" />
                    <Text style={styles.infoLabel}>Amount</Text>
                    <Text style={styles.infoValue}>{ride.formatted_amount}</Text>
                  </View>
                  
                  {ride.distance && (
                    <View style={styles.infoItem}>
                      <Ionicons name="map" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Distance</Text>
                      <Text style={styles.infoValue}>{ride.distance} km</Text>
                    </View>
                  )}
                  
                  {ride.duration && (
                    <View style={styles.infoItem}>
                      <Ionicons name="time" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Duration</Text>
                      <Text style={styles.infoValue}>{ride.duration} mins</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Driver Info */}
              {ride.driver_name && (
                <View style={styles.driverCard}>
                  <Text style={styles.sectionTitle}>Driver Information</Text>
                  <View style={styles.driverInfo}>
                    <View style={styles.driverAvatar}>
                      <Ionicons name="person" size={24} color="white" />
                    </View>
                    <Text style={styles.driverName}>{ride.driver_name}</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonsContainer}>
                {(ride.status === 'pending' || ride.status === 'active') && (
                  <TouchableOpacity
                    style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
                    onPress={handleCancelRide}
                    disabled={isCancelling}
                  >
                    <Text style={styles.cancelButtonText}>
                      {isCancelling ? 'Cancelling...' : 'Cancel Ride'}
                    </Text>
                    <Ionicons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.backToDashboardButton}
                  onPress={() => router.replace('/(dashboard)')}
                >
                  <Text style={styles.backToDashboardButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
      
      {/* Cancellation Modal */}
      {ride && (
        <CancellationModal
          visible={showCancellationModal}
          onClose={() => setShowCancellationModal(false)}
          onConfirm={handleCancellationConfirm}
          rideId={ride.id}
          cancelledBy="rider"
          rideFare={ride.amount}
          rideStatus={ride.status}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: 'white',
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: '#EF4444',
    marginBottom: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerBackButton: {
    alignSelf: 'flex-start',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
  },
  demoModeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  statusCard: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
  statusValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  rideId: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.mono,
    color: '#6B7280',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B5563',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  etaText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: 'white',
  },
  tripCard: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
    marginBottom: Spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  locationIcon: {
    width: 30,
    alignItems: 'center',
    marginRight: Spacing.md,
    paddingTop: 4,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  connectionLine: {
    width: 2,
    height: 20,
    backgroundColor: '#4B5563',
    marginLeft: 14,
    marginBottom: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: '#9CA3AF',
  },
  locationAddress: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
    marginTop: Spacing.xs,
  },
  locationSubtext: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: Spacing.xs,
  },
  infoCard: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
    flex: 1,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
  },
  driverCard: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  driverName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
  },
  buttonsContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  cancelButton: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backToDashboardButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  backToDashboardButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  backButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.light.brand.primary,
  },
});
