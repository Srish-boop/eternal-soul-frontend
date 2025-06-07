/**
 * Admin API client with localStorage-based authentication
 */

import { API_CONFIG } from '@/config/api';

export interface AdminApiError {
  message: string;
  type: 'validation_error' | 'authentication_error' | 'server_error' | 'network_error';
  userMessage: string;
}

export interface AdminLoginResponse {
  admin_email: string;
  admin_name: string;
  default_birth_data: any;
  message: string;
}

export class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, create a generic error
        errorData = {
          error: 'Network Error',
          message: 'Unable to connect to admin server',
          type: 'network_error'
        };
      }

      const adminError: AdminApiError = {
        message: errorData.message || errorData.error || 'Unknown admin error',
        type: errorData.type || 'server_error',
        userMessage: this.getAdminFriendlyMessage(errorData.type, errorData.message)
      };

      throw adminError;
    }

    return response.json();
  }

  private getAdminFriendlyMessage(errorType: string, originalMessage: string): string {
    switch (errorType) {
      case 'authentication_error':
        if (originalMessage.includes('session required') || originalMessage.includes('Unauthorized')) {
          return '🔒 Admin session expired. Please log in again.';
        }
        if (originalMessage.includes('credentials') || originalMessage.includes('password')) {
          return '❌ Invalid admin email or password. Please check your credentials.';
        }
        return '🔐 Authentication failed. Please try logging in again.';

      case 'validation_error':
        if (originalMessage.includes('email')) {
          return '📧 Please enter a valid admin email address.';
        }
        if (originalMessage.includes('password')) {
          return '🔑 Please enter your admin password.';
        }
        return `⚠️ ${originalMessage}`;

      case 'network_error':
        return '🌐 Cannot connect to admin server. Please check your connection.';

      case 'server_error':
        return '⚡ Admin server error. Please try again or contact support.';

      default:
        return `❓ ${originalMessage}`;
    }
  }

  /**
   * Admin login with email and password
   */
  async login(adminEmail: string, password: string): Promise<AdminLoginResponse> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.adminLogin}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for session management
      body: JSON.stringify({
        admin_email: adminEmail,
        password: password,
      }),
    });

    return this.handleResponse<AdminLoginResponse>(response);
  }

  /**
   * Get all users (real + mock)
   */
  async getUsers(): Promise<any> {
  // Get admin data from localStorage
  const adminSession = localStorage.getItem('eternal_soul_admin_session');
  const adminData = adminSession ? JSON.parse(adminSession) : null;
  
  const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.adminUsers}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'X-Admin-Email': adminData?.admin_email || '',  // Send admin email in header
    },
  });

  return this.handleResponse(response);
}
  /**
   * Create mock user
   */
  async createMockUser(userData: {
    name: string;
    birthdate: string;
    birthtime: string;
    birth_location: string;
    timezone: string;
    latitude?: number;
    longitude?: number;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.adminCreateMockUser}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    return this.handleResponse(response);
  }

  /**
   * Get complete user data
   */
  async getUserCompleteData(userId: string, userType: 'real' | 'mock'): Promise<any> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.adminUserCompleteData}/${userId}/${userType}`, {
      method: 'GET',
      credentials: 'include',
    });

    return this.handleResponse(response);
  }

  /**
   * Get analytics
   */
  async getAnalytics(): Promise<any> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.adminAnalytics}`, {
      method: 'GET',
      credentials: 'include',
    });

    return this.handleResponse(response);
  }
}

// Export a singleton instance
export const adminApiClient = new AdminApiClient(); 