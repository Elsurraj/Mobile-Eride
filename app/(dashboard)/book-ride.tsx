import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ridesService, RideRequest } from '@/services/ridesService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { LocationData } from '@/utils/locationUtils';

export default function BookRideScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickupLabel: '',
    dropoffAddress: '',
    dropoffLabel: '',
    rideType: (type === 'delivery' ? 'delivery' : 'standard') as 'standard' | 'premium' | 'delivery',
    notes: '',
  });
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const { user, isBackendHealthy } = useAuth();
  const router = useRouter();

  const rideTypes = [
    { 
      key: 'standard', 
      label: 'Standard', 
      description: 'Affordable rides for daily commute',
      icon: 'car',
      price: '₦150-300'
    },
    { 
      key: 'premium', 
      label: 'Premium', 
      description: 'Comfortable rides with premium vehicles',
      icon: 'car-sport',
      price: '₦300-600'
    },
    { 
      key: 'delivery', 
      label: 'Delivery', 
      description: 'Send packages safely and quickly',
      icon: 'cube',
      price: '₦100-250'
    },
  ];

  const handleMapSelection = () => {
    router.push('/(dashboard)/map');
  };

  const handleLocationSelect = (pickup: LocationData, dropoff: LocationData) => {
    setPickupLocation(pickup);
    setDropoffLocation(dropoff);
    setFormData(prev => ({
      ...prev,
      pickupAddress: pickup.address || '',
      dropoffAddress: dropoff.address || '',
    }));
  };

  const handleRequestRide = async () => {
    if (isLoading) return;

    // Use location data if available, otherwise fall back to text input
    const pickupAddr = pickupLocation?.address || formData.pickupAddress.trim();
    const dropoffAddr = dropoffLocation?.address || formData.dropoffAddress.trim();

    // Basic validation
    if (!pickupAddr) {
      Alert.alert('Error', 'Please enter or select pickup location');
      return;
    }
    if (!dropoffAddr) {
      Alert.alert('Error', 'Please enter or select dropoff location');
      return;
    }

    setIsLoading(true);
    try {
      const rideRequest: RideRequest = {
        pickup_address: pickupAddr,
        pickup_label: formData.pickupLabel,
        dropoff_address: dropoffAddr,
        dropoff_label: formData.dropoffLabel,
        ride_type: formData.rideType,
        notes: formData.notes,
        // Include coordinates if available from map selection
        pickup_coordinates: pickupLocation ? {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
        } : undefined,
        dropoff_coordinates: dropoffLocation ? {
          latitude: dropoffLocation.latitude,
          longitude: dropoffLocation.longitude,
        } : undefined,
      };

      console.log('🚗 Requesting ride with data:', rideRequest);
      
      const result = await ridesService.requestRide(rideRequest);
      
      if (result.success && result.data) {
        Alert.alert(
          'Ride Requested!', 
          `Your ${formData.rideType} ride has been requested. Ride ID: ${result.data.id}`,
          [
            {
              text: 'View Details',
              onPress: () => router.replace(`/(dashboard)/ride-details?id=${result.data.id}`)
            },
            {
              text: 'Back to Dashboard',
              onPress: () => router.replace('/(dashboard)')
            }
          ]
        );
      } else {
        Alert.alert('Request Failed', result.error || 'Unable to request ride');
      }
    } catch (error) {
      console.error('Error requesting ride:', error);
      Alert.alert('Error', 'Failed to request ride. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                    <Text style={styles.title}>Book a Ride</Text>
                    <Text style={styles.subtitle}>
                      Where would you like to go today?
                    </Text>
                    {!isBackendHealthy && (
                      <Text style={styles.demoModeText}>
                        🔄 Demo Mode - Real booking will be available when connected
                      </Text>
                    )}
                  </View>
                </View>

                {/* Locations Form */}
                <View style={styles.form}>
                  <Text style={styles.sectionTitle}>Trip Details</Text>
                  
                  {/* Pickup Location */}
                  <View style={styles.locationGroup}>
                    <View style={styles.locationIcon}>
                      <View style={styles.pickupDot} />
                    </View>
                    <View style={styles.locationInputs}>
                      <Text style={styles.inputLabel}>Pickup Location</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.pickupAddress}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, pickupAddress: text }))}
                        placeholder="Enter pickup address"
                        placeholderTextColor="#6B7280"
                        multiline={false}
                      />
                      <TextInput
                        style={[styles.textInput, styles.smallInput]}
                        value={formData.pickupLabel}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, pickupLabel: text }))}
                        placeholder="Label (e.g., Home, Office)"
                        placeholderTextColor="#6B7280"
                      />
                    </View>
                  </View>

                  {/* Connection Line */}
                  <View style={styles.connectionLine} />

                  {/* Dropoff Location */}
                  <View style={styles.locationGroup}>
                    <View style={styles.locationIcon}>
                      <View style={styles.dropoffDot} />
                    </View>
                    <View style={styles.locationInputs}>
                      <Text style={styles.inputLabel}>Dropoff Location</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.dropoffAddress}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, dropoffAddress: text }))}
                        placeholder="Enter destination address"
                        placeholderTextColor="#6B7280"
                        multiline={false}
                      />
                      <TextInput
                        style={[styles.textInput, styles.smallInput]}
                        value={formData.dropoffLabel}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, dropoffLabel: text }))}
                        placeholder="Label (e.g., Mall, Airport)"
                        placeholderTextColor="#6B7280"
                      />
                    </View>
                  </View>

                  {/* Map Selection Button */}
                  <TouchableOpacity
                    style={styles.mapSelectionButton}
                    onPress={handleMapSelection}
                  >
                    <Ionicons name="map" size={20} color={Colors.light.brand.secondary} />
                    <Text style={styles.mapSelectionText}>Select on Map</Text>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </TouchableOpacity>

                  {/* Location Status */}
                  {(pickupLocation || dropoffLocation) && (
                    <View style={styles.locationStatus}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
                      <Text style={styles.locationStatusText}>
                        {pickupLocation && dropoffLocation 
                          ? 'Both locations selected on map'
                          : pickupLocation 
                          ? 'Pickup location selected on map'
                          : 'Dropoff location selected on map'
                        }
                      </Text>
                    </View>
                  )}

                  {/* Ride Type Selection */}
                  <Text style={styles.sectionTitle}>Choose Ride Type</Text>
                  <View style={styles.rideTypesContainer}>
                    {rideTypes.map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        style={[
                          styles.rideTypeOption,
                          formData.rideType === type.key && styles.rideTypeOptionActive
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, rideType: type.key as any }))}
                      >
                        <View style={styles.rideTypeHeader}>
                          <Ionicons 
                            name={type.icon as any} 
                            size={24} 
                            color={formData.rideType === type.key ? Colors.light.brand.secondary : '#6B7280'} 
                          />
                          <Text style={[
                            styles.rideTypeLabel,
                            formData.rideType === type.key && styles.rideTypeLabelActive
                          ]}>
                            {type.label}
                          </Text>
                          <Text style={styles.rideTypePrice}>{type.price}</Text>
                        </View>
                        <Text style={styles.rideTypeDescription}>{type.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Additional Notes */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={formData.notes}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                      placeholder="Any special instructions or requests..."
                      placeholderTextColor="#6B7280"
                      multiline={true}
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleRequestRide}
                    disabled={isLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLoading ? 'Requesting Ride...' : 'Request Ride'}
                    </Text>
                    <Ionicons name="navigate" size={20} color={Colors.light.brand.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.back()}
                    disabled={isLoading}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
  keyboardView: {
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
  form: {
    flex: 1,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  locationIcon: {
    width: 30,
    alignItems: 'center',
    marginRight: Spacing.md,
    paddingTop: 12,
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
  locationInputs: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: '#D1D5DB',
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: 'white',
    borderWidth: 1,
    borderColor: '#4B5563',
    marginBottom: Spacing.sm,
  },
  smallInput: {
    fontSize: Typography.fontSize.sm,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  mapSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  mapSelectionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: 'white',
    marginLeft: Spacing.md,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success + '20',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  locationStatusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.success,
    marginLeft: Spacing.xs,
  },
  rideTypesContainer: {
    gap: Spacing.md,
  },
  rideTypeOption: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rideTypeOptionActive: {
    borderColor: Colors.light.brand.secondary,
    backgroundColor: Colors.light.brand.secondary + '10',
  },
  rideTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rideTypeLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: '#D1D5DB',
    marginLeft: Spacing.md,
  },
  rideTypeLabelActive: {
    color: 'white',
  },
  rideTypePrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.brand.secondary,
  },
  rideTypeDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
    marginLeft: 36,
  },
  buttonsContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
});
