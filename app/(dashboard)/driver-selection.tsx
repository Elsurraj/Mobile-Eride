  import React, { useState, useEffect } from 'react';
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Alert,
    RefreshControl,
    ActivityIndicator,
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { LinearGradient } from 'expo-linear-gradient';
  import { Ionicons } from '@expo/vector-icons';
  import { useRouter, useLocalSearchParams } from 'expo-router';
  import { useAuth } from '@/contexts/AuthContext';
  import { ridesService, Driver, RideRequest } from '@/services/ridesService';
  import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

  export default function DriverSelectionScreen() {
    const { 
      pickup, 
      dropoff, 
      rideType, 
      notes,
      pickupLabel,
      dropoffLabel 
    } = useLocalSearchParams<{ 
      pickup?: string;
      dropoff?: string;
      rideType?: string;
      notes?: string;
      pickupLabel?: string;
      dropoffLabel?: string;
    }>();

    const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRequestingRide, setIsRequestingRide] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    const { user, isBackendHealthy } = useAuth();
    const router = useRouter();

    useEffect(() => {
      loadAvailableDrivers();
    }, []);

    const loadAvailableDrivers = async () => {
      if (!pickup) {
        Alert.alert('Error', 'Pickup location is required');
        router.back();
        return;
      }

      setIsLoading(true);
      try {
        const pickupData = JSON.parse(decodeURIComponent(pickup));
        const latitude = pickupData.latitude || 6.5244; // Default to Lagos coordinates
        const longitude = pickupData.longitude || 3.3792;

        console.log('🔍 Loading drivers near:', latitude, longitude);
        const result = await ridesService.getAvailableDrivers(latitude, longitude, 15); // 15km radius
        
        if (result.success && result.data) {
          setAvailableDrivers(result.data);
          console.log(`✅ Found ${result.data.length} available drivers`);
        } else {
          console.warn('⚠️ No drivers found:', result.error);
          setAvailableDrivers([]);
        }
      } catch (error) {
        console.error('❌ Error loading drivers:', error);
        Alert.alert('Error', 'Failed to load available drivers. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const handleRefresh = async () => {
      setRefreshing(true);
      await loadAvailableDrivers();
      setRefreshing(false);
    };

    const handleDriverSelect = (driver: Driver) => {
      setSelectedDriver(driver.id === selectedDriver?.id ? null : driver);
    };

    const handleRequestRide = async () => {
      if (!selectedDriver) {
        Alert.alert('No Driver Selected', 'Please select a driver to continue');
        return;
      }

      if (!pickup || !dropoff) {
        Alert.alert('Error', 'Pickup and dropoff locations are required');
        return;
      }

      setIsRequestingRide(true);
      try {
        const pickupData = JSON.parse(decodeURIComponent(pickup));
        const dropoffData = JSON.parse(decodeURIComponent(dropoff));

        const rideRequest: RideRequest = {
          pickup_address: pickupData.address,
          pickup_label: pickupLabel,
          pickup_coordinates: {
            latitude: pickupData.latitude,
            longitude: pickupData.longitude,
          },
          dropoff_address: dropoffData.address,
          dropoff_label: dropoffLabel,
          dropoff_coordinates: {
            latitude: dropoffData.latitude,
            longitude: dropoffData.longitude,
          },
          ride_type: (rideType as any) || 'standard',
          notes: notes || '',
        };

        console.log('🚗 Requesting ride with selected driver:', selectedDriver.name);
        const result = await ridesService.requestRide(rideRequest);
        
        if (result.success && result.data) {
          console.log('✅ Ride request successful! Navigating to driver en-route screen...');
          console.log('🚗 Ride ID:', result.data.id);
          console.log('👤 Driver ID:', selectedDriver.id);
          
          const navigationPath = `/(dashboard)/driver-enroute?id=${result.data.id}&driverId=${selectedDriver.id}`;
          console.log('🧭 Navigation path:', navigationPath);
          
          // Navigate to driver en route screen first
          try {
            console.log('✅ About to navigate to:', navigationPath);
            router.push(navigationPath);
            console.log('✅ Navigation push completed successfully');
            
          } catch (navigationError) {
            console.error('❌ Navigation failed:', navigationError);
            Alert.alert('Navigation Error', 'Failed to navigate to tracking screen. Please try again.');
            // Fallback: try navigating to ride tracking directly
            console.log('🔄 Trying fallback navigation...');
            router.push(`/(dashboard)/ride-tracking?id=${result.data.id}&driverId=${selectedDriver.id}`);
          }
        } else {
          console.error('❌ Ride request failed:', result.error);
          Alert.alert('Request Failed', result.error || 'Unable to request ride with selected driver');
        }
      } catch (error) {
        console.error('❌ Error requesting ride:', error);
        Alert.alert('Error', 'Failed to request ride. Please try again.');
      } finally {
        setIsRequestingRide(false);
      }
    };

    const renderStars = (rating: number) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;

      for (let i = 0; i < fullStars; i++) {
        stars.push(
          <Ionicons key={`full-${i}`} name="star" size={14} color={Colors.light.brand.secondary} />
        );
      }

      if (hasHalfStar) {
        stars.push(
          <Ionicons key="half" name="star-half" size={14} color={Colors.light.brand.secondary} />
        );
      }

      const remainingStars = 5 - Math.ceil(rating);
      for (let i = 0; i < remainingStars; i++) {
        stars.push(
          <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#6B7280" />
        );
      }

      return stars;
    };

    const renderDriverCard = (driver: Driver) => {
      const isSelected = selectedDriver?.id === driver.id;
      
      return (
        <TouchableOpacity
          key={driver.id}
          style={[styles.driverCard, isSelected && styles.driverCardSelected]}
          onPress={() => handleDriverSelect(driver)}
        >
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatarContainer}>
              <View style={[styles.driverAvatar, isSelected && styles.driverAvatarSelected]}>
                <Ionicons name="person" size={24} color={isSelected ? Colors.light.brand.primary : 'white'} />
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            </View>

            <View style={styles.driverDetails}>
              <View style={styles.driverHeader}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {renderStars(driver.rating)}
                  </View>
                  <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
                </View>
              </View>

              {driver.vehicle && (
                <View style={styles.vehicleInfo}>
                  <Ionicons name="car" size={16} color="#6B7280" />
                  <Text style={styles.vehicleText}>
                    {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
                  </Text>
                </View>
              )}

              {driver.vehicle?.license_plate && (
                <View style={styles.licensePlate}>
                  <Ionicons name="card-outline" size={16} color="#6B7280" />
                  <Text style={styles.licensePlateText}>{driver.vehicle.license_plate}</Text>
                </View>
              )}

              <View style={styles.driverStats}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.statText}>{driver.total_rides} trips</Text>
                </View>
                {driver.location && (
                  <View style={styles.statItem}>
                    <Ionicons name="location" size={16} color={Colors.light.brand.secondary} />
                    <Text style={styles.statText}>
                      {Math.round(Math.random() * 5 + 1)} min away
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.light.brand.secondary} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    };

    if (isLoading) {
      return (
        <LinearGradient colors={['#1a1a1a', '#2d1d0c']} style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.brand.secondary} />
              <Text style={styles.loadingText}>Finding available drivers...</Text>
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
            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.light.brand.secondary}
                />
              }
            >
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  
                  <View style={styles.headerContent}>
                    <Text style={styles.title}>Select Driver</Text>
                    <Text style={styles.subtitle}>
                      {availableDrivers.length} driver{availableDrivers.length !== 1 ? 's' : ''} available
                    </Text>
                    {!isBackendHealthy && (
                      <Text style={styles.demoModeText}>
                        🔄 Demo Mode - Showing mock drivers
                      </Text>
                    )}
                  </View>
                </View>

                {availableDrivers.length === 0 ? (
                  <View style={styles.noDriversContainer}>
                    <Ionicons name="car-outline" size={64} color="#6B7280" />
                    <Text style={styles.noDriversTitle}>No Drivers Available</Text>
                    <Text style={styles.noDriversText}>
                      No drivers are currently available in your area. Please try again in a few minutes.
                    </Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                      <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {/* Instructions */}
                    <View style={styles.instructionsCard}>
                      <Ionicons name="information-circle" size={20} color={Colors.light.brand.secondary} />
                      <Text style={styles.instructionsText}>
                        Select a driver from the list below. All drivers are verified and rated by other riders.
                      </Text>
                    </View>

                    {/* Driver List */}
                    <View style={styles.driversContainer}>
                      {availableDrivers.map(renderDriverCard)}
                    </View>

                    {/* Request Ride Button */}
                    <TouchableOpacity
                      style={[styles.requestButton, (!selectedDriver || isRequestingRide) && styles.requestButtonDisabled]}
                      onPress={handleRequestRide}
                      disabled={!selectedDriver || isRequestingRide}
                    >
                      {isRequestingRide ? (
                        <>
                          <ActivityIndicator size="small" color={Colors.light.brand.primary} />
                          <Text style={styles.requestButtonText}>Requesting Ride...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.requestButtonText}>
                            Request Ride {selectedDriver ? `with ${selectedDriver.name}` : ''}
                          </Text>
                          <Ionicons name="arrow-forward" size={20} color={Colors.light.brand.primary} />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
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
    backButton: {
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
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: '#D1D5DB',
      textAlign: 'center',
    },
    demoModeText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: '#F59E0B',
      textAlign: 'center',
      marginTop: Spacing.sm,
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
    noDriversContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    noDriversTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      color: 'white',
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    noDriversText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: '#9CA3AF',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: Spacing.xl,
    },
    refreshButton: {
      backgroundColor: Colors.light.brand.secondary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    refreshButtonText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors.light.brand.primary,
    },
    instructionsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.light.brand.secondary + '20',
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.xl,
      gap: Spacing.sm,
    },
    instructionsText: {
      flex: 1,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: 'white',
      lineHeight: 20,
    },
    driversContainer: {
      gap: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    driverCard: {
      backgroundColor: '#374151',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    driverCardSelected: {
      borderColor: Colors.light.brand.secondary,
      backgroundColor: Colors.light.brand.secondary + '10',
    },
    driverInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    driverAvatarContainer: {
      position: 'relative',
    },
    driverAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#4B5563',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.lg,
    },
    driverAvatarSelected: {
      backgroundColor: Colors.light.brand.secondary,
    },
    statusIndicator: {
      position: 'absolute',
      bottom: 2,
      right: Spacing.lg + 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#374151',
    },
    driverDetails: {
      flex: 1,
    },
    driverHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    driverName: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: 'white',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    starsContainer: {
      flexDirection: 'row',
      gap: 2,
    },
    ratingText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: '#D1D5DB',
    },
    vehicleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    vehicleText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: '#D1D5DB',
    },
    licensePlate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    licensePlateText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.mono,
      color: '#9CA3AF',
      backgroundColor: '#4B5563',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: 4,
    },
    driverStats: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    statText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: '#9CA3AF',
    },
    selectedIndicator: {
      alignSelf: 'center',
      marginLeft: Spacing.sm,
    },
    requestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.light.brand.secondary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    requestButtonDisabled: {
      backgroundColor: '#6B7280',
      opacity: 0.6,
    },
    requestButtonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: Colors.light.brand.primary,
    },
  });
