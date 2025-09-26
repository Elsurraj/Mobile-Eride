import { ApiResponse } from './api';

interface HealthStatus {
  isHealthy: boolean;
  useMockMode: boolean;
  lastChecked: Date;
  error?: string;
}

class HealthService {
  private static instance: HealthService;
  private healthStatus: HealthStatus = {
    isHealthy: false,
    useMockMode: true,
    lastChecked: new Date(),
  };
  private forceMode: 'real' | 'mock' | null = null;

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  /**
   * Force the app to use either real or mock mode
   * Useful for testing and QA scenarios
   */
  setForceMode(mode: 'real' | 'mock' | null): void {
    this.forceMode = mode;
    console.log(`🔧 Health Service: Force mode set to ${mode}`);
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Check if we should use mock mode
   */
  shouldUseMockMode(): boolean {
    if (this.forceMode) {
      return this.forceMode === 'mock';
    }
    return this.healthStatus.useMockMode;
  }

  /**
   * Perform health check against backend
   */
  async performHealthCheck(timeout: number = 5000): Promise<HealthStatus> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL;
    
    if (!baseUrl) {
      console.warn('⚠️ Health Service: No EXPO_PUBLIC_API_URL configured, using mock mode');
      this.healthStatus = {
        isHealthy: false,
        useMockMode: true,
        lastChecked: new Date(),
        error: 'No API URL configured'
      };
      return this.healthStatus;
    }

    console.log(`🩺 Health Service: Checking backend health at ${baseUrl}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/api/v1/utils/health-check/`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      const isHealthy = response.ok;
      
      if (isHealthy) {
        const data = await response.json();
        console.log(`✅ Health Service: Backend is healthy - ${data.message}`);
        this.healthStatus = {
          isHealthy: true,
          useMockMode: this.forceMode === 'mock',
          lastChecked: new Date(),
        };
      } else {
        console.warn(`⚠️ Health Service: Backend returned status ${response.status}`);
        this.healthStatus = {
          isHealthy: false,
          useMockMode: true,
          lastChecked: new Date(),
          error: `Backend returned status ${response.status}`
        };
      }
    } catch (error: any) {
      console.warn('⚠️ Health Service: Backend health check failed, switching to mock mode');
      console.warn('Error:', error.message);
      this.healthStatus = {
        isHealthy: false,
        useMockMode: true,
        lastChecked: new Date(),
        error: error.message
      };
    }

    return this.healthStatus;
  }

  /**
   * Quick health check on app startup
   */
  async quickHealthCheck(): Promise<boolean> {
    if (this.forceMode) {
      return this.forceMode === 'real';
    }

    try {
      const status = await this.performHealthCheck(3000); // Quick 3 second timeout
      return status.isHealthy;
    } catch {
      return false;
    }
  }
}

export const healthService = HealthService.getInstance();
export type { HealthStatus };
