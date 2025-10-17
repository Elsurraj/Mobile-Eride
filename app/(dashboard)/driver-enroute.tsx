import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ridesService, Ride, Driver } from '@/services/ridesService';
import { socketService, SocketEventHandlers, RideStatusUpdate, LocationUpdate, DriverAssigned } from '@/services/socketService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { LocationService, LocationData } from '@/utils/locationUtils'; // Import LocationService

const { width, height } = Dimensions.get('window');

type DriverStatus = 'assigned' | 'en_route' | 'arriving' | 'arrived' | 'pickup_complete' | 'in_progress' | 'completed';

export default function DriverEnRouteScreen() {
  const { id, driverId } = useLocalSearchParams<{ id: string; driverId?: string }>();
  
  console.log('🎆 DriverEnRouteScreen initialized!');
  console.log('🔍 Received params - Ride ID:', id, 'Driver ID:', driverId);
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('assigned');
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('5 min');
  const [distance, setDistance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));
  
  const { user, isBackendHealthy } = useAuth();
  const router = useRouter();
  const isWatchingLocation = useRef(false); // Use ref to track if location watch is active

  // Add a function to start location watching
  const startLocationWatching = async () => {
    if (isWatchingLocation.current || !id) {
      console.log('📍 Location watching is already active or ride ID is missing.');
      return;
    }

    console.log('📍 Attempting to start location watching for ride:', id);

    const success = await LocationService.startLocationWatch(
      (location: LocationData) => {
        console.log('📍 Location updated via watch:', location);
        // Update local state for UI (optional, depends on your needs)
        setDriverLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        // Send the location to the backend using the ride-specific endpoint
        if (id) {
          console.log('📤 Sending live location to backend for ride:', id, location.latitude, location.longitude);
          // Call the ridesService updateLocation function which uses the correct API endpoint
          ridesService.updateLocation(id, location.latitude, location.longitude)
            .then((result) => {
              if (result.success) {
                console.log('✅ Location successfully sent to backend for ride:', id);
                // Optionally update UI based on success, though WebSocket broadcast handles rider view
              } else {
                console.error('❌ Failed to send location to backend for ride:', id, result.error);
                // Optionally handle backend error, maybe show a warning or retry logic
                // For now, just log it.
              }
            })
            .catch((error) => {
              console.error('❌ Error calling updateLocation API for ride:', id, error);
              // Optionally handle network/API call errors
              // For now, just log it.
            });
        } else {
          console.warn('📍 Ride ID not available in location callback, cannot send location.');
        }
      },
      {
        // Configure watch options: e.g., update every 5 seconds or every 10 meters
        timeInterval: 5000, // 5 seconds
        distanceInterval: 10, // 10 meters
        accuracy: Location.Accuracy.High, // Use the Accuracy enum from expo-location
      }
    );

    if (success) {
      isWatchingLocation.current = true;
      console.log('✅ Successfully started location watching for ride:', id);
    } else {
      console.error('❌ Failed to start location watching for ride:', id);
      // Optionally, show an alert to the driver if location tracking fails critically
      Alert.alert('Location Error', 'Failed to start location tracking. Please check permissions.');
    }
  };

  // Add a function to stop location watching
  const stopLocationWatching = () => {
    if (isWatchingLocation.current) {
      console.log('📍 Stopping location watching.');
      LocationService.stopLocationWatch();
      isWatchingLocation.current = false;
    } else {
      console.log('📍 Location watching was not active.');
    }
  };

  useEffect(() => {
    console.log('🎆 DriverEnRouteScreen useEffect triggered with id:', id);
    if (id) {
      console.log('🚀 Initializing driver tracking...');
      initializeDriverTracking();
      setupSocketConnection();
      startPulseAnimation();
    } else {
      console.error('❌ No ID provided to DriverEnRouteScreen!');
    }
    
    return () => {
      console.log('🧽 Cleaning up DriverEnRouteScreen for ride:', id);
      if (id) {
        socketService.unsubscribeFromRide(id);
        // IMPORTANT: Stop location watching when component unmounts
        if (isWatchingLocation.current) {
          stopLocationWatching(); // Use the new function
        }
      }
    };
  }, [id]); // Only depend on id

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const initializeDriverTracking = async () => {
    if (!id) {
      console.error('❌ No ride ID provided to driver-enroute screen!');
      return;
    }
    
    console.log('🚀 Starting driver tracking initialization for ride:', id);
    setIsLoading(true);
    try {
      const result = await ridesService.getRideDetails(id);
      if (result.success && result.data) {
        setRide(result.data);
        console.log('✅ Successfully initialized driver tracking for ride:', result.data.id);
        console.log('📝 Ride data:', result.data);

        // Determine if the ride is already in progress or the driver is en route
        // You might need to adjust this logic based on the exact status values from your backend
        if (result.data.status === 'in_progress' || result.data.status === 'driver_en_route') {
             // If the ride is already in progress or the driver is en route, start watching immediately
            startLocationWatching();
        }
        // Otherwise, start watching when the status changes to 'en_route' or 'in_progress' (handled in handleStatusUpdate)

        // Simulate driver assignment (this part might be removed if real data comes from backend/WS)
        setTimeout(() => {
          const mockDriver: Driver = {
            id: driverId || 'driver_001',
            name: 'Ahmed Okonkwo',
            email: 'ahmed.driver@eride.com',
            phone: '+234-8012-345-678',
            rating: 4.8,
            total_rides: 245,
            status: 'busy',
            location: {
              latitude: 6.5244 + (Math.random() - 0.5) * 0.02,
              longitude: 3.3792 + (Math.random() - 0.5) * 0.02,
              accuracy: 10,
              timestamp: new Date().toISOString()
            },
            vehicle: {
              make: 'Toyota',
              model: 'Camry',
              year: 2020,
              license_plate: 'LAG-123-ABC',
              color: 'Silver',
              type: 'sedan'
            },
            created_at: '2023-01-15T10:00:00Z',
            updated_at: new Date().toISOString()
          };
          setDriver(mockDriver);
          setDriverLocation(mockDriver.location!);
          setDistance(Math.random() * 3 + 0.5); // 0.5-3.5 km away
        }, 1500);
      } else {
        console.error('❌ Failed to load ride details:', result.error);
        // Don't automatically navigate back - stay on the screen for debugging
        Alert.alert('Loading Error', 'Failed to load ride details, but staying on tracking screen');
      }
    } catch (error) {
      console.error('❌ Error initializing driver tracking:', error);
      // Don't automatically navigate back - stay on the screen for debugging
      Alert.alert('Tracking Error', 'Failed to initialize driver tracking, but staying on screen for debugging');
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocketConnection = async () => {
    if (!id) return;

    const handlers: SocketEventHandlers = {
      onStatusUpdate: (data: RideStatusUpdate) => {
        console.log('📡 Driver status update:', data);
        if (data.rideId === id) {
          handleStatusUpdate(data.status);
        }
      },
      onLocationUpdate: (data: LocationUpdate) => {
        console.log('📍 Driver location update (received via WS):', data);
        // This handler is for receiving *other* updates (e.g., maybe rider location in the future)
        // For the driver's own tracking, we rely on the local watch callback and sending to backend
        // If the rider's screen receives this, it updates the driver's position on their map
        // This is still important for the rider's view, but the driver sends updates via startLocationWatching
        if (data.rideId === id) {
          // Example: Update state if needed for rider's perspective on driver screen (less common)
          // setDriverLocationReceivedFromRider({ latitude: data.latitude, longitude: data.longitude });
          if (data.eta) {
            setEstimatedArrival(`${data.eta} min`);
          }
          if (data.distance) {
            setDistance(data.distance);
          }
        }
      },
      onDriverAssigned: (data: DriverAssigned) => {
        console.log('👤 Driver confirmed assignment:', data);
        if (data.rideId === id) {
          setEstimatedArrival(data.estimatedArrival);
          setDriverStatus('en_route');
          // Start watching location when the driver is assigned and en route
          // Check if status is already 'en_route' or similar, then start
          // Or rely on handleStatusUpdate if it gets called after assignment
          // For now, let handleStatusUpdate manage it.
        }
      },
      onError: (error) => {
        console.warn('Socket error:', error);
      }
    };

    await socketService.initialize(handlers);
    socketService.subscribeToRide(id);
    
    // Simulate driver status progression (REMOVE THIS in production, rely on backend/WS)
    // simulateDriverProgress(); // Commented out as we want real backend/WS updates
  };

  const handleStatusUpdate = (status: string) => {
    console.log('📍 Handling status update:', status);
    switch (status) {
      case 'accepted':
        setDriverStatus('assigned');
        break;
      case 'driver_en_route':
        setDriverStatus('en_route');
        // Start watching location when the driver is en route
        startLocationWatching();
        break;
      case 'driver_arrived':
        console.log('🏁 Status update: Driver arrived!');
        setDriverStatus('arrived');
        // Stop watching when arrived (or keep it running if needed during wait time)
        // stopLocationWatching(); // Uncomment if you want to stop when arrived
        // DISABLED: Auto-navigate to let user see the arrived state
        // setTimeout(() => {
        //   router.replace(`/(dashboard)/ride-tracking?id=${id}&driverId=${driverId}`);
        // }, 2000);
        break;
      case 'in_progress':
        console.log('🚗 Status update: Trip in progress!');
        setDriverStatus('in_progress'); // Update status to in_progress
        // Ensure watching is active if it wasn't already
        startLocationWatching();
        // Navigate to the main ride tracking screen (for driver or rider view, depending on implementation)
        // This might be the same screen or a different one
        // router.replace(`/(dashboard)/ride-tracking?id=${id}&driverId=${driverId}`);
        break;
      case 'completed':
         console.log('🏁 Status update: Trip completed!');
         setDriverStatus('completed'); // Set status to completed
         // Stop watching when ride is completed
         stopLocationWatching();
         // Navigate away or update UI for completion
         // router.replace(`/(dashboard)/ride-completion?id=${id}`);
         break;
    }
  };

  // Simulate driver progress (REMOVE THIS in production, rely on backend/WS and real GPS)
  // const simulateDriverProgress = () => {
  //   // ... existing simulation code ...
  // };

  const handleCallDriver = () => {
    if (driver?.phone) {
      Alert.alert('Call Driver', `Call ${driver.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('📞 Calling driver:', driver.phone) }
      ]);
    } else {
      Alert.alert('Contact Info', 'Driver contact information not available');
    }
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? The driver is already on the way.',
      [
        { text: 'Keep Ride', style: 'cancel' },
        { 
          text: 'Cancel Ride', 
          style: 'destructive',
          onPress: () => router.push(`/(dashboard)/ride-details?id=${id}`)
        }
      ]
    );
  };

  const getStatusTitle = (status: DriverStatus): string => {
    switch (status) {
      case 'assigned': return 'Driver Assigned!';
      case 'en_route': return 'Driver En Route';
      case 'arriving': return 'Driver Arriving';
      case 'arrived': return 'Driver Arrived!';
      case 'in_progress': return 'Trip in Progress';
      case 'completed': return 'Trip Completed';
      default: return 'Processing...';
    }
  };

  const getStatusDescription = (status: DriverStatus): string => {
    switch (status) {
      case 'assigned': return 'Your driver has accepted the ride and is getting ready';
      case 'en_route': return 'Your driver is on the way to pick you up';
      case 'arriving': return 'Your driver is almost at the pickup location';
      case 'arrived': return 'Your driver has arrived at the pickup location';
      case 'in_progress': return 'You are currently on your trip';
      case 'completed': return 'Your trip has been completed successfully';
      default: return 'Please wait...';
    }
  };

  const getStatusColor = (status: DriverStatus): string => {
    switch (status) {
      case 'assigned': return '#10B981';
      case 'en_route': return Colors.light.brand.secondary;
      case 'arriving': return '#F59E0B';
      case 'arrived': return '#8B5CF6';
      case 'in_progress': return '#06B6D4';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#1a1a1a', '#2d1d0c']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.brand.secondary} />
            <Text style={styles.loadingText}>Connecting with your driver...</Text>
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
            <Text style={styles.headerTitle}>Driver Tracking</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Map Area with Driver Location */}
          <View style={styles.mapContainer}>
            <View style={styles.mapPlaceholder}>
              {/* Map Background */}
              <View style={styles.mapGrid}>
                {Array.from({ length: 8 }, (_, i) => (
                  <View key={`row-${i}`} style={styles.gridRow}>
                    {Array.from({ length: 6 }, (_, j) => (
                      <View key={`cell-${i}-${j}`} style={styles.gridCell} />
                    ))}
                  </View>
                ))}
              </View>
              
              <View style={styles.mapOverlay}>
                <Ionicons name="map-outline" size={32} color="rgba(255,255,255,0.2)" />
                <Text style={styles.mapText}>Live Driver Tracking</Text>
                <Text style={styles.mapSubtext}>
                  {driver ? `${driver.name} is heading your way` : 'Tracking driver location...'}
                </Text>
              </View>
              
              {/* Route line from driver to pickup */}
              {driverLocation && (
                <View style={styles.routeLine} />
              )}
              
              {/* Driver location indicator with pulse animation */}
              {driverLocation && (
                <Animated.View style={[styles.driverIndicator, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.driverMarker}>
                    <Ionicons name="car" size={20} color={Colors.light.brand.primary} />
                  </View>
                  <View style={styles.driverPulse} />
                </Animated.View>
              )}

              {/* Pickup location indicator */}
              <View style={styles.pickupIndicator}>
                <View style={styles.pickupMarker}>
                  <Ionicons name="location" size={16} color="white" />
                </View>
                <Text style={styles.indicatorLabel}>You</Text>
              </View>

              {/* Distance and ETA overlay */}
              {driverLocation && (
                <View style={styles.mapStatsOverlay}>
                  <View style={styles.mapStat}>
                    <Text style={styles.mapStatValue}>{distance.toFixed(1)}km</Text>
                    <Text style={styles.mapStatLabel}>Distance</Text>
                  </View>
                  <View style={styles.mapStat}>
                    <Text style={styles.mapStatValue}>{estimatedArrival}</Text>
                    <Text style={styles.mapStatLabel}>ETA</Text>
                  </View>
                </View>
              )}
            </View>

            {/* ETA Card */}
            <View style={styles.etaCard}>
              <View style={styles.etaContent}>
                <Ionicons name="time-outline" size={24} color={Colors.light.brand.secondary} />
                <View style={styles.etaInfo}>
                  <Text style={styles.etaTime}>{estimatedArrival}</Text>
                  <Text style={styles.etaLabel}>Estimated Arrival</Text>
                </View>
              </View>
              <View style={styles.distanceInfo}>
                <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
              </View>
            </View>
          </View>

          {/* Driver and Status Info */}
          <View style={styles.bottomPanel}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(driverStatus) + '20' }]}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={getStatusColor(driverStatus)} 
                />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{getStatusTitle(driverStatus)}</Text>
                <Text style={styles.statusDescription}>{getStatusDescription(driverStatus)}</Text>
              </View>
            </View>

            {/* Driver Info Card */}
            {driver && (
              <View style={styles.driverCard}>
                <View style={styles.driverInfo}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={24} color="white" />
                  </View>
                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{driver.name}</Text>
                    <View style={styles.driverMeta}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color={Colors.light.brand.secondary} />
                        <Text style={styles.ratingText}>{driver.rating}</Text>
                      </View>
                      {driver.vehicle && (
                        <Text style={styles.vehicleText}>
                          {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
                        </Text>
                      )}
                    </View>
                    {driver.vehicle?.license_plate && (
                      <Text style={styles.licensePlate}>{driver.vehicle.license_plate}</Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
                  <Ionicons name="call" size={20} color={Colors.light.brand.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Trip Overview */}
            {ride && (
              <View style={styles.tripOverview}>
                <Text style={styles.tripTitle}>Trip Overview</Text>
                <View style={styles.tripRoute}>
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDot, styles.pickupDot]} />
                    <Text style={styles.routeText} numberOfLines={1}>{ride.from.address}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDot, styles.dropoffDot]} />
                    <Text style={styles.routeText} numberOfLines={1}>{ride.to.address}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {driverStatus === 'arrived' ? (
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={() => {
                    console.log('🎆 User manually proceeding to ride tracking');
                    router.replace(`/(dashboard)/ride-tracking?id=${id}&driverId=${driverId}`);
                  }}
                >
                  <Ionicons name="car" size={20} color={Colors.light.brand.primary} />
                  <Text style={styles.continueButtonText}>Start Journey</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
                    <Ionicons name="close" size={20} color="#EF4444" />
                    <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.messageButton}
                    onPress={() => Alert.alert('Message Driver', 'Messaging feature coming soon!')}
                  >
                    <Ionicons name="chatbubble" size={20} color={Colors.light.brand.primary} />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {!isBackendHealthy && (
              <Text style={styles.demoText}>
                🔄 Demo Mode - Simulated driver tracking
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
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#6B7280',
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
    paddingHorizontal: Spacing.lg,
  },
  routeLine: {
    position: 'absolute',
    top: '32%',
    left: '28%',
    width: 180,
    height: 2,
    backgroundColor: Colors.light.brand.secondary,
    opacity: 0.6,
    transform: [{ rotate: '25deg' }],
    zIndex: 2,
  },
  driverIndicator: {
    position: 'absolute',
    top: '25%',
    right: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
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
  pickupIndicator: {
    position: 'absolute',
    bottom: '30%',
    left: '25%',
    alignItems: 'center',
    zIndex: 3,
  },
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  indicatorLabel: {
    fontSize: Typography.fontSize.xs,
    color: 'white',
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.bold,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.xs,
    borderRadius: 4,
  },
  mapStatsOverlay: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'column',
    gap: Spacing.sm,
    zIndex: 4,
  },
  mapStat: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    minWidth: 60,
  },
  mapStatValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
  },
  mapStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: '#D1D5DB',
    marginTop: 1,
  },
  etaCard: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#374151',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  etaInfo: {
    alignItems: 'flex-start',
  },
  etaTime: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
  },
  etaLabel: {
    fontSize: Typography.fontSize.sm,
    color: '#D1D5DB',
  },
  distanceInfo: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: '#9CA3AF',
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
  tripOverview: {
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
  routeText: {
    flex: 1,
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
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brand.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  messageButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.light.brand.primary,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brand.secondary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  demoText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#F59E0B',
    textAlign: 'center',
  },
});