import { BaseApiService, ApiResponse } from './api';
import { healthService } from './healthService';
import { 
  mockRides, 
  mockRideStats, 
  mockDriverRequests, 
  generateMockRide, 
  mockLocations
} from './mockData';

export interface Location {
  address: string;
  label?: string;
  latitude?: number;
  longitude?: number;
}

export interface Ride {
  id: string;
  type: 'ride' | 'delivery';
  from: Location;
  to: Location;
  customer_name: string;
  driver_name?: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  amount: number;
  formatted_amount: string;
  created_at: string;
  updated_at: string;
  eta?: number; // in minutes
  rating?: number;
  distance?: number; // in km
  duration?: number; // in minutes
}

export interface RideRequest {
  pickup_address: string;
  pickup_label?: string;
  pickup_coordinates?: {
    latitude: number;
    longitude: number;
  };
  dropoff_address: string;
  dropoff_label?: string;
  dropoff_coordinates?: {
    latitude: number;
    longitude: number;
  };
  ride_type: 'standard' | 'premium' | 'delivery';
  notes?: string;
}

export interface RideStats {
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  total_earnings: number;
  formatted_earnings: string;
  average_rating: number;
}

export interface DriverRequest {
  id: string;
  type: 'ride' | 'delivery';
  pickup: Location;
  dropoff: Location;
  customer_name: string;
  estimated_time: string;
  distance: number;
  amount: number;
  formatted_amount: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  total_rides: number;
  status: 'online' | 'offline' | 'busy';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
    color: string;
    type: 'sedan' | 'suv' | 'hatchback' | 'motorcycle' | 'bicycle';
  };
  created_at: string;
  updated_at: string;
}

export interface DriverMatchingResult {
  driver: Driver;
  distance_km: number;
  estimated_arrival_minutes: number;
  fare_estimate: number;
  formatted_fare: string;
}

export interface CancellationReason {
  id: string;
  label: string;
  category: 'rider' | 'driver' | 'system';
}

export interface CancellationPenalty {
  amount: number;
  formatted_amount: string;
  reason: string;
  waived: boolean;
}

export interface CancellationRequest {
  ride_id: string;
  cancelled_by: 'rider' | 'driver' | 'system';
  reason_id?: string;
  reason_text?: string;
  notes?: string;
}

export interface CancellationResult {
  ride: Ride;
  penalty?: CancellationPenalty;
  refund_amount?: number;
  formatted_refund?: string;
  replacement_driver?: DriverMatchingResult;
  cancellation_fee_waived?: boolean;
}

class RidesApiService extends BaseApiService {
  // Get user's rides (for riders, drivers, and couriers)

  //new method to get rides with optional status filter
  async getRideLocation(rideId: string): Promise<ApiResponse<{ driver_id: string; lat: number; lng: number; last_updated: string } | null>> {
    if (healthService.shouldUseMockMode()) {
      // You could add a mock implementation here if needed
      // For now, let's try the real API even in mock mode if it's just a fetch
      // Or return a mock response if necessary
      // const mockLocation = { driver_id: 'mock_driver', lat: 6.5244, lng: 3.3792, last_updated: new Date().toISOString() };
      // return { data: mockLocation, success: true, message: 'Mock location fetched' };
      // For now, proceed with the real API call attempt.
    }

    try {
      return await this.get(`/api/v1/tracking/${rideId}/location`); // Use the exact path from the docs
    } catch (error) {
      console.warn('⚠️ Rides Service: getRideLocation failed:', error);
      // Return null data on failure
      return {
        data: null,
        success: false,
        error: 'Failed to fetch driver location',
      };
    }
  }
  // end new
  async getRides(status?: 'active' | 'completed' | 'cancelled', page: number = 1, limit: number = 20): Promise<ApiResponse<Ride[]>> {
    if (healthService.shouldUseMockMode()) {
      return this.getMockRides(status, page, limit);
    }

    try {
      const statusQuery = status ? `&status=${status}` : '';
      const response = await this.get<Ride[]>(`/api/v1/rides?page=${page}&limit=${limit}${statusQuery}`);
      return response;
    } catch (error) {
      console.warn('⚠️ Rides Service: getRides failed, falling back to mock');
      return this.getMockRides(status, page, limit);
    }
  }

