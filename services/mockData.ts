import { Ride, RideStats, DriverRequest, Location } from './ridesService';
import { WalletBalance, Transaction, WalletData } from './walletService';

// Mock locations
export const mockLocations: Location[] = [
  {
    address: "123 Main Street, Downtown",
    label: "Home",
    latitude: 40.7128,
    longitude: -74.0060
  },
  {
    address: "456 Business Ave, Financial District", 
    label: "Office",
    latitude: 40.7080,
    longitude: -74.0100
  },
  {
    address: "789 Shopping Mall, Midtown",
    label: "Mall",
    latitude: 40.7180,
    longitude: -74.0020
  },
  {
    address: "321 University Campus",
    label: "School",
    latitude: 40.7200,
    longitude: -73.9950
  }
];

// Mock rides data
export const mockRides: Ride[] = [
  {
    id: "ride_001",
    type: "ride",
    from: mockLocations[0],
    to: mockLocations[1],
    customer_name: "John Doe",
    driver_name: "Mike Johnson",
    status: "completed",
    amount: 25.50,
    formatted_amount: "$25.50",
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updated_at: new Date(Date.now() - 3400000).toISOString(),
    eta: 15,
    rating: 4.5,
    distance: 5.2,
    duration: 18
  },
  {
    id: "ride_002", 
    type: "delivery",
    from: mockLocations[2],
    to: mockLocations[0],
    customer_name: "Sarah Smith",
    driver_name: "Alex Brown",
    status: "active",
    amount: 12.75,
    formatted_amount: "$12.75",
    created_at: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    updated_at: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
    eta: 10,
    distance: 2.1,
    duration: 8
  },
  {
    id: "ride_003",
    type: "ride", 
    from: mockLocations[3],
    to: mockLocations[2],
    customer_name: "David Wilson",
    status: "pending",
    amount: 18.25,
    formatted_amount: "$18.25",
    created_at: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
    updated_at: new Date(Date.now() - 600000).toISOString(),
    distance: 3.8,
    duration: 12
  }
];

// Mock ride stats
export const mockRideStats: RideStats = {
  total_rides: 156,
  completed_rides: 148,
  cancelled_rides: 8,
  total_earnings: 2847.50,
  formatted_earnings: "$2,847.50",
  average_rating: 4.7
};

// Mock driver requests
export const mockDriverRequests: DriverRequest[] = [
  {
    id: "req_001",
    type: "ride",
    pickup: mockLocations[0],
    dropoff: mockLocations[1], 
    customer_name: "Emma Davis",
    estimated_time: "12 mins",
    distance: 4.2,
    amount: 22.00,
    formatted_amount: "$22.00"
  },
  {
    id: "req_002",
    type: "delivery",
    pickup: mockLocations[2],
    dropoff: mockLocations[3],
    customer_name: "Robert Taylor",
    estimated_time: "8 mins",
    distance: 1.9,
    amount: 15.50,
    formatted_amount: "$15.50"
  }
];

// Mock wallet balance
export const mockWalletBalance: WalletBalance = {
  balance: 342.75,
  currency: "USD",
  formatted: "$342.75"
};

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: "txn_001",
    type: "ride_payment",
    amount: 25.50,
    currency: "USD",
    formatted_amount: "+$25.50",
    description: "Ride payment from Main St to Business Ave",
    date: new Date(Date.now() - 3600000).toISOString().split('T')[0],
    time: new Date(Date.now() - 3600000).toLocaleTimeString(),
    status: "completed",
    reference: "ride_001"
  },
  {
    id: "txn_002", 
    type: "delivery_payment",
    amount: 12.75,
    currency: "USD",
    formatted_amount: "+$12.75",
    description: "Delivery payment from Shopping Mall",
    date: new Date(Date.now() - 1800000).toISOString().split('T')[0],
    time: new Date(Date.now() - 1800000).toLocaleTimeString(),
    status: "completed",
    reference: "ride_002"
  },
  {
    id: "txn_003",
    type: "withdrawal",
    amount: -50.00,
    currency: "USD", 
    formatted_amount: "-$50.00",
    description: "Withdrawal to bank account ending in 4567",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 1 day ago
    time: new Date(Date.now() - 86400000).toLocaleTimeString(),
    status: "completed",
    reference: "wd_001"
  },
  {
    id: "txn_004",
    type: "top_up",
    amount: 100.00,
    currency: "USD",
    formatted_amount: "+$100.00", 
    description: "Wallet top-up via credit card",
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    time: new Date(Date.now() - 172800000).toLocaleTimeString(),
    status: "completed",
    reference: "top_001"
  }
];

