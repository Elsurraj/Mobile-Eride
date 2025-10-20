import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity, 
  StatusBar,
  Alert,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { LocationData } from '@/utils/locationUtils';

const { width, height } = Dimensions.get('window');

export default function BookRideScreen() {
  const { pickup, dropoff } = useLocalSearchParams<{ 
    pickup?: string;
    dropoff?: string;
  }>();
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [rideType, setRideType] = useState<'standard' | 'premium' | 'express'>('standard'); // ✅ Updated type
  const { user, isBackendHealthy } = useAuth();
  const router = useRouter();

  // Handle location data from map selection
  useEffect(() => {
    if (pickup) {
      try {
        const decodedPickup = decodeURIComponent(pickup);
        const pickupData: LocationData = JSON.parse(decodedPickup);
        setPickupLocation(pickupData);
      } catch (error) {
        console.error('Error parsing pickup location:', error);
      }
    }
    
    if (dropoff) {
      try {
        const decodedDropoff = decodeURIComponent(dropoff);
        const dropoffData: LocationData = JSON.parse(decodedDropoff);
        setDropoffLocation(dropoffData);
      } catch (error) {
        console.error('Error parsing dropoff location:', error);
      }
    }
  }, [pickup, dropoff]);

  // ✅ Updated ride types to match backend enum: 'standard' | 'premium' | 'express'
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
      key: 'express',   // ✅ Corrected from 'delivery' to 'express'
      label: 'Express', 
      description: 'Fastest rides with priority matching',
      icon: 'speedometer',
      price: '₦400-800'
    },
  ];

  const handleMapSelection = () => {
    router.push('/(dashboard)/map');
  };

  const handleManualLocationInput = (text: string, type: 'pickup' | 'dropoff') => {
    if (text.trim().length === 0) {
      if (type === 'pickup') {
        setPickupLocation(null);
      } else {
        setDropoffLocation(null);
      }
      return;
    }

    const mockLocation: LocationData = {
      address: text,
      latitude: 6.5244 + (Math.random() - 0.5) * 0.01,
      longitude: 3.3792 + (Math.random() - 0.5) * 0.01,
    };

    if (type === 'pickup') {
      setPickupLocation(mockLocation);
    } else {
      setDropoffLocation(mockLocation);
    }
  };

  const handleContinueToDriverSelection = () => {
    if (!pickupLocation) {
      Alert.alert('Error', 'Please select pickup location on the map');
      return;
    }
    if (!dropoffLocation) {
      Alert.alert('Error', 'Please select dropoff location on the map');
      return;
    }

    const pickupEncoded = encodeURIComponent(JSON.stringify(pickupLocation));
    const dropoffEncoded = encodeURIComponent(JSON.stringify(dropoffLocation));
    
    const params = [
      `pickup=${pickupEncoded}`,
      `dropoff=${dropoffEncoded}`,
      `rideType=${rideType}`
    ].join('&');

    router.push(`/(dashboard)/driver-selection?${params}`);
  };

  const canContinue = pickupLocation && dropoffLocation;

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
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.title}>Set Your Locations</Text>
              <Text style={styles.subtitle}>
                Use the map or enter addresses manually
              </Text>
              {!isBackendHealthy && (
                <Text style={styles.demoModeText}>
                  🔄 Demo Mode - Using simulated locations
                </Text>
              )}
            </View>
          </View>

          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.mapSection}>
                <TouchableOpacity 
                  style={styles.mapContainer}
                  onPress={handleMapSelection}
                  activeOpacity={0.8}
                >
                  <View style={styles.mapPlaceholder}>
                    <Ionicons name="map-outline" size={48} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.mapText}>Interactive Map</Text>
                    <Text style={styles.mapSubtext}>
                      Tap to select locations visually
                    </Text>
                    
                    {pickupLocation && (
                      <View style={styles.pickupIndicator}>
                        <Ionicons name="location" size={20} color="#10B981" />
                        <Text style={styles.indicatorLabel}>Pickup</Text>
                      </View>
                    )}
                    
                    {dropoffLocation && (
                      <View style={styles.dropoffIndicator}>
                        <Ionicons name="location" size={20} color="#EF4444" />
                        <Text style={styles.indicatorLabel}>Dropoff</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.mapSelectionButton}
                  onPress={handleMapSelection}
                >
                  <Ionicons name="map" size={20} color={Colors.light.brand.secondary} />
                  <Text style={styles.mapSelectionText}>Select on Map</Text>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.locationsForm}>
                <Text style={styles.sectionTitle}>Trip Locations</Text>
                
                <View style={styles.locationGroup}>
                  <View style={styles.locationIcon}>
                    <View style={styles.pickupDot} />
                  </View>
                  <View style={styles.locationInputs}>
                    <Text style={styles.inputLabel}>Pickup Location</Text>
                    <TextInput
                      style={[styles.textInput, pickupLocation && styles.textInputFilled]}
                      value={pickupLocation?.address || ''}
                      onChangeText={(text) => handleManualLocationInput(text, 'pickup')}
                      placeholder="Enter pickup address or search location"
                      placeholderTextColor="#6B7280"
                      multiline={false}
                    />
                    {pickupLocation && (
                      <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={() => setPickupLocation(null)}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.connectionLine} />

                <View style={styles.locationGroup}>
                  <View style={styles.locationIcon}>
                    <View style={styles.dropoffDot} />
                  </View>
                  <View style={styles.locationInputs}>
                    <Text style={styles.inputLabel}>Dropoff Location</Text>
                    <TextInput
                      style={[styles.textInput, dropoffLocation && styles.textInputFilled]}
                      value={dropoffLocation?.address || ''}
                      onChangeText={(text) => handleManualLocationInput(text, 'dropoff')}
                      placeholder="Enter destination address or search location"
                      placeholderTextColor="#6B7280"
                      multiline={false}
                    />
                    {dropoffLocation && (
                      <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={() => setDropoffLocation(null)}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {(pickupLocation || dropoffLocation) && (
                  <View style={styles.locationStatus}>
                    <Ionicons 
                      name={pickupLocation && dropoffLocation ? "checkmark-circle" : "information-circle"} 
                      size={16} 
                      color={pickupLocation && dropoffLocation ? "#10B981" : Colors.light.brand.secondary} 
                    />
                    <Text style={styles.locationStatusText}>
                      {pickupLocation && dropoffLocation 
                        ? 'Both locations set - ready to find drivers'
                        : pickupLocation 
                        ? 'Pickup location set - now set dropoff location'
                        : 'Dropoff location set - now set pickup location'
                      }
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.rideTypeSection}>
                <Text style={styles.sectionTitle}>Choose Ride Type</Text>
                <View style={styles.rideTypesContainer}>
                  {rideTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.rideTypeOption,
                        rideType === type.key && styles.rideTypeOptionActive
                      ]}
                      onPress={() => setRideType(type.key as any)}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={20} 
                        color={rideType === type.key ? Colors.light.brand.secondary : '#6B7280'} 
                      />
                      <Text style={[
                        styles.rideTypeLabel,
                        rideType === type.key && styles.rideTypeLabelActive
                      ]}>
                        {type.label}
                      </Text>
                      <Text style={styles.rideTypePrice}>{type.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
                  onPress={handleContinueToDriverSelection}
                  disabled={!canContinue}
                >
                  <Text style={[styles.primaryButtonText, !canContinue && styles.primaryButtonTextDisabled]}>
                    Find Available Drivers
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color={canContinue ? Colors.light.brand.secondary : '#6B7280'} 
                  />
                </TouchableOpacity>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
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
    marginBottom: Spacing.xs,
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
  mapSection: {
    margin: Spacing.lg,
  },
  mapContainer: {
    height: 200,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  mapSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
  locationsForm: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
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
  locationInputs: {
    flex: 1,
    position: 'relative',
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
  textInputFilled: {
    borderColor: Colors.light.brand.secondary,
    backgroundColor: Colors.light.brand.secondary + '10',
  },
  clearButton: {
    position: 'absolute',
    right: Spacing.md,
    top: 32,
    padding: Spacing.xs,
  },
  connectionLine: {
    width: 2,
    height: 20,
    backgroundColor: '#4B5563',
    marginLeft: 14,
    marginBottom: Spacing.md,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  locationStatusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: '#D1D5DB',
    marginLeft: Spacing.xs,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  mapSubtext: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  pickupIndicator: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    alignItems: 'center',
  },
  dropoffIndicator: {
    position: 'absolute',
    bottom: '25%',
    right: '20%',
    alignItems: 'center',
  },
  indicatorLabel: {
    fontSize: Typography.fontSize.xs,
    color: 'white',
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  rideTypeSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    marginBottom: Spacing.md,
  },
  rideTypesContainer: {
    gap: Spacing.sm,
  },
  rideTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rideTypeOptionActive: {
    borderColor: Colors.light.brand.secondary,
    backgroundColor: Colors.light.brand.secondary + '20',
  },
  rideTypeLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: '#D1D5DB',
    marginLeft: Spacing.md,
  },
  rideTypeLabelActive: {
    color: 'white',
    fontFamily: Typography.fontFamily.bold,
  },
  rideTypePrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.light.brand.secondary,
  },
  buttonsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonDisabled: {
    backgroundColor: '#374151',
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  primaryButtonTextDisabled: {
    color: '#6B7280',
  },
});