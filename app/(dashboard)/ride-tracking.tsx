import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ridesService, Ride } from '@/services/ridesService'; // Ensure getRideLocation is available
import { socketService, SocketEventHandlers, RideStatusUpdate, LocationUpdate, DriverAssigned } from '@/services/socketService'; // Ensure LocationUpdate type is correct
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

type RideStatus = 'requested' | 'accepted' | 'driver_en_route' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled';

export default function RideTrackingScreen() {
  const { id, driverId } = useLocalSearchParams<{ id: string; driverId?: string }>();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus>('requested');
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null); // State for driver location
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, isBackendHealthy } = useAuth();
  const router = useRouter();

  // Add a function to fetch the current driver location
  const fetchCurrentDriverLocation = async () => {
    if (!id) {
      console.warn('No ride ID to fetch driver location.');
      return;
    }

    console.log('📍 Fetching current driver location for ride:', id);
    try {
      const result = await ridesService.getRideLocation(id);
      if (result.success && result.data) {
        console.log('✅ Fetched driver location:', result.data);
        setDriverLocation({
          latitude: result.data.lat,
          longitude: result.data.lng,
        });
        // Optionally update ETA if provided in the response
        // if (result.data.eta) setEstimatedArrival(`${result.data.eta} min`);
      } else {
        console.log('⚠️ No driver location available yet or failed to fetch:', result.error);
        // Location might not be available yet (e.g., driver hasn't started tracking)
        // Don't necessarily set driverLocation to null here, might keep the last known location or show a message
        setDriverLocation(null); // Or keep it as null/previous state
      }
    } catch (error) {
      console.error('❌ Error fetching driver location:', error);
      // Optionally, show an error message to the user
      // Alert.alert('Location Error', 'Could not fetch driver location. Retrying...');
      // You might want to retry or handle this error differently
    }
  };

  useEffect(() => {
    if (id) {
      initializeRideTracking();
      setupSocketConnection();
      // Fetch initial location when screen loads
      fetchCurrentDriverLocation();
    }
    
    return () => {
      if (id) {
        socketService.unsubscribeFromRide(id);
      }
    };
  }, [id]);

  const initializeRideTracking = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const result = await ridesService.getRideDetails(id);
      if (result.success && result.data) {
        setRide(result.data);
        setRideStatus(result.data.status as RideStatus);
        console.log('📍 Initialized ride tracking for:', result.data.id);
      } else {
        Alert.alert('Error', 'Failed to load ride details');
        router.back();
      }
    } catch (error) {
      console.error('❌ Error initializing ride tracking:', error);
      Alert.alert('Error', 'Failed to initialize ride tracking');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocketConnection = async () => {
    if (!id) return;

    const handlers: SocketEventHandlers = {
      onStatusUpdate: (data: RideStatusUpdate) => {
        console.log('📡 Ride status update:', data);
        if (data.rideId === id) {
          setRideStatus(data.status as RideStatus);
          
          if (data.status === 'completed') {
            // Ride completed, navigate to completion screen
            router.replace(`/(dashboard)/ride-completion?id=${id}`);
          } else if (data.status === 'cancelled') {
            Alert.alert('Ride Cancelled', data.message || 'Your ride has been cancelled', [
              { text: 'OK', onPress: () => router.replace('/(dashboard)') }
            ]);
          }
        }
      },
      onLocationUpdate: ( LocationUpdate) => { // Ensure LocationUpdate type matches API docs
        console.log('📍 Driver location update (via WS):', data);
        if (data.rideId === id) { // Ensure data has rideId
          setDriverLocation({
            latitude: data.latitude, // Ensure data has lat/lng
            longitude: data.longitude,
          });
          if (data.eta) {
            setEstimatedArrival(`${data.eta} min`);
          }
        }
      },
      onDriverAssigned: (data: DriverAssigned) => {
        console.log('👤 Driver assigned:', data);
        if (data.rideId === id) {
          setAssignedDriver(data.driver);
          setEstimatedArrival(data.estimatedArrival);
          setRideStatus('accepted');
        }
      },
      onError: (error) => {
        console.warn('Socket error:', error);
      }
    };

    await socketService.initialize(handlers);
    socketService.subscribeToRide(id);
  };

  const handleCancelRide = () => {
    if (!ride) return;

    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? Cancellation fees may apply.',
      [
        { text: 'Keep Ride', style: 'cancel' },
        { 
          text: 'Cancel Ride', 
          style: 'destructive',
          onPress: () => router.push(`/(dashboard)/ride-details?id=${ride.id}`)
        }
      ]
    );
  };

  const handleCallDriver = () => {
    if (assignedDriver?.phone) {
      Alert.alert('Call Driver', `Call ${assignedDriver.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('📞 Calling driver:', assignedDriver.phone) }
      ]);
    } else {
      Alert.alert('Contact Info', 'Driver contact information not available');
    }
  };

  const getStatusTitle = (status: RideStatus): string => {
    switch (status) {
      case 'requested': return 'Finding Driver...';
      case 'accepted': return 'Driver Assigned';
      case 'driver_en_route': return 'Driver En Route';
      case 'driver_arrived': return 'Driver Arrived';
      case 'in_progress': return 'Trip in Progress';
      case 'completed': return 'Trip Completed';
      case 'cancelled': return 'Trip Cancelled';
      default: return 'Processing...';
    }
  };

  const getStatusDescription = (status: RideStatus): string => {
    switch (status) {
      case 'requested': return 'We are looking for a driver near your location';
      case 'accepted': return 'A driver has accepted your ride request';
      case 'driver_en_route': return 'Your driver is on the way to pick you up';
      case 'driver_arrived': return 'Your driver has arrived at the pickup location';
      case 'in_progress': return 'You are currently on your trip';
      case 'completed': return 'Your trip has been completed successfully';
      case 'cancelled': return 'Your trip has been cancelled';
      default: return 'Please wait while we process your request';
    }
  };

  const getStatusColor = (status: RideStatus): string => {
    switch (status) {
      case 'requested': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'driver_en_route': return Colors.light.brand.secondary;
      case 'driver_arrived': return '#8B5CF6';
      case 'in_progress': return '#06B6D4';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: RideStatus): string => {
    switch (status) {
      case 'requested': return 'search';
      case 'accepted': return 'checkmark-circle';
      case 'driver_en_route': return 'car';
      case 'driver_arrived': return 'location';
      case 'in_progress': return 'navigate';
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      default: return 'time';
    }
  };

  const getJourneyStatusText = (status: RideStatus): string => {
    switch (status) {
      case 'requested': return 'Searching for driver...';
      case 'accepted': return 'Driver assigned, preparing...';
      case 'driver_en_route': return 'Driver coming to pick you up';
      case 'driver_arrived': return 'Driver waiting at pickup location';
      case 'in_progress': return 'Heading to your destination';
      case 'completed': return 'Journey completed successfully';
      case 'cancelled': return 'Ride was cancelled';
      default: return 'Processing your ride...';
    }
  };

  // Example of how the map might use the driverLocation state
  // This is just a placeholder for the map UI part
  const renderMapPlaceholder = () => (
    <View style={styles.mapPlaceholder}>
      <View style={styles.mapOverlay}>
        <Ionicons name="map-outline" size={32} color="rgba(255,255,255,0.2)" />
        <Text style={styles.mapText}>Live Tracking</Text>
        <Text style={styles.mapSubtext}>Driver Location: {driverLocation ? `${driverLocation.latitude.toFixed(4)}, ${driverLocation.longitude.toFixed(4)}` : 'Loading...'}</Text>
      </View>

      {/* Example indicator for driver location if available */}
      {driverLocation && (
        <View style={styles.driverPositionMarker}>
          <View style={styles.driverMarker}>
            <Ionicons name="car" size={18} color={Colors.light.brand.primary} />
          </View>
          <View style={styles.driverPulse} />
        </View>
      )}

      {/* Example indicator for pickup/dropoff */}
      {ride && (
        <>
          <View style={styles.pickupLocationMarker}>
            <View style={styles.locationMarker}>
              <Ionicons name="location" size={16} color="white" />
            </View>
            <Text style={styles.locationLabel}>Pickup</Text>
          </View>
          <View style={styles.dropoffLocationMarker}>
            <View style={[styles.locationMarker, styles.dropoffMarker]}>
              <Ionicons name="flag" size={16} color="white" />
            </View>
            <Text style={styles.locationLabel}>Destination</Text>
          </View>
        </>
      )}
    </View>
  );


  if (isLoading) {
    return (
      <LinearGradient colors={['#1a1a1a', '#2d1d0c']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.brand.secondary} />
            <Text style={styles.loadingText}>Loading ride details...</Text>
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Track Ride</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Map Area - Now uses driverLocation state */}
          <View style={styles.mapContainer}>
            {renderMapPlaceholder()}

            {/* Estimated Arrival */}
            {estimatedArrival && (
              <View style={styles.etaCard}>
                <Ionicons name="time-outline" size={20} color={Colors.light.brand.secondary} />
                <Text style={styles.etaText}>ETA: {estimatedArrival}</Text>
              </View>
            )}
          </View>

          {/* Status and Details - Uses driverLocation state if needed */}
          <View style={styles.bottomPanel}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(rideStatus) + '20' }]}>
                <Ionicons 
                  name={getStatusIcon(rideStatus) as any} 
                  size={24} 
                  color={getStatusColor(rideStatus)} 
                />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{getStatusTitle(rideStatus)}</Text>
                <Text style={styles.statusDescription}>{getStatusDescription(rideStatus)}</Text>
              </View>
            </View>

            {/* Driver Info */}
            {assignedDriver && (
              <View style={styles.driverCard}>
                <View style={styles.driverInfo}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={24} color="white" />
                  </View>
                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{assignedDriver.name}</Text>
                    <View style={styles.driverMeta}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color={Colors.light.brand.secondary} />
                        <Text style={styles.ratingText}>{assignedDriver.rating}</Text>
                      </View>
                      {assignedDriver.vehicle && (
                        <Text style={styles.vehicleText}>
                          {assignedDriver.vehicle.color} {assignedDriver.vehicle.make}
                        </Text>
                      )}
                    </View>
                    {assignedDriver.vehicle?.licensePlate && (
                      <Text style={styles.licensePlate}>{assignedDriver.vehicle.licensePlate}</Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
                  <Ionicons name="call" size={20} color={Colors.light.brand.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Trip Details */}
            {ride && (
              <View style={styles.tripCard}>
                <Text style={styles.tripTitle}>Trip Details</Text>
                <View style={styles.tripRoute}>
                  {/* Pickup */}
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDot, styles.pickupDot]} />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLabel}>Pickup</Text>
                      <Text style={styles.routeAddress}>{ride.from.address}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.routeLine} />
                  
                  {/* Dropoff */}
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDot, styles.dropoffDot]} />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLabel}>Dropoff</Text>
                      <Text style={styles.routeAddress}>{ride.to.address}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {(rideStatus === 'requested' || rideStatus === 'accepted' || rideStatus === 'driver_en_route') && (
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                  <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.detailsButton} 
                onPress={() => router.push(`/(dashboard)/ride-details?id=${id}`)}
              >
                <Ionicons name="information-circle" size={20} color={Colors.light.brand.primary} />
                <Text style={styles.detailsButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>

            {!isBackendHealthy && (
              <Text style={styles.demoText}>
                🔄 Demo Mode - Simulated tracking
              </Text>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mapOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  mapText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.md,
  },
  mapSubtext: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.4)',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  pickupLocationMarker: {
    position: 'absolute',
    bottom: '25%',
    left: '20%',
    alignItems: 'center',
    zIndex: 3,
  },
  dropoffLocationMarker: {
    position: 'absolute',
    top: '20%',
    right: '20%',
    alignItems: 'center',
    zIndex: 3,
  },
  locationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  dropoffMarker: {
    backgroundColor: '#EF4444',
  },
  locationLabel: {
    fontSize: Typography.fontSize.xs,
    color: 'white',
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.bold,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.xs,
    borderRadius: 4,
  },
  driverPositionMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    // Example: position based on state or calculation relative to map
    // This is a placeholder, actual positioning needs map logic
    // Using driverLocation state to determine position would require map calculations
    // For now, just place it relatively (e.g., 45% from top, 45% from left)
    // This is just a visual placeholder
    left: '45%', // Example - needs dynamic calculation
    top: '45%',  // Example - needs dynamic calculation
  },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 1,
  },
  driverPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.brand.secondary,
    opacity: 0.2,
    zIndex: 0,
  },
  progressIndicator: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    zIndex: 5,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: '#D1D5DB',
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  locationIndicator: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    color: 'white',
  },
  etaCard: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.brand.secondary + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  etaText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
  },
  bottomPanel: {
    backgroundColor: '#374151',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: height * 0.5,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B5563',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    marginBottom: Spacing.xs,
  },
  statusDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4B5563',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    marginBottom: Spacing.xs,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: '#D1D5DB',
  },
  vehicleText: {
    fontSize: Typography.fontSize.sm,
    color: '#9CA3AF',
  },
  licensePlate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.mono,
    color: '#6B7280',
    backgroundColor: '#374151',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripCard: {
    backgroundColor: '#4B5563',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  tripTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
    marginBottom: Spacing.md,
  },
  tripRoute: {
    gap: Spacing.sm,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  pickupDot: {
    backgroundColor: '#10B981',
  },
  dropoffDot: {
    backgroundColor: '#EF4444',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#6B7280',
    marginLeft: 5,
    marginRight: Spacing.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: Typography.fontSize.sm,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: '#EF4444',
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brand.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  detailsButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.light.brand.primary,
  },
  demoText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#F59E0B',
    textAlign: 'center',
  },
});