import { healthService } from './healthService';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';

// Socket.IO types - basic interface definitions
interface Socket {
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback?: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  disconnect(): void;
  connected: boolean;
}

interface SocketConstructor {
  new (url: string, options?: any): Socket;
}

// Declare Socket.IO as potentially available
declare global {
  interface Window {
    io?: SocketConstructor;
  }
}

interface RideStatusUpdate {
  rideId: string;
  status: 'requested' | 'accepted' | 'rejected' | 'no_drivers' | 'cancelled' | 'completed' | 'error';
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    vehicle: {
      make: string;
      model: string;
      licensePlate: string;
      color: string;
    };
  };
  message?: string;
}

interface LocationUpdate {
  rideId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  eta?: number;
  distance?: number;
  timestamp: string;
}

interface DriverAssigned {
  rideId: string;
  driver: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    latitude: number;
    longitude: number;
    vehicle: {
      make: string;
      model: string;
      licensePlate: string;
      color: string;
    };
  };
  estimatedArrival: string;
}

interface RideCancellation {
  rideId: string;
  cancelled_by: 'rider' | 'driver' | 'system';
  reason?: string;
  penalty?: {
    amount: number;
    formatted_amount: string;
  };
  replacement_driver?: {
    id: string;
    name: string;
    eta: number;
  };
  timestamp: string;
}

interface AssignmentTimeout {
  rideId: string;
  message: string;
}

interface SocketEventHandlers {
  onStatusUpdate?: (data: RideStatusUpdate) => void;
  onLocationUpdate?: (data: LocationUpdate) => void;
  onDriverAssigned?: (data: DriverAssigned) => void;
  onRideCancelled?: (data: RideCancellation) => void;
  onAssignmentTimeout?: (data: AssignmentTimeout) => void; // NEW
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onError?: (error: any) => void;
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private handlers: SocketEventHandlers = {};
  private mockMode = true;
  private mockIntervals: { [key: string]: NodeJS.Timeout } = {};
  private isConnecting = false;

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Initialize socket connection
   */
  async initialize(handlers: SocketEventHandlers): Promise<boolean> {
    this.handlers = handlers;
    
    if (healthService.shouldUseMockMode()) {
      console.log('🔌 Socket Service: Using mock mode');
      this.mockMode = true;
      return true;
    }

    return this.connectRealSocket();
  }

  /**
   * Connect to real Socket.IO server
   */
  private async connectRealSocket(): Promise<boolean> {
    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;
    
    try {
      if (typeof window !== 'undefined' && window.io) {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
        const token = await enhancedTokenManager.getToken();
        
        console.log('🔌 Socket Service: Connecting to real Socket.IO server');
        
        this.socket = new window.io(baseUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling']
        });

        this.setupRealSocketHandlers();
        this.mockMode = false;
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ Socket Service: Connection timeout, falling back to mock');
            this.fallbackToMock();
            resolve(true);
          }, 5000);

          this.socket!.on('connect', () => {
            clearTimeout(timeout);
            console.log('✅ Socket Service: Connected to real server');
            this.isConnecting = false;
            resolve(true);
          });

