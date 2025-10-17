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
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
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
  const mapRef = useRef<MapView>(null);
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(initialPickup || null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(initialDropoff || null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('pickup');
  const [routeCoordinates, setRouteCoordinates] = useState<LocationCoords[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Default region (Lagos, Nigeria)
  const defaultRegion = {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Load user's current location on mount
  useEffect(() => {
    loadCurrentLocation();
  }, []);

  // Update route when both locations are selected
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      generateRoute();
    } else {
      setRouteCoordinates([]);
    }
  }, [pickupLocation, dropoffLocation]);

  // Fit map to show both markers when locations change
  useEffect(() => {
    if (mapReady && mapRef.current) {
      fitMapToMarkers();
    }
  }, [pickupLocation, dropoffLocation, mapReady]);

  const loadCurrentLocation = async () => {
    setLocationError(null);
    setIsLoadingLocation(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        console.log('MapScreen: Got current location:', location);
        setCurrentLocation(location);

        // Auto-set pickup to current location if not already set
        if (!pickupLocation) {
          const address = await LocationService.reverseGeocode(location);
          const locationWithAddress = { ...location, address };
          setPickupLocation(locationWithAddress);
          console.log('MapScreen: Set initial pickup location to current location with address.');
          
          // Animate map to current location
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }
      } else {
        console.warn('MapScreen: LocationService returned null.');
        setLocationError('Failed to get your current location. Please check permissions or use search.');
      }
    } catch (error) {
      console.error('MapScreen: Error in loadCurrentLocation:', error);
      setLocationError('An unexpected error occurred while getting your location.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const generateRoute = async () => {
    if (!pickupLocation || !dropoffLocation) return;
    
    try {
      const route = await LocationService.getRoutePoints(pickupLocation, dropoffLocation);
      setRouteCoordinates(route);
    } catch (error) {
      console.error('Error generating route:', error);
    }
  };

  const fitMapToMarkers = () => {
    if (!mapRef.current) return;

    const markers = [pickupLocation, dropoffLocation].filter(Boolean) as LocationData[];
    
    if (markers.length === 0) return;

    if (markers.length === 1) {
      // If only one marker, center on it
      mapRef.current.animateToRegion({
        latitude: markers[0].latitude,
        longitude: markers[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    } else {
      // If multiple markers, fit to show all
      mapRef.current.fitToCoordinates(
        markers.map(m => ({ latitude: m.latitude, longitude: m.longitude })),
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    
    // Get address for the selected coordinate
    const address = await LocationService.reverseGeocode(coordinate);
    const locationData: LocationData = {
      ...coordinate,
      address,
    };

    if (selectionMode === 'pickup') {
      setPickupLocation(locationData);
      if (!dropoffLocation) {
        setSelectionMode('dropoff');
      }
    } else {
      setDropoffLocation(locationData);
    }
  };

  // Handle search input changes
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLocationError(null);

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
      setLocationError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = async (location: LocationData) => {
    setShowSearchResults(false);
    setSearchQuery('');
    setLocationError(null);

    if (selectionMode === 'pickup') {
      setPickupLocation(location);
      if (!dropoffLocation) {
        setSelectionMode('dropoff');
      }
    } else {
      setDropoffLocation(location);
    }

    // Animate map to selected location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
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
      router.back();
      return;
    }

    const pickupData = encodeURIComponent(JSON.stringify(pickupLocation));
    const dropoffData = encodeURIComponent(JSON.stringify(dropoffLocation));
    
    router.replace(`/(dashboard)/book-ride?pickup=${pickupData}&dropoff=${dropoffData}`);
  };

  const handleCurrentLocationPress = async () => {
    setLocationError(null);
    await loadCurrentLocation();
  };

  // Render search result item
  const renderSearchResult = ({ item }: { item: LocationData }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSearchResultSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color={Colors.light.brand.secondary} />
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultAddress}>{item.address || `${item.latitude}, ${item.longitude}`}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        {/* Map View with OpenStreetMap tiles */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={defaultRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onPress={handleMapPress}
          onMapReady={() => setMapReady(true)}
          mapType="none"
        >
          {/* OpenStreetMap Dark Tiles */}
          <UrlTile
            urlTemplate="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            maximumZ={19}
            flipY={false}
          />

          {/* Pickup Marker */}
          {pickupLocation && (
            <Marker
              coordinate={{
                latitude: pickupLocation.latitude,
                longitude: pickupLocation.longitude,
              }}
              title="Pickup"
              description={pickupLocation.address}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.marker, styles.pickupMarker]}>
                  <Ionicons name="location" size={24} color="white" />
                </View>
                <Text style={styles.markerLabel}>Pickup</Text>
              </View>
            </Marker>
          )}

          {/* Dropoff Marker */}
          {dropoffLocation && (
            <Marker
              coordinate={{
                latitude: dropoffLocation.latitude,
                longitude: dropoffLocation.longitude,
              }}
              title="Dropoff"
              description={dropoffLocation.address}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.marker, styles.dropoffMarker]}>
                  <Ionicons name="location" size={24} color="white" />
                </View>
                <Text style={styles.markerLabel}>Dropoff</Text>
              </View>
            </Marker>
          )}

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={Colors.light.brand.secondary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Header Overlay */}
        <SafeAreaView style={styles.headerOverlay}>
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
        </SafeAreaView>

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

        {/* Error Banner */}
        {locationError && (
          <View style={styles.locationErrorBanner}>
            <Text style={styles.locationErrorText}>{locationError}</Text>
          </View>
        )}

        {/* Bottom Panel */}
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
                  Pickup
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
                  Dropoff
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${selectionMode} location...`}
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
                <Text style={styles.locationDisplayAddress} numberOfLines={1}>
                  {pickupLocation?.address || (pickupLocation ? `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}` : 'Tap map or search')}
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
                <Text style={styles.locationDisplayAddress} numberOfLines={1}>
                  {dropoffLocation?.address || (dropoffLocation ? `${dropoffLocation.latitude.toFixed(4)}, ${dropoffLocation.longitude.toFixed(4)}` : 'Tap map or search')}
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
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  pickupMarker: {
    backgroundColor: '#10B981',
  },
  dropoffMarker: {
    backgroundColor: '#EF4444',
  },
  markerLabel: {
    fontSize: Typography.fontSize.xs,
    color: 'white',
    marginTop: 4,
    fontWeight: Typography.fontWeight.bold,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentLocationButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(55, 65, 81, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  locationErrorBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 180 : 160,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#EF4444',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    ...Shadows.lg,
  },
  locationErrorText: {
    fontSize: Typography.fontSize.sm,
    color: 'white',
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(55, 65, 81, 0.95)',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: height * 0.5,
    ...Shadows.xl,
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: '#4B5563',
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
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
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.md,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  locationDisplayIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.sm,
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
    fontSize: Typography.fontSize.xs,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  locationDisplayAddress: {
    fontSize: Typography.fontSize.sm,
    color: 'white',
    fontWeight: Typography.fontWeight.medium,
  },
  searchResults: {
    backgroundColor: '#4B5563',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    maxHeight: 150,
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
    fontSize: Typography.fontSize.sm,
    color: 'white',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.brand.primary,
  },
});

export default MapScreen;