import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { LocationService, LocationData, LocationCoords } from '@/utils/locationUtils';
import { LinearGradient } from 'expo-linear-gradient';

interface MapScreenProps {
  onLocationSelect?: (pickup: LocationData, dropoff: LocationData) => void;
  initialPickup?: LocationData;
  initialDropoff?: LocationData;
}

type SelectionMode = 'pickup' | 'dropoff';

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC<MapScreenProps> = ({
  onLocationSelect,
  initialPickup,
  initialDropoff,
}) => {
  const router = useRouter();
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(initialPickup || null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(initialDropoff || null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('pickup');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Load user's current location on mount
  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        
        // Auto-set pickup to current location if not already set
        if (!pickupLocation) {
          const address = await LocationService.reverseGeocode(location);
          setPickupLocation({ ...location, address });
        }
      }
    } catch (error) {
      console.error('Error loading current location:', error);
      Alert.alert('Location Error', 'Could not get your current location. Please select manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle search input changes
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await LocationService.searchLocations(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = async (location: LocationData) => {
    setShowSearchResults(false);
    setSearchQuery('');
    
    if (selectionMode === 'pickup') {
      setPickupLocation(location);
      // Auto-switch to dropoff selection after pickup is selected
      if (!dropoffLocation) {
        setSelectionMode('dropoff');
      }
    } else {
      setDropoffLocation(location);
    }
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (!pickupLocation) {
      Alert.alert('Missing Pickup', 'Please select a pickup location');
      return;
    }

    if (!dropoffLocation) {
      Alert.alert('Missing Dropoff', 'Please select a dropoff location');
      return;
    }

    // Try callback first (if provided)
    if (onLocationSelect) {
      onLocationSelect(pickupLocation, dropoffLocation);
      router.back();
      return;
    }

    // Fallback: pass data via router params
    const pickupData = encodeURIComponent(JSON.stringify(pickupLocation));
    const dropoffData = encodeURIComponent(JSON.stringify(dropoffLocation));
    
    router.replace(`/(dashboard)/book-ride?pickup=${pickupData}&dropoff=${dropoffData}`);
  };

  // Handle current location button press
  const handleCurrentLocationPress = async () => {
    if (!currentLocation) {
      await loadCurrentLocation();
    }
    
    if (currentLocation) {
      const address = await LocationService.reverseGeocode(currentLocation);
      const locationData = { ...currentLocation, address };
      
      if (selectionMode === 'pickup') {
        setPickupLocation(locationData);
        if (!dropoffLocation) {
          setSelectionMode('dropoff');
        }
      } else {
        setDropoffLocation(locationData);
      }
    }
  };

  // Render search result item
  const renderSearchResult = ({ item }: { item: LocationData }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSearchResultSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color={Colors.light.brand.secondary} />
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultAddress}>{item.address}</Text>
        <Text style={styles.searchResultDistance}>
          {Math.round(item.latitude * 1000) / 1000}, {Math.round(item.longitude * 1000) / 1000}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.headerTitle}>Select Locations</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Web Map Placeholder */}
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapOverlay}>
              <Ionicons name="map-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.mapPlaceholderText}>
                Interactive Map
              </Text>
              <Text style={styles.mapPlaceholderSubtext}>
                Use search below to find locations
              </Text>
            </View>

            {/* Location Indicators on Map */}
            {pickupLocation && (
              <View style={styles.mapPickupIndicator}>
                <Ionicons name="location" size={24} color="#10B981" />
                <Text style={styles.mapIndicatorLabel}>Pickup</Text>
              </View>
            )}
            
            {dropoffLocation && (
              <View style={styles.mapDropoffIndicator}>
                <Ionicons name="location" size={24} color="#EF4444" />
                <Text style={styles.mapIndicatorLabel}>Dropoff</Text>
              </View>
            )}

            {/* Current Location Button */}
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleCurrentLocationPress}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={Colors.light.brand.secondary} />
              ) : (
                <Ionicons name="locate" size={24} color={Colors.light.brand.secondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Location Selection Panel */}
          <View style={styles.bottomPanel}>
            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectionMode === 'pickup' && styles.modeButtonActive
                ]}
                onPress={() => setSelectionMode('pickup')}
              >
                <View style={styles.modeButtonContent}>
                  <View style={[styles.modeDot, styles.pickupDot]} />
                  <Text style={[
                    styles.modeButtonText,
                    selectionMode === 'pickup' && styles.modeButtonTextActive
                  ]}>
                    Pickup Location
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectionMode === 'dropoff' && styles.modeButtonActive
                ]}
                onPress={() => setSelectionMode('dropoff')}
              >
                <View style={styles.modeButtonContent}>
                  <View style={[styles.modeDot, styles.dropoffDot]} />
                  <Text style={[
                    styles.modeButtonText,
                    selectionMode === 'dropoff' && styles.modeButtonTextActive
                  ]}>
                    Dropoff Location
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search for ${selectionMode} location...`}
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={false}
              />
              {isSearching && (
                <ActivityIndicator size="small" color={Colors.light.brand.secondary} />
              )}
            </View>

            {/* Selected Locations Display */}
            <View style={styles.selectedLocations}>
              {/* Pickup Display */}
              <View style={styles.locationDisplay}>
                <View style={styles.locationDisplayIcon}>
                  <View style={[styles.locationDot, styles.pickupDot]} />
                </View>
                <View style={styles.locationDisplayContent}>
                  <Text style={styles.locationDisplayLabel}>Pickup</Text>
                  <Text style={styles.locationDisplayAddress}>
                    {pickupLocation?.address || 'Select pickup location'}
                  </Text>
                </View>
                {pickupLocation && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
                )}
              </View>

              {/* Dropoff Display */}
              <View style={styles.locationDisplay}>
                <View style={styles.locationDisplayIcon}>
                  <View style={[styles.locationDot, styles.dropoffDot]} />
                </View>
                <View style={styles.locationDisplayContent}>
                  <Text style={styles.locationDisplayLabel}>Dropoff</Text>
                  <Text style={styles.locationDisplayAddress}>
                    {dropoffLocation?.address || 'Select dropoff location'}
                  </Text>
                </View>
                {dropoffLocation && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
                )}
              </View>
            </View>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
                  renderItem={renderSearchResult}
                  maxToRenderPerBatch={5}
                  initialNumToRender={5}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!pickupLocation || !dropoffLocation) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!pickupLocation || !dropoffLocation}
            >
              <Text style={styles.confirmButtonText}>
                Confirm Locations
              </Text>
              <Ionicons name="checkmark" size={20} color={Colors.light.brand.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
    fontWeight: Typography.fontWeight.semibold,
    color: 'white',
  },
  placeholder: {
    width: 32,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.md,
  },
  mapPlaceholderSubtext: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.4)',
    marginTop: Spacing.xs,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  mapPickupIndicator: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    alignItems: 'center',
  },
  mapDropoffIndicator: {
    position: 'absolute',
    bottom: '30%',
    right: '25%',
    alignItems: 'center',
  },
  mapIndicatorLabel: {
    fontSize: Typography.fontSize.xs,
    color: 'white',
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  bottomPanel: {
    backgroundColor: '#374151',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: height * 0.6,
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: '#4B5563',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: Colors.light.brand.secondary,
  },
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  pickupDot: {
    backgroundColor: '#10B981',
  },
  dropoffDot: {
    backgroundColor: '#EF4444',
  },
  modeButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#D1D5DB',
  },
  modeButtonTextActive: {
    color: Colors.light.brand.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B5563',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: 'white',
  },
  selectedLocations: {
    marginBottom: Spacing.lg,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  locationDisplayIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationDisplayContent: {
    flex: 1,
  },
  locationDisplayLabel: {
    fontSize: Typography.fontSize.sm,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  locationDisplayAddress: {
    fontSize: Typography.fontSize.base,
    color: 'white',
    fontWeight: Typography.fontWeight.medium,
  },
  searchResults: {
    backgroundColor: '#4B5563',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchResultContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  searchResultAddress: {
    fontSize: Typography.fontSize.base,
    color: 'white',
    marginBottom: 2,
  },
  searchResultDistance: {
    fontSize: Typography.fontSize.sm,
    color: '#9CA3AF',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.brand.primary,
  },
});

export default MapScreen;
