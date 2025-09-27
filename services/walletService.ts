import { BaseApiService, ApiResponse } from './api';

export interface WalletBalance {
  balance: number;
  currency: string;
  formatted: string;
}

export interface Transaction {
  id: string;
  type: 'ride_payment' | 'top_up' | 'withdrawal' | 'delivery_payment' | 'refund';
  amount: number;
  currency: string;
  formatted_amount: string;
  description: string;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

export interface WalletData {
  balance: WalletBalance;
  transactions: Transaction[];
}

export interface TopUpRequest {
  amount: number;
  payment_method: string;
}

export interface WithdrawalRequest {
  amount: number;
  bank_account: string;
}

export interface RidePaymentRequest {
  rideId: string;
  amount: number;
  driverId: string;
  fareBreakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    serviceFee: number;
    discount?: number;
    total: number;
  };
}

export interface PaymentResult {
  transactionId: string;
  riderBalance: number;
  driverBalance?: number;
  timestamp: string;
}

class WalletApiService extends BaseApiService {
  // Get wallet balance and recent transactions
  async getWalletData(): Promise<ApiResponse<WalletData>> {
    return this.get<WalletData>('/api/v1/wallet');
  }

  // Get wallet balance only
  async getBalance(): Promise<ApiResponse<WalletBalance>> {
    return this.get<WalletBalance>('/api/v1/wallet/balance');
  }

  // Get transaction history with pagination
  async getTransactions(page: number = 1, limit: number = 20): Promise<ApiResponse<Transaction[]>> {
    return this.get<Transaction[]>(`/api/v1/wallet/transactions?page=${page}&limit=${limit}`);
  }

  // Top up wallet
  async topUp(data: TopUpRequest): Promise<ApiResponse<any>> {
    return this.post('/api/v1/wallet/top-up', data);
  }

  // Withdraw from wallet
  async withdraw(data: WithdrawalRequest): Promise<ApiResponse<any>> {
    return this.post('/api/v1/wallet/withdraw', data);
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    return this.get<Transaction>(`/api/v1/wallet/transactions/${transactionId}`);
  }

  // Process ride payment (deduct from rider, credit to driver)
  async processRidePayment(data: RidePaymentRequest): Promise<ApiResponse<PaymentResult>> {
    // In mock mode, simulate the payment process
    if (this.shouldUseMockMode()) {
      return this.mockProcessRidePayment(data);
    }

    try {
      return await this.post<PaymentResult>('/api/v1/wallet/ride-payment', data);
    } catch (error) {
      console.warn('⚠️ Wallet Service: processRidePayment failed, falling back to mock');
      return this.mockProcessRidePayment(data);
    }
  }

  // Calculate ride fare based on distance, time, and type
  calculateRideFare(distance: number, duration: number, rideType: 'standard' | 'premium' | 'delivery'): number {
    let baseFare = 200; // Base fare in Naira
    let perKmRate = 80; // Per km rate
    let perMinRate = 10; // Per minute rate

    // Adjust rates based on ride type
    switch (rideType) {
      case 'premium':
        baseFare = 350;
        perKmRate = 120;
        perMinRate = 15;
        break;
      case 'delivery':
        baseFare = 150;
        perKmRate = 60;
        perMinRate = 8;
        break;
      default: // standard
        break;
    }

    const distanceFare = distance * perKmRate;
    const timeFare = duration * perMinRate;
    const subtotal = baseFare + distanceFare + timeFare;
    const serviceFee = Math.round(subtotal * 0.1); // 10% service fee
    
    return subtotal + serviceFee;
  }

  // Get detailed fare breakdown
  getFareBreakdown(distance: number, duration: number, rideType: 'standard' | 'premium' | 'delivery') {
    let baseFare = 200;
    let perKmRate = 80;
    let perMinRate = 10;

    switch (rideType) {
      case 'premium':
        baseFare = 350;
        perKmRate = 120;
        perMinRate = 15;
        break;
      case 'delivery':
        baseFare = 150;
        perKmRate = 60;
        perMinRate = 8;
        break;
    }

    const distanceFare = distance * perKmRate;
    const timeFare = duration * perMinRate;
    const subtotal = baseFare + distanceFare + timeFare;
    const serviceFee = Math.round(subtotal * 0.1);
    const total = subtotal + serviceFee;

    return {
      baseFare,
      distanceFare,
      timeFare,
      serviceFee,
      discount: 0,
      total,
      formattedTotal: `₦${total.toFixed(2)}`
    };
  }

  // Private helper to check if should use mock mode
  private shouldUseMockMode(): boolean {
    // This would check if backend is healthy, similar to healthService
    return true; // For now, always use mock mode
  }

  // Mock implementation for ride payment
  private async mockProcessRidePayment(data: RidePaymentRequest): Promise<ApiResponse<PaymentResult>> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing delay

    console.log('💳 Mock payment processing:', {
      rideId: data.rideId,
      amount: data.amount,
      driverId: data.driverId
    });

    // Generate mock transaction ID
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Mock balances (in real implementation, these would come from database)
    const mockRiderBalance = 5000 - data.amount; // Assuming rider had ₦5000
    const mockDriverBalance = 2000 + (data.amount * 0.85); // Driver gets 85% after platform fee

    const result: PaymentResult = {
      transactionId,
      riderBalance: mockRiderBalance,
      driverBalance: mockDriverBalance,
      timestamp: new Date().toISOString()
    };

    // Create mock transaction records
    this.createMockTransactionRecords(data, transactionId);

    return {
      data: result,
      success: true,
      message: 'Ride payment processed successfully (mock)'
    };
  }

  // Create mock transaction records for rider and driver
  private createMockTransactionRecords(payment: RidePaymentRequest, transactionId: string) {
    const timestamp = new Date();
    const dateStr = timestamp.toLocaleDateString();
    const timeStr = timestamp.toLocaleTimeString();

    // Rider debit transaction
    const riderTransaction: Transaction = {
      id: `${transactionId}_rider`,
      type: 'ride_payment',
      amount: payment.amount,
      currency: 'NGN',
      formatted_amount: `-₦${payment.amount.toFixed(2)}`,
      description: `Ride payment for trip ${payment.rideId.slice(-6)}`,
      date: dateStr,
      time: timeStr,
      status: 'completed',
      reference: transactionId
    };

    // Driver credit transaction
    const driverEarnings = payment.amount * 0.85; // 85% to driver, 15% platform fee
    const driverTransaction: Transaction = {
      id: `${transactionId}_driver`,
      type: 'ride_payment',
      amount: driverEarnings,
      currency: 'NGN',
      formatted_amount: `+₦${driverEarnings.toFixed(2)}`,
      description: `Ride earnings for trip ${payment.rideId.slice(-6)}`,
      date: dateStr,
      time: timeStr,
      status: 'completed',
      reference: transactionId
    };

    console.log('📝 Created mock transaction records:', {
      rider: riderTransaction,
      driver: driverTransaction
    });
  }
}

export const walletService = new WalletApiService();