  // Get active rides only
  async getActiveRides(): Promise<ApiResponse<Ride[]>> {
    if (healthService.shouldUseMockMode()) {
      return this.getMockRides('active');
    }

    try {
      return await this.get<Ride[]>('/api/v1/rides/active');
    } catch (error) {
      console.warn('⚠️ Rides Service: getActiveRides failed, falling back to mock');
      return this.getMockRides('active');
    }
  }

  // Get completed rides
  async getCompletedRides(page: number = 1, limit: number = 20): Promise<ApiResponse<Ride[]>> {
    if (healthService.shouldUseMockMode()) {
      return this.getMockRides('completed', page, limit);
    }

    try {
      return await this.get<Ride[]>(`/api/v1/rides/completed?page=${page}&limit=${limit}`);
    } catch (error) {
      console.warn('⚠️ Rides Service: getCompletedRides failed, falling back to mock');
      return this.getMockRides('completed', page, limit);
    }
  }

  // Get cancelled rides
  async getCancelledRides(page: number = 1, limit: number = 20): Promise<ApiResponse<Ride[]>> {
    if (healthService.shouldUseMockMode()) {
      return this.getMockRides('cancelled', page, limit);
    }

    try {
      return await this.get<Ride[]>(`/api/v1/rides/cancelled?page=${page}&limit=${limit}`);
    } catch (error) {
      console.warn('⚠️ Rides Service: getCancelledRides failed, falling back to mock');
      return this.getMockRides('cancelled', page, limit);
    }
  }

