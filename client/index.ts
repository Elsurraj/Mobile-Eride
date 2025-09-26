import axios, { AxiosInstance, AxiosError } from 'axios';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
};

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await enhancedTokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear invalid token
      await enhancedTokenManager.clearToken();
      // You might want to redirect to login screen here
    }
    return Promise.reject(error);
  }
);

// API Error class
export class ApiError extends Error {
  public status: number;
  public statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

// Helper function to create API error from axios error
export const createApiError = (error: AxiosError): ApiError => {
  return new ApiError(
    error.message || 'An API error occurred',
    error.response?.status || 500,
    error.response?.statusText || 'Unknown Error'
  );
};

export default apiClient;