// Mock wallet data
export const mockWalletData: WalletData = {
  balance: mockWalletBalance,
  transactions: mockTransactions
};

// Mock user profiles based on roles
export const mockUserProfiles = {
  rider: {
    id: "user_rider_001",
    email: "rider@example.com",
    full_name: "Jane Rider",
    role: "rider",
    is_active: true,
    is_superuser: false,
    total_rides: 45,
    favorite_locations: mockLocations.slice(0, 2)
  },
  driver: {
    id: "user_driver_001", 
    email: "driver@example.com",
    full_name: "Mark Driver",
    role: "driver",
    is_active: true,
    is_superuser: false,
    ...mockRideStats,
    vehicle_info: {
      make: "Toyota",
      model: "Camry",
      year: 2020,
      license_plate: "ABC-123"
    }
  },
  courier: {
    id: "user_courier_001",
    email: "courier@example.com", 
    full_name: "Lisa Courier",
    role: "courier",
    is_active: true,
    is_superuser: false,
    ...mockRideStats,
    delivery_stats: {
      packages_delivered: 234,
      on_time_rate: 98.5
    }
  }
};

// Helper functions to generate dynamic mock data
export const generateMockRide = (overrides: Partial<Ride> = {}): Ride => {
  const baseRide: Ride = {
    id: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: Math.random() > 0.7 ? "delivery" : "ride",
    from: mockLocations[Math.floor(Math.random() * mockLocations.length)],
    to: mockLocations[Math.floor(Math.random() * mockLocations.length)],
    customer_name: [
      "John Doe", "Sarah Smith", "Mike Johnson", "Emma Davis", 
      "Robert Taylor", "Lisa Anderson", "David Wilson"
    ][Math.floor(Math.random() * 7)],
    status: ["active", "completed", "pending"][Math.floor(Math.random() * 3)] as any,
    amount: Math.round((Math.random() * 40 + 10) * 100) / 100,
    created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Within last week
    updated_at: new Date().toISOString(),
    distance: Math.round((Math.random() * 10 + 1) * 100) / 100,
    duration: Math.round(Math.random() * 30 + 5)
  };
  
  baseRide.formatted_amount = `$${baseRide.amount.toFixed(2)}`;
  baseRide.eta = Math.round(baseRide.duration! * 0.8);
  
  if (baseRide.status === 'completed') {
    baseRide.rating = Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 - 5.0
    baseRide.driver_name = [
      "Alex Brown", "Chris Green", "Jordan Blue", "Taylor White"
    ][Math.floor(Math.random() * 4)];
  }

  return { ...baseRide, ...overrides };
};

export const generateMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => {
  const types: Transaction['type'][] = ['ride_payment', 'delivery_payment', 'top_up', 'withdrawal', 'refund'];
  const type = types[Math.floor(Math.random() * types.length)];
  const amount = Math.round((Math.random() * 50 + 5) * 100) / 100;
  const isNegative = ['withdrawal'].includes(type);
  
  const baseTransaction: Transaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    amount: isNegative ? -amount : amount,
    currency: "USD",
    formatted_amount: `${isNegative ? '-' : '+'}$${amount.toFixed(2)}`,
    description: `Mock ${type.replace('_', ' ')} transaction`,
    date: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().split('T')[0], // Within last month
    time: new Date().toLocaleTimeString(),
    status: Math.random() > 0.1 ? "completed" : "pending",
    reference: `ref_${Math.random().toString(36).substr(2, 6)}`
  };

  return { ...baseTransaction, ...overrides };
};

// Check if we should use mock data (when API is unavailable)
export const shouldUseMockData = (): boolean => {
  return process.env.EXPO_PUBLIC_DEV_MODE === 'true' || false;
};