          this.socket!.on('connect_error', (error) => {
            clearTimeout(timeout);
            console.warn('⚠️ Socket Service: Connection failed, using mock mode', error);
            this.fallbackToMock();
            resolve(true);
          });
        });
      } else {
        console.warn('⚠️ Socket Service: Socket.IO not available, using mock mode');
        this.fallbackToMock();
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Socket Service: Failed to connect, using mock mode', error);
      this.fallbackToMock();
      return true;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Setup real socket event handlers
   */
  private setupRealSocketHandlers(): void {
    if (!this.socket) return;

    // Driver receives ride assignment
    this.socket.on('driver:ride_assigned', (data: DriverAssigned) => {
      console.log('👤 Socket Service: Driver assigned', data);
      this.handlers.onDriverAssigned?.(data);
    });

    // Driver assignment timeout (no response)
    this.socket.on('driver:assignment_timeout', (data: AssignmentTimeout) => {
      console.log('⏰ Socket Service: Assignment timeout', data);
      this.handlers.onAssignmentTimeout?.(data);
    });

    // General ride status updates (for rider or driver after assignment)
    this.socket.on('ride:status_update', (data: RideStatusUpdate) => {
      console.log('📡 Socket Service: Received status update', data);
      this.handlers.onStatusUpdate?.(data);
    });

    // Location updates during active ride
    this.socket.on('ride:location_update', (data: LocationUpdate) => {
      console.log('📍 Socket Service: Received location update', data);
      this.handlers.onLocationUpdate?.(data);
    });

    // Cancellation events
    this.socket.on('ride:cancelled', (data: RideCancellation) => {
      console.log('❌ Socket Service: Ride cancelled', data);
      this.handlers.onRideCancelled?.(data);
    });

    // Connection lifecycle
    this.socket.on('disconnect', () => {
      console.log('🔌 Socket Service: Disconnected');
      this.handlers.onDisconnect?.();
    });

    this.socket.on('reconnect', () => {
      console.log('🔌 Socket Service: Reconnected');
      this.handlers.onReconnect?.();
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket Service: Error', error);
      this.handlers.onError?.(error);
    });
  }

  /**
   * Fallback to mock mode
   */
  private fallbackToMock(): void {
    this.mockMode = true;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    console.log('🎭 Socket Service: Switched to mock mode');
  }

  /**
   * Subscribe to ride updates (passive — no emit needed)
   * Backend automatically adds you to ride:{id} room after accept
   */
  subscribeToRide(rideId: string): void {
    if (this.mockMode) {
      this.startMockRideUpdates(rideId);
    }
    // DO NOT emit 'join_ride_room' — backend handles ride room membership
    console.log(`🔔 Socket Service: Listening for updates on ride ${rideId} (no manual join)`);
  }

  /**
   * Unsubscribe from ride updates
   */
  unsubscribeFromRide(rideId: string): void {
    if (this.mockMode) {
      this.stopMockRideUpdates(rideId);
    }
    console.log(`🔕 Socket Service: Stopped listening to ride ${rideId}`);
  }

  // --- Mock methods (unchanged) ---
  private startMockRideUpdates(rideId: string): void {
    console.log(`🎭 Socket Service: Starting mock updates for ride ${rideId}`);

    this.stopMockRideUpdates(rideId);

    setTimeout(() => {
      const mockDriver = {
        id: 'driver_mock_001',
        name: 'John Driver',
        phone: '+1234567890',
        rating: 4.8,
        latitude: 40.7580,
        longitude: -73.9855,
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          licensePlate: 'ABC-1234',
          color: 'Silver'
        }
      };

      this.handlers.onDriverAssigned?.({
        rideId,
        driver: mockDriver,
        estimatedArrival: '5 minutes'
      });

      this.handlers.onStatusUpdate?.({
        rideId,
        status: 'accepted',
        driver: {
          id: mockDriver.id,
          name: mockDriver.name,
          phone: mockDriver.phone,
          rating: mockDriver.rating,
          vehicle: mockDriver.vehicle
        },
        message: 'Driver has accepted your ride'
      });

      this.mockIntervals[`location_${rideId}`] = setInterval(() => {
        const lat = 40.7580 + (Math.random() - 0.5) * 0.001;
        const lng = -73.9855 + (Math.random() - 0.5) * 0.001;

        this.handlers.onLocationUpdate?.({
          rideId,
          driverId: mockDriver.id,
          latitude: lat,
          longitude: lng,
          heading: Math.random() * 360,
          eta: Math.floor(Math.random() * 8) + 2,
          distance: Math.random() * 2 + 0.5,
          timestamp: new Date().toISOString()
        });
      }, 3000);
    }, 3000);
  }

  private stopMockRideUpdates(rideId: string): void {
    const locationKey = `location_${rideId}`;
    if (this.mockIntervals[locationKey]) {
      clearInterval(this.mockIntervals[locationKey]);
      delete this.mockIntervals[locationKey];
      console.log(`🎭 Socket Service: Stopped mock updates for ride ${rideId}`);
    }
  }

  simulateDriverDisconnect(rideId: string): void {
    this.handlers.onStatusUpdate?.({
      rideId,
      status: 'error',
      message: 'Driver disconnected. Looking for another driver...'
    });
  }

  simulateNoDrivers(rideId: string): void {
    setTimeout(() => {
      this.handlers.onStatusUpdate?.({
        rideId,
        status: 'no_drivers',
        message: 'No drivers available in your area. Please try again later.'
      });
    }, 5000);
  }

  simulateRideComplete(rideId: string): void {
    this.stopMockRideUpdates(rideId);
    this.handlers.onStatusUpdate?.({
      rideId,
      status: 'completed',
      message: 'Ride completed successfully!'
    });
  }

  simulateRiderCancellation(rideId: string, penalty?: number): void {
    this.stopMockRideUpdates(rideId);
    const cancellationData: RideCancellation = {
      rideId,
      cancelled_by: 'rider',
      reason: 'Changed plans',
      penalty: penalty ? { amount: penalty, formatted_amount: `₦${penalty.toFixed(2)}` } : undefined,
      timestamp: new Date().toISOString()
    };
    this.handlers.onRideCancelled?.(cancellationData);
    this.handlers.onStatusUpdate?.({
      rideId,
      status: 'cancelled',
      message: 'You cancelled this ride'
    });
  }

  simulateDriverCancellation(rideId: string, withReplacement: boolean = true): void {
    this.stopMockRideUpdates(rideId);
    const cancellationData: RideCancellation = {
      rideId,
      cancelled_by: 'driver',
      reason: 'Traffic emergency',
      replacement_driver: withReplacement ? { id: 'replacement_driver_001', name: 'Sarah Wilson', eta: 8 } : undefined,
      timestamp: new Date().toISOString()
    };
    this.handlers.onRideCancelled?.(cancellationData);
    if (withReplacement) {
      setTimeout(() => {
        this.handlers.onStatusUpdate?.({
          rideId,
          status: 'accepted',
          driver: {
            id: 'replacement_driver_001',
            name: 'Sarah Wilson',
            phone: '+234-8099-887-776',
            rating: 4.9,
            vehicle: {
              make: 'Honda',
              model: 'Civic',
              licensePlate: 'LAG-998-XYZ',
              color: 'Blue'
            }
          },
          message: 'New driver assigned after previous cancellation'
        });
      }, 2000);
    } else {
      this.handlers.onStatusUpdate?.({
        rideId,
        status: 'no_drivers',
        message: 'No replacement driver found. Please try again.'
      });
    }
  }

  /**
   * After login + OTP verification, join personal room
   */
  joinPersonalRoom(userId: string, role: 'rider' | 'driver'): void {
    if (!this.mockMode && this.socket?.connected) {
      this.socket.emit('join_room', {
        user_id: userId,
        role,
        timestamp: new Date().toISOString()
      });
      console.log(`🏠 Socket Service: Joined personal room ${role}:${userId}`);
    }
  }

  isConnected(): boolean {
    return this.mockMode || (this.socket?.connected || false);
  }

  disconnect(): void {
    Object.keys(this.mockIntervals).forEach(key => {
      clearInterval(this.mockIntervals[key]);
    });
    this.mockIntervals = {};

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    console.log('🔌 Socket Service: Disconnected and cleaned up');
  }
}

export const socketService = SocketService.getInstance();
export type {
  RideStatusUpdate,
  LocationUpdate,
  DriverAssigned,
  RideCancellation,
  AssignmentTimeout,
  SocketEventHandlers
};