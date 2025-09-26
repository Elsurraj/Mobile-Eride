import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'expo-maps';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { LocationService, LocationData, LocationCoords } from '@/utils/locationUtils';

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
  const mapRef = useRef<MapView>(null);
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(initialPickup || null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(initialDropoff || null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('pickup');
  
  const [region, setRegion] = useState<Region>({
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
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
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        });
        
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
    } else {
      setDropoffLocation(location);
    }

    // Move map to selected location
    setRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.0122,
      longitudeDelta: 0.0121,
    });
  };

  // Handle map press for location selection
  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    
    try {
      const address = await LocationService.reverseGeocode(coordinate);
      const locationData: LocationData = {
        ...coordinate,
        address,
      };

      if (selectionMode === 'pickup') {
        setPickupLocation(locationData);
      } else {
        setDropoffLocation(locationData);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
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

    if (onLocationSelect) {
      onLocationSelect(pickupLocation, dropoffLocation);
    }

    router.back();
  };

  // Handle current location button press
  const handleCurrentLocationPress = () => {
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      });
    } else {
      loadCurrentLocation();
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
            pinColor="#3B82F6"
          />
        )}

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            description={pickupLocation.address}
            pinColor="#10B981"
          />
        )}

        {/* Dropoff Location Marker */}
        {dropoffLocation && (
          <Marker
            coordinate={dropoffLocation}
            title="Dropoff Location"
            description={dropoffLocation.address}
            pinColor="#EF4444"
          />
        )}
      </MapView>

      {/* Loading Overlay */}
      {isLoadingLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.brand.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Locations</Text>
        <TouchableOpacity style={styles.currentLocationButton} onPress={handleCurrentLocationPress}>
          <Ionicons name="locate" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.light.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search for ${selectionMode} location...`}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={Colors.light.brand.primary} />
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchResults}>
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `search-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSearchResultSelect(item)}
                >
                  <Ionicons name="location-outline" size={20} color={Colors.light.textSecondary} />
                  <Text style={styles.searchResultText}>{item.address}</Text>
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
            />
          </View>
        )}
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Selection Mode Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectionMode === 'pickup' && styles.activeTab]}
            onPress={() => setSelectionMode('pickup')}
          >
            <Ionicons
              name="radio-button-on"
              size={16}
              color={selectionMode === 'pickup' ? Colors.light.brand.primary : Colors.light.textSecondary}
            />
            <Text style={[styles.tabText, selectionMode === 'pickup' && styles.activeTabText]}>
              Pickup
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectionMode === 'dropoff' && styles.activeTab]}
            onPress={() => setSelectionMode('dropoff')}
          >
            <Ionicons
              name="flag"
              size={16}
              color={selectionMode === 'dropoff' ? Colors.light.brand.primary : Colors.light.textSecondary}
            />
            <Text style={[styles.tabText, selectionMode === 'dropoff' && styles.activeTabText]}>
              Dropoff
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Locations */}
        <View style={styles.locationsContainer}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.pickupDot]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {pickupLocation?.address || 'Tap on map or search to select pickup location'}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.dropoffDot]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Dropoff Location</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {dropoffLocation?.address || 'Tap on map or search to select dropoff location'}
              </Text>
            </View>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, (!pickupLocation || !dropoffLocation) && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!pickupLocation || !dropoffLocation}
        >
          <Text style={styles.confirmButtonText}>Confirm Locations</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 100,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  currentLocationButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    position: 'absolute',
    top: 120,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
  searchResults: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    maxHeight: 200,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchResultText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  activeTab: {
    backgroundColor: Colors.light.background,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: Colors.light.brand.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  locationsContainer: {
    marginBottom: Spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: Spacing.xs,
    marginRight: Spacing.md,
  },
  pickupDot: {
    backgroundColor: '#10B981',
  },
  dropoffDot: {
    backgroundColor: '#EF4444',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  locationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: Colors.light.brand.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.light.textLight,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});

export default MapScreen;
