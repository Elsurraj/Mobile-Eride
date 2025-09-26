import * as Location from 'expo-location';
import { Alert } from 'react-native';

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
   * Request location permissions
   */
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permission to use ride booking features.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current GPS location
   */
  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeoutMs: 10000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      // Return mock location for development
      return {
        latitude: 6.5244, // Lagos, Nigeria
        longitude: 3.3792,
        accuracy: 10,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Start watching location changes
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
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) return false;

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 5000, // 5 seconds
          distanceInterval: options?.distanceInterval || 10, // 10 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          });
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location watch:', error);
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
   * Mock reverse geocoding (convert coordinates to address)
   */
  static async reverseGeocode(coords: LocationCoords): Promise<string> {
    try {
      // In production, use Location.reverseGeocodeAsync
      const result = await Location.reverseGeocodeAsync(coords);
      if (result && result.length > 0) {
        const address = result[0];
        return `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }

    // Fallback to mock address based on coordinates
    return this.getMockAddress(coords);
  }

  /**
   * Get mock address for development
   */
  private static getMockAddress(coords: LocationCoords): string {
    const mockAddresses = [
      'Victoria Island, Lagos',
      'Ikoyi, Lagos',
      'Lekki Phase 1, Lagos',
      'Surulere, Lagos',
      'Ikeja, Lagos',
      'Maryland, Lagos',
      'Ajah, Lagos',
      'Banana Island, Lagos',
    ];

    // Use coordinates to generate consistent mock address
    const index = Math.floor((coords.latitude + coords.longitude) * 1000) % mockAddresses.length;
    return mockAddresses[index];
  }

  /**
   * Search locations with autocomplete (mock implementation)
   */
  static async searchLocations(query: string): Promise<LocationData[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!query || query.length < 2) return [];

      // Mock locations in Lagos
      const mockLocations: LocationData[] = [
        { latitude: 6.4581, longitude: 3.3947, address: 'Victoria Island, Lagos' },
        { latitude: 6.4698, longitude: 3.3987, address: 'Ikoyi, Lagos' },
        { latitude: 6.4474, longitude: 3.4739, address: 'Lekki Phase 1, Lagos' },
        { latitude: 6.5017, longitude: 3.3616, address: 'Surulere, Lagos' },
        { latitude: 6.6026, longitude: 3.3564, address: 'Ikeja, Lagos' },
        { latitude: 6.5568, longitude: 3.3517, address: 'Maryland, Lagos' },
        { latitude: 6.4652, longitude: 3.5510, address: 'Ajah, Lagos' },
        { latitude: 6.4441, longitude: 3.4204, address: 'Banana Island, Lagos' },
        { latitude: 6.5244, longitude: 3.3792, address: 'Lagos Mall, Lagos' },
        { latitude: 6.5955, longitude: 3.3087, address: 'Murtala Muhammed Airport' },
      ];

      // Filter locations based on query
      return mockLocations.filter(location =>
        location.address!.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  }

  /**
   * Generate route points between pickup and dropoff (mock)
   */
  static async getRoutePoints(
    pickup: LocationCoords,
    dropoff: LocationCoords
  ): Promise<LocationCoords[]> {
    // Simple linear interpolation for mock route
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
