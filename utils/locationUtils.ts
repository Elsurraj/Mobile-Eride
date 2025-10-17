import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationData extends LocationCoords {
  address?: string;
  accuracy?: number;
  timestamp?: number;
}

export class LocationService {
  private static watchId: Location.LocationSubscription | null = null;

  /**
   * Request location permissions explicitly.
   * This function now logs the permission status and handles different states.
   */
  static async requestLocationPermission(): Promise<boolean> {
    try {
      // Check if we're on a native platform (iOS/Android) vs web
      if (Platform.OS !== 'web') {
        console.log('LocationService: Requesting foreground location permission...');
        const { status: foregroundStatus, permissions } = await Location.requestForegroundPermissionsAsync();
        console.log('LocationService: Permission request result - Status:', foregroundStatus, 'Permissions:', permissions);

        if (foregroundStatus === 'granted') {
          console.log('LocationService: Permission granted.');
          return true;
        } else if (foregroundStatus === 'denied') {
          console.warn('LocationService: Permission denied by user.');
          Alert.alert(
            'Location Permission Denied',
            'This app needs location permission to find nearby drivers and track your ride. Please enable it in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Location.openSettings() }
            ]
          );
          return false;
        } else if (foregroundStatus === 'undetermined') {
          console.warn('LocationService: Permission status is undetermined.');
          return false;
        } else {
          console.warn('LocationService: Permission status is unknown or restricted:', foregroundStatus);
          Alert.alert(
            'Location Permission Required',
            'Location permission is required, but the status is unclear. Please check settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Location.openSettings() }
            ]
          );
          return false;
        }
      } else {
        // On web, permissions are usually handled by the browser prompt
        console.log('LocationService: Web platform - permission handled by browser.');
        return true;
      }
    } catch (error) {
      console.error('LocationService: Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current GPS location.
   * This function now prioritizes real GPS data and handles permission explicitly.
   */
  static async getCurrentLocation(): Promise<LocationData | null> {
    console.log('LocationService: Attempting to get current location...');
    try {
      // Step 1: Request permission first (only on native)
      if (Platform.OS !== 'web') {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
          console.warn('LocationService: Permission denied or not granted, cannot get location.');
          return null;
        }
      }

      console.log('LocationService: Permission check passed, attempting to get position...');
      // Step 2: Attempt to get the real location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeoutMs: 15000, // 15 seconds
        maximumAge: 10000, // Accept cached location up to 10 seconds old
      });

      console.log('LocationService: Successfully got real location:', location.coords);

      const result: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
      return result;

    } catch (error: any) {
      console.error('LocationService: Error getting current location via GPS:', error.message || error);

      // Check the specific error type
      if (error?.code === 'E_LOCATION_UNAUTHORIZED' || error?.message?.includes('Not authorized')) {
        console.warn('LocationService: LocationPermissionError occurred after permission check.', error);
        Alert.alert(
          'Location Access Denied',
          'The app has permission, but the system denied access. Please ensure Location Services are ON and the app has access.',
          [
            { text: 'OK' },
            { text: 'Open Settings', onPress: () => Location.openSettings() }
          ]
        );
        return null;
      } else if (error?.code === 'E_LOCATION_TIMEOUT' || error?.message?.includes('timeout')) {
        console.warn('LocationService: GPS timeout occurred.');
        Alert.alert('Location Error', 'Timed out waiting for location. Please try again.');
      } else if (error?.code === 'E_LOCATION_UNAVAILABLE' || error?.message?.includes('unavailable')) {
        console.warn('LocationService: Location services unavailable.');
        Alert.alert(
          'Location Error',
          'Location services are unavailable. Please check your device settings.'
        );
      } else {
        Alert.alert(
          'Location Error',
          `Failed to get location: ${error.message || 'Unknown error'}`
        );
      }

      console.warn('LocationService: Failed to get location, returning null.');
      return null;
    }
  }

  /**
   * Start watching location changes (primarily for driver during active ride).
   */
  static async startLocationWatch(
    callback: (location: LocationData) => void,
    options?: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    }
  ): Promise<boolean> {
    try {
      // Request permission first on native
      if (Platform.OS !== 'web') {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
          console.warn('LocationService: Permission denied for location watch.');
          return false;
        }
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 5000, // 5 seconds
          distanceInterval: options?.distanceInterval || 10, // 10 meters
        },
        (location) => {
          console.log('LocationService: New location from watch:', location.coords);
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          });
        }
      );
      console.log('LocationService: Started watching location.');
      return true;
    } catch (error) {
      console.error('LocationService: Error starting location watch:', error);
      return false;
    }
  }

  /**
   * Stop watching location changes
   */
  static stopLocationWatch(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    point1: LocationCoords,
    point2: LocationCoords
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // in kilometers
  }

  /**
   * Convert degrees to radians
   */
  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate estimated time of arrival (ETA) based on distance
   */
  static calculateETA(distanceKm: number, averageSpeedKmh: number = 30): number {
    // Return ETA in minutes
    return Math.round((distanceKm / averageSpeedKmh) * 60);
  }

  /**
   * Reverse geocoding (convert coordinates to address) using expo-location.
   */
  static async reverseGeocode(coords: LocationCoords): Promise<string> {
    try {
      console.log('LocationService: Attempting reverse geocode for:', coords);
      const result = await Location.reverseGeocodeAsync(coords);
      console.log('LocationService: Reverse geocode result:', result);

      if (result && result.length > 0) {
        const address = result[0];
        const readableAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.postalCode,
        ].filter(Boolean).join(', ');

        console.log('LocationService: Formatted address:', readableAddress);
        return readableAddress;
      } else {
        console.log('LocationService: No reverse geocode results found for coordinates.');
        return `${coords.latitude}, ${coords.longitude}`;
      }
    } catch (error) {
      console.error('LocationService: Reverse geocoding error:', error);
      return `${coords.latitude}, ${coords.longitude}`;
    }
  }

  /**
   * Search locations with autocomplete using expo-location geocoding.
   */
  static async searchLocations(query: string): Promise<LocationData[]> {
    try {
      console.log('LocationService: Attempting geocode search for query:', query);
      const results = await Location.geocodeAsync(query);
      console.log('LocationService: Geocode search results:', results);

      if (results && results.length > 0) {
        const locationDataResults: LocationData[] = results.map(location => ({
          latitude: location.latitude,
          longitude: location.longitude,
          address: [
            location.name,
            location.street,
            location.city,
            location.region,
            location.postalCode,
          ].filter(Boolean).join(', '),
        }));

        console.log('LocationService: Transformed search results:', locationDataResults);
        return locationDataResults;
      } else {
        console.log('LocationService: No geocode results found for query:', query);
        return [];
      }
    } catch (error) {
      console.error('LocationService: Location search error:', error);
      return [];
    }
  }

  /**
   * Generate route points between pickup and dropoff (mock for now, requires external service).
   */
  static async getRoutePoints(
    pickup: LocationCoords,
    dropoff: LocationCoords
  ): Promise<LocationCoords[]> {
    const steps = 10;
    const route: LocationCoords[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const factor = i / steps;
      route.push({
        latitude: pickup.latitude + (dropoff.latitude - pickup.latitude) * factor,
        longitude: pickup.longitude + (dropoff.longitude - pickup.longitude) * factor,
      });
    }
    
    return route;
  }
}

export default LocationService;