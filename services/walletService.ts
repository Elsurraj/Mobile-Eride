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
}

export const walletService = new WalletApiService();
