import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear invalid token
        await enhancedTokenManager.clearAllData();
        
        // You could implement token refresh logic here
        // For now, we'll just clear the token and let the app redirect to login
        
        return Promise.reject(error);
      } catch (refreshError) {
        await enhancedTokenManager.clearAllData();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}

// Generic API error type
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

// Base API service class
export class BaseApiService {
  protected async request<T = any>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiClient(config);
      return {
        data: response.data,
        success: true,
        message: 'Request successful',
      };
    } catch (error: any) {
      console.error('API Request Error:', error);
      
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        status: error.response?.status || 500,
        details: error.response?.data,
      };

      return {
        data: null,
        success: false,
        error: apiError.message,
      };
    }
  }

  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  protected async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  protected async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export default apiClient;