  // Request a ride (for riders)
  async requestRide(data: RideRequest): Promise<ApiResponse<Ride>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockRequestRide(data);
    }

    try {
      return await this.post<Ride>('/api/v1/rides/request', data);
    } catch (error) {
      console.warn('⚠️ Rides Service: requestRide failed, falling back to mock');
      return this.mockRequestRide(data);
    }
  }

  // Get ride details by ID
  async getRideDetails(rideId: string): Promise<ApiResponse<Ride>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockGetRideDetails(rideId);
    }

    try {
      return await this.get<Ride>(`/api/v1/rides/${rideId}/status`);

    } catch (error) {
      console.warn('⚠️ Rides Service: getRideDetails failed, falling back to mock');
      return this.mockGetRideDetails(rideId);
    }
  }

  // Cancel a ride (legacy method - kept for compatibility)
  async cancelRide(rideId: string, reason?: string): Promise<ApiResponse<any>> {
    return this.post(`/api/v1/rides/${rideId}/cancel`, { reason });
  }

  // Enhanced cancellation methods
  
  // Cancel ride by rider
  async cancelRideByRider(rideId: string, reasonId?: string, notes?: string): Promise<ApiResponse<CancellationResult>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockCancelRideByRider(rideId, reasonId, notes);
    }

    try {
      const data: CancellationRequest = {
        ride_id: rideId,
        cancelled_by: 'rider',
        reason_id: reasonId,
        notes
      };
      return await this.post<CancellationResult>(`/api/v1/rides/${rideId}/cancel-by-rider`, data);
    } catch (error) {
      console.warn('⚠️ Rides Service: cancelRideByRider failed, falling back to mock');
      return this.mockCancelRideByRider(rideId, reasonId, notes);
    }
  }

  // Cancel ride by driver  
  async cancelRideByDriver(rideId: string, reasonId: string, notes?: string): Promise<ApiResponse<CancellationResult>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockCancelRideByDriver(rideId, reasonId, notes);
    }

    try {
      const data: CancellationRequest = {
        ride_id: rideId,
        cancelled_by: 'driver',
        reason_id: reasonId,
        notes
      };
      return await this.post<CancellationResult>(`/api/v1/rides/${rideId}/cancel-by-driver`, data);
    } catch (error) {
      console.warn('⚠️ Rides Service: cancelRideByDriver failed, falling back to mock');
      return this.mockCancelRideByDriver(rideId, reasonId, notes);
    }
  }

  // Get cancellation reasons
  async getCancellationReasons(category: 'rider' | 'driver'): Promise<ApiResponse<CancellationReason[]>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockGetCancellationReasons(category);
    }

    try {
      return await this.get<CancellationReason[]>(`/api/v1/rides/cancellation-reasons?category=${category}`);
    } catch (error) {
      console.warn('⚠️ Rides Service: getCancellationReasons failed, falling back to mock');
      return this.mockGetCancellationReasons(category);
    }
  }

  // Calculate cancellation penalty
  async calculateCancellationPenalty(rideId: string): Promise<ApiResponse<CancellationPenalty>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockCalculateCancellationPenalty(rideId);
    }

    try {
      return await this.get<CancellationPenalty>(`/api/v1/rides/${rideId}/cancellation-penalty`);
    } catch (error) {
      console.warn('⚠️ Rides Service: calculateCancellationPenalty failed, falling back to mock');
      return this.mockCalculateCancellationPenalty(rideId);
    }
  }

  // Rate a completed ride
  async rateRide(rideId: string, rating: number, comment?: string): Promise<ApiResponse<any>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockRateRide(rideId, rating, comment);
    }

    try {
      return await this.post(`/api/v1/rides/${rideId}/rate`, { rating, comment });
    } catch (error) {
      console.warn('⚠️ Rides Service: rateRide failed, falling back to mock');
      return this.mockRateRide(rideId, rating, comment);
    }
  }

  // Get ride statistics (for drivers and couriers)
  async getRideStats(): Promise<ApiResponse<RideStats>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockGetRideStats();
    }

    try {
      return await this.get<RideStats>('/api/v1/rides/stats');
    } catch (error) {
      console.warn('⚠️ Rides Service: getRideStats failed, falling back to mock');
      return this.mockGetRideStats();
    }
  }

  // Driver/Courier specific endpoints

  // Get pending ride requests (for drivers and couriers)
  async getPendingRequests(): Promise<ApiResponse<DriverRequest[]>> {
    return this.get<DriverRequest[]>('/api/v1/rides/requests/pending');
  }

  // Accept a ride request (for drivers and couriers)
  async acceptRequest(requestId: string): Promise<ApiResponse<Ride>> {
    return this.post<Ride>(`/api/v1/rides/requests/${requestId}/accept`);
  }

  // Decline a ride request (for drivers and couriers)
  async declineRequest(requestId: string, reason?: string): Promise<ApiResponse<any>> {
    return this.post(`/api/v1/rides/requests/${requestId}/decline`, { reason });
  }

  // Start a ride (for drivers and couriers)
  async startRide(rideId: string): Promise<ApiResponse<Ride>> {
    return this.post<Ride>(`/api/v1/rides/${rideId}/start`);
  }

  // Complete a ride (for drivers and couriers)
  async completeRide(rideId: string): Promise<ApiResponse<Ride>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockCompleteRide(rideId);
    }

    try {
      return await this.post<Ride>(`/api/v1/rides/${rideId}/complete`);
    } catch (error) {
      console.warn('⚠️ Rides Service: completeRide failed, falling back to mock');
      return this.mockCompleteRide(rideId);
    }
  }

  // Reset driver status after ride completion
  async resetDriverStatus(driverId: string): Promise<ApiResponse<any>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockResetDriverStatus(driverId);
    }

    try {
      return await this.post(`/api/v1/drivers/${driverId}/reset-status`);
    } catch (error) {
      console.warn('⚠️ Rides Service: resetDriverStatus failed, falling back to mock');
      return this.mockResetDriverStatus(driverId);
    }
  }

  // Update ride location (for drivers and couriers)
  async updateLocation(rideId: string, latitude: number, longitude: number): Promise<ApiResponse<any>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockUpdateLocation(rideId, latitude, longitude);
    }

    try {
      return await this.post(`/api/v1/tracking/${rideId}/update`, { latitude, longitude });
    } catch (error) {
      console.warn('⚠️ Rides Service: updateLocation failed, falling back to mock');
      return this.mockUpdateLocation(rideId, latitude, longitude);
    }
  }

  // Driver Management Methods

  // Get all available drivers near a location
  async getAvailableDrivers(latitude: number, longitude: number, radius_km: number = 10): Promise<ApiResponse<Driver[]>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockGetAvailableDrivers(latitude, longitude, radius_km);
    }

    try {
      return await this.get<Driver[]>(`/api/v1/drivers/available?lat=${latitude}&lng=${longitude}&radius=${radius_km}`);
    } catch (error) {
      console.warn('⚠️ Rides Service: getAvailableDrivers failed, falling back to mock');
      return this.mockGetAvailableDrivers(latitude, longitude, radius_km);
    }
  }

  // Find the best driver match for a ride request
  async findDriverMatch(rideRequest: RideRequest): Promise<ApiResponse<DriverMatchingResult>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockFindDriverMatch(rideRequest);
    }

    try {
      return await this.post<DriverMatchingResult>('/api/v1/rides/match-driver', rideRequest);
    } catch (error) {
      console.warn('⚠️ Rides Service: findDriverMatch failed, falling back to mock');
      return this.mockFindDriverMatch(rideRequest);
    }
  }

  // Update driver location (for drivers)
  async updateDriverLocation(latitude: number, longitude: number, status: 'online' | 'offline' | 'busy'): Promise<ApiResponse<any>> {
    if (healthService.shouldUseMockMode()) {
      return this.mockUpdateDriverLocation(latitude, longitude, status);
    }

    try {
      return await this.post('/api/v1/drivers/location', { latitude, longitude, status });
    } catch (error) {
      console.warn('⚠️ Rides Service: updateDriverLocation failed, falling back to mock');
      return this.mockUpdateDriverLocation(latitude, longitude, status);
    }
  }

  // Get driver profile
  async getDriverProfile(): Promise<ApiResponse<Driver>> {
    return this.get<Driver>('/api/v1/drivers/me');
  }

  // Mock implementations
  private async getMockRides(status?: 'active' | 'completed' | 'cancelled', page: number = 1, limit: number = 20): Promise<ApiResponse<Ride[]>> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    let filteredRides = [...mockRides];
    if (status) {
      filteredRides = mockRides.filter(ride => ride.status === status);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: filteredRides.slice(startIndex, endIndex),
      success: true,
      message: 'Mock rides loaded successfully'
    };
  }

  private async mockRequestRide(data: RideRequest): Promise<ApiResponse<Ride>> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const newRide: Ride = {
      id: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: data.ride_type === 'delivery' ? 'delivery' : 'ride',
      from: {
        address: data.pickup_address,
        label: data.pickup_label,
        latitude: data.pickup_coordinates?.latitude,
        longitude: data.pickup_coordinates?.longitude
      },
      to: {
        address: data.dropoff_address, 
        label: data.dropoff_label,
        latitude: data.dropoff_coordinates?.latitude,
        longitude: data.dropoff_coordinates?.longitude
      },
      customer_name: 'Current User',
      status: 'pending',
      amount: Math.round((Math.random() * 30 + 10) * 100) / 100,
      formatted_amount: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance: Math.round((Math.random() * 10 + 1) * 100) / 100,
      duration: Math.round(Math.random() * 20 + 5)
    };
    
    newRide.formatted_amount = `$${newRide.amount.toFixed(2)}`;
    newRide.eta = Math.round(newRide.duration! * 0.8);
    
    console.log('🚗 Mock Rides: Created new ride request:', newRide.id);
    
    return {
      data: newRide,
      success: true,
      message: 'Ride requested successfully (mock)'
    };
  }

  private async mockGetRideDetails(rideId: string): Promise<ApiResponse<Ride>> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    
    const ride = mockRides.find(r => r.id === rideId);
    if (!ride) {
      return {
        data: null,
        success: false,
        error: 'Ride not found'
      };
    }
    
    return {
      data: ride,
      success: true
    };
  }

  private async mockUpdateLocation(rideId: string, latitude: number, longitude: number): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    
    console.log(`📍 Mock Rides: Updated location for ride ${rideId}: ${latitude}, ${longitude}`);
    
    return {
      data: {
        message: 'Location updated successfully (mock)',
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      },
      success: true
    };
  }

  // Mock driver management implementations
  private async mockGetAvailableDrivers(latitude: number, longitude: number, radius_km: number): Promise<ApiResponse<Driver[]>> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const mockDrivers: Driver[] = [
      {
        id: 'driver_001',
        name: 'Ahmed Okonkwo',
        email: 'ahmed.driver@eride.com',
        phone: '+234-8012-345-678',
        rating: 4.8,
        total_rides: 245,
        status: 'online',
        location: {
          latitude: latitude + (Math.random() - 0.5) * 0.01,
          longitude: longitude + (Math.random() - 0.5) * 0.01,
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
      },
      {
        id: 'driver_002',
        name: 'Fatima Ibrahim',
        email: 'fatima.driver@eride.com',
        phone: '+234-8087-654-321',
        rating: 4.9,
        total_rides: 312,
        status: 'online',
        location: {
          latitude: latitude + (Math.random() - 0.5) * 0.02,
          longitude: longitude + (Math.random() - 0.5) * 0.02,
          accuracy: 8,
          timestamp: new Date().toISOString()
        },
        vehicle: {
          make: 'Honda',
          model: 'Accord',
          year: 2021,
          license_plate: 'LAG-456-DEF',
          color: 'Black',
          type: 'sedan'
        },
        created_at: '2023-02-20T14:30:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 'driver_003',
        name: 'Chinedu Okoro',
        email: 'chinedu.driver@eride.com',
        phone: '+234-8098-765-432',
        rating: 4.7,
        total_rides: 189,
        status: 'online',
        location: {
          latitude: latitude + (Math.random() - 0.5) * 0.015,
          longitude: longitude + (Math.random() - 0.5) * 0.015,
          accuracy: 12,
          timestamp: new Date().toISOString()
        },
        vehicle: {
          make: 'Hyundai',
          model: 'Elantra',
          year: 2019,
          license_plate: 'LAG-789-GHI',
          color: 'White',
          type: 'sedan'
        },
        created_at: '2023-03-10T09:15:00Z',
        updated_at: new Date().toISOString()
      }
    ];
    
    // Filter drivers within radius (simplified calculation)
    const availableDrivers = mockDrivers.filter(driver => {
      if (!driver.location) return false;
      const distance = this.calculateDistance(
        { latitude, longitude },
        { latitude: driver.location.latitude, longitude: driver.location.longitude }
      );
      return distance <= radius_km;
    });
    
    console.log(`🚗 Mock Rides: Found ${availableDrivers.length} drivers within ${radius_km}km`);
    
    return {
      data: availableDrivers,
      success: true,
      message: `Found ${availableDrivers.length} available drivers`
    };
  }

  private async mockFindDriverMatch(rideRequest: RideRequest): Promise<ApiResponse<DriverMatchingResult>> {
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate matching algorithm delay
    
    // Get pickup coordinates
    const pickupLat = rideRequest.pickup_coordinates?.latitude || 6.5244;
    const pickupLng = rideRequest.pickup_coordinates?.longitude || 3.3792;
    
    // Get available drivers
    const driversResponse = await this.mockGetAvailableDrivers(pickupLat, pickupLng, 10);
    
    if (!driversResponse.success || !driversResponse.data || driversResponse.data.length === 0) {
      return {
        data: null,
        success: false,
        error: 'No drivers available in your area'
      };
    }
    
    // Find the closest driver with best rating
    let bestMatch: DriverMatchingResult | null = null;
    let bestScore = 0;
    
    for (const driver of driversResponse.data) {
      if (!driver.location) continue;
      
      const distance = this.calculateDistance(
        { latitude: pickupLat, longitude: pickupLng },
        { latitude: driver.location.latitude, longitude: driver.location.longitude }
      );
      
      const estimatedArrival = Math.ceil(distance * 2); // 2 minutes per km (rough estimate)
      const baseFare = this.calculateBaseFare(rideRequest.ride_type, distance);
      
      // Scoring algorithm: prioritize close drivers with good ratings
      const distanceScore = Math.max(0, 10 - distance); // Closer is better
      const ratingScore = driver.rating; // Higher rating is better
      const totalScore = (distanceScore * 0.6) + (ratingScore * 0.4);
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = {
          driver,
          distance_km: Math.round(distance * 100) / 100,
          estimated_arrival_minutes: estimatedArrival,
          fare_estimate: baseFare,
          formatted_fare: `₦${baseFare.toFixed(2)}`
        };
      }
    }
    
    if (!bestMatch) {
      return {
        data: null,
        success: false,
        error: 'No suitable driver found'
      };
    }
    
    console.log(`🚗 Mock Rides: Matched with driver ${bestMatch.driver.name} (${bestMatch.distance_km}km away)`);
    
    return {
      data: bestMatch,
      success: true,
      message: 'Driver match found successfully'
    };
  }

  private async mockUpdateDriverLocation(latitude: number, longitude: number, status: string): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    
    console.log(`📍 Mock Rides: Updated driver location: ${latitude}, ${longitude}, status: ${status}`);
    
    return {
      data: {
        message: 'Driver location updated successfully (mock)',
        latitude,
        longitude,
        status,
        timestamp: new Date().toISOString()
      },
      success: true
    };
  }

  // Utility methods
  private calculateDistance(point1: { latitude: number, longitude: number }, point2: { latitude: number, longitude: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateBaseFare(rideType: string, distanceKm: number): number {
    let baseRate = 200; // Base fare in Naira
    let perKmRate = 80;  // Per km rate in Naira
    
    switch (rideType) {
      case 'premium':
        baseRate = 350;
        perKmRate = 120;
        break;
      case 'delivery':
        baseRate = 150;
        perKmRate = 60;
        break;
      default: // standard
        break;
    }
    
    return baseRate + (distanceKm * perKmRate);
  }

  // Mock cancellation implementations
  private async mockCancelRideByRider(rideId: string, reasonId?: string, notes?: string): Promise<ApiResponse<CancellationResult>> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    // Find the ride
    const ride = mockRides.find(r => r.id === rideId);
    if (!ride) {
      return {
        data: null,
        success: false,
        error: 'Ride not found'
      };
    }

    // Check if ride can be cancelled
    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return {
        data: null,
        success: false,
        error: 'Ride cannot be cancelled in current status'
      };
    }

    // Update ride status
    const cancelledRide: Ride = {
      ...ride,
      status: 'cancelled',
      updated_at: new Date().toISOString()
    };

    // Calculate penalty based on ride status and time elapsed
    const penalty = this.calculateMockCancellationPenalty(ride);
    
    console.log(`❌ Mock Rides: Rider cancelled ride ${rideId}, penalty: ₦${penalty.amount}`);
    
    const result: CancellationResult = {
      ride: cancelledRide,
      penalty: penalty.amount > 0 ? penalty : undefined,
      cancellation_fee_waived: penalty.waived
    };

    return {
      data: result,
      success: true,
      message: 'Ride cancelled successfully by rider'
    };
  }

  private async mockCancelRideByDriver(rideId: string, reasonId: string, notes?: string): Promise<ApiResponse<CancellationResult>> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay + reassignment time
    
    // Find the ride
    const ride = mockRides.find(r => r.id === rideId);
    if (!ride) {
      return {
        data: null,
        success: false,
        error: 'Ride not found'
      };
    }

    // Check if ride can be cancelled by driver
    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return {
        data: null,
        success: false,
        error: 'Ride cannot be cancelled in current status'
      };
    }

    // Update ride status temporarily
    const cancelledRide: Ride = {
      ...ride,
      status: 'pending', // Back to pending for reassignment
      driver_name: undefined, // Remove current driver
      updated_at: new Date().toISOString()
    };

    // Try to find replacement driver
    let replacementDriver: DriverMatchingResult | undefined;
    
    try {
      const rideRequest: RideRequest = {
        pickup_address: ride.from.address,
        pickup_coordinates: ride.from.latitude && ride.from.longitude ? 
          { latitude: ride.from.latitude, longitude: ride.from.longitude } : undefined,
        dropoff_address: ride.to.address,
        dropoff_coordinates: ride.to.latitude && ride.to.longitude ?
          { latitude: ride.to.latitude, longitude: ride.to.longitude } : undefined,
        ride_type: ride.type === 'delivery' ? 'delivery' : 'standard'
      };
      
      const matchResult = await this.mockFindDriverMatch(rideRequest);
      if (matchResult.success && matchResult.data) {
        replacementDriver = matchResult.data;
        cancelledRide.driver_name = replacementDriver.driver.name;
        cancelledRide.status = 'active'; // Reassigned
      }
    } catch (error) {
      console.warn('Could not find replacement driver:', error);
    }

    console.log(`🚫 Mock Rides: Driver cancelled ride ${rideId}, replacement found: ${!!replacementDriver}`);
    
    const result: CancellationResult = {
      ride: cancelledRide,
      replacement_driver: replacementDriver
    };

    return {
      data: result,
      success: true,
      message: replacementDriver 
        ? 'Ride cancelled by driver, replacement driver assigned'
        : 'Ride cancelled by driver, looking for replacement'
    };
  }

  private async mockGetCancellationReasons(category: 'rider' | 'driver'): Promise<ApiResponse<CancellationReason[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const riderReasons: CancellationReason[] = [
      { id: 'rider_change_mind', label: 'Changed my mind', category: 'rider' },
      { id: 'rider_wrong_location', label: 'Wrong pickup location', category: 'rider' },
      { id: 'rider_emergency', label: 'Emergency', category: 'rider' },
      { id: 'rider_driver_delay', label: 'Driver taking too long', category: 'rider' },
      { id: 'rider_price_concern', label: 'Price too high', category: 'rider' },
      { id: 'rider_other', label: 'Other', category: 'rider' }
    ];

    const driverReasons: CancellationReason[] = [
      { id: 'driver_traffic', label: 'Heavy traffic/road closure', category: 'driver' },
      { id: 'driver_emergency', label: 'Personal emergency', category: 'driver' },
      { id: 'driver_vehicle_issue', label: 'Vehicle breakdown', category: 'driver' },
      { id: 'driver_unsafe_area', label: 'Unsafe pickup location', category: 'driver' },
      { id: 'driver_customer_issue', label: 'Customer unreachable', category: 'driver' },
      { id: 'driver_other', label: 'Other', category: 'driver' }
    ];

    const reasons = category === 'rider' ? riderReasons : driverReasons;
    
    return {
      data: reasons,
      success: true,
      message: `${category} cancellation reasons loaded`
    };
  }

  private async mockCalculateCancellationPenalty(rideId: string): Promise<ApiResponse<CancellationPenalty>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const ride = mockRides.find(r => r.id === rideId);
    if (!ride) {
      return {
        data: null,
        success: false,
        error: 'Ride not found'
      };
    }

    const penalty = this.calculateMockCancellationPenalty(ride);
    
    return {
      data: penalty,
      success: true
    };
  }

  private calculateMockCancellationPenalty(ride: Ride): CancellationPenalty {
    // Calculate time since ride was created
    const createdTime = new Date(ride.created_at).getTime();
    const currentTime = new Date().getTime();
    const minutesElapsed = Math.floor((currentTime - createdTime) / (1000 * 60));

    let penaltyAmount = 0;
    let reason = '';
    let waived = false;

    if (minutesElapsed < 5) {
      // Free cancellation within first 5 minutes
      penaltyAmount = 0;
      reason = 'Free cancellation within 5 minutes';
      waived = true;
    } else if (minutesElapsed < 15) {
      // Small penalty between 5-15 minutes
      penaltyAmount = 50;
      reason = 'Early cancellation fee';
    } else {
      // Higher penalty after 15 minutes (driver likely en route)
      penaltyAmount = Math.min(150, ride.amount * 0.2); // Max 20% of ride fare or ₦150
      reason = 'Driver already en route cancellation fee';
    }

    return {
      amount: penaltyAmount,
      formatted_amount: `₦${penaltyAmount.toFixed(2)}`,
      reason,
      waived
    };
  }

  // Additional missing mock implementations
  private async mockRateRide(rideId: string, rating: number, comment?: string): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`⭐ Mock Rides: Rated ride ${rideId} with ${rating} stars: ${comment || 'No comment'}`);
    
    return {
      data: {
        message: 'Ride rated successfully (mock)',
        rideId,
        rating,
        comment
      },
      success: true
    };
  }

  private async mockCompleteRide(rideId: string): Promise<ApiResponse<Ride>> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const ride = mockRides.find(r => r.id === rideId);
    if (!ride) {
      return {
        data: null,
        success: false,
        error: 'Ride not found'
      };
    }

    const completedRide: Ride = {
      ...ride,
      status: 'completed',
      updated_at: new Date().toISOString()
    };

    console.log(`✅ Mock Rides: Completed ride ${rideId}`);
    
    return {
      data: completedRide,
      success: true,
      message: 'Ride completed successfully (mock)'
    };
  }

  private async mockResetDriverStatus(driverId: string): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`🚗 Mock Rides: Reset driver ${driverId} status to available`);
    
    return {
      data: {
        driverId,
        status: 'online',
        message: 'Driver status reset to available (mock)'
      },
      success: true
    };
  }

  private async mockGetRideStats(): Promise<ApiResponse<RideStats>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const stats: RideStats = {
      total_rides: 156,
      completed_rides: 142,
      cancelled_rides: 14,
      total_earnings: 89500,
      formatted_earnings: '₦89,500.00',
      average_rating: 4.7
    };
    
    return {
      data: stats,
      success: true,
      message: 'Mock ride statistics loaded'
    };
  }
}

class RidesServiceSingleton extends RidesApiService {
  private static instance: RidesServiceSingleton;

  static getInstance(): RidesServiceSingleton {
    if (!RidesServiceSingleton.instance) {
      RidesServiceSingleton.instance = new RidesServiceSingleton();
    }
    return RidesServiceSingleton.instance;
  }
}

export const ridesService = RidesServiceSingleton.getInstance();
